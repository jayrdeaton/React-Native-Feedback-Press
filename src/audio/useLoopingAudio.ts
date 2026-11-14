import { type AudioSource, createAudioPlayer } from 'expo-audio'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { applyLevel, clampRate, clampVolume, type LevelledPlayer, prepareLevelledPlayer } from './audioLevel'
import { prepareAudioSession } from './audioSession'
import type { AudioPoolOptions } from './useAudioPool'

export type LoopingAudioOptions = Pick<AudioPoolOptions, 'configureAudioSession'>

/** A looping clip whose level follows something live, like a rolling ball's speed. */
export type LoopingAudio = {
  /**
   * How loud (0 to 1) and how fast (clamped like `PlayOptions.rate`, so the pitch moves with it)
   * the loop plays. Above 0 it plays, picking up where it paused; 0 silences it at once and pauses
   * it a moment later. Made to be called every frame: see `LEVEL_MIN_INTERVAL_MS`.
   */
  setLevel: (volume: number, rate?: number) => void
}

/**
 * Level changes reach the player at most this often (a fade this fine is inaudible), and only when
 * the volume or rate moved by at least LEVEL_EPSILON, so a per-frame caller costs a native call a
 * few times a second, not 60 or 120. Silence, and the first sound after it, are never held back.
 */
export const LEVEL_MIN_INTERVAL_MS = 50
const LEVEL_EPSILON = 0.01

/**
 * How long the loop stays silent before it is paused. A level that dips to 0 and straight back
 * (a ball brushing the speed it goes quiet at) only touches the volume, never play() and pause().
 */
export const PAUSE_AFTER_SILENCE_MS = 250

type LoopPlayer = LevelledPlayer & {
  playing: boolean
  lastWrite: number
  pauseTimer: ReturnType<typeof setTimeout> | null
}

function silence(loop: LoopPlayer) {
  if (!loop.playing) return
  applyLevel(loop, 0, loop.rate)
  if (loop.pauseTimer) return
  loop.pauseTimer = setTimeout(() => {
    loop.pauseTimer = null
    loop.player.pause()
    loop.playing = false
  }, PAUSE_AFTER_SILENCE_MS)
}

function sound(loop: LoopPlayer, volume: number, rate: number, now: number) {
  if (loop.pauseTimer) {
    clearTimeout(loop.pauseTimer)
    loop.pauseTimer = null
  }
  if (!loop.playing) {
    applyLevel(loop, volume, rate)
    loop.player.play()
    loop.playing = true
    loop.lastWrite = now
    return
  }
  // Silenced but not yet paused: the first sound back is never held back.
  if (loop.volume > 0 && now - loop.lastWrite < LEVEL_MIN_INTERVAL_MS) return
  if (Math.abs(loop.volume - volume) < LEVEL_EPSILON && Math.abs(loop.rate - rate) < LEVEL_EPSILON) return
  applyLevel(loop, volume, rate)
  loop.lastWrite = now
}

/**
 * One looping player whose volume and rate the caller drives, for a sound that runs continuously
 * and follows the game: a ball's roll, an engine, wind. Built like `useAudioPool`'s players
 * (deferred a tick after mount, the shared audio session configured first unless opted out, the
 * session kept active), and starts silent and paused; `setLevel` does the rest. A level set before
 * the player exists is applied as soon as it does.
 */
export function useLoopingAudio(source: AudioSource, options?: LoopingAudioOptions): LoopingAudio {
  const loopRef = useRef<LoopPlayer | null>(null)
  const wanted = useRef({ volume: 0, rate: 1 })

  useEffect(() => {
    let loop: LoopPlayer | null = null
    let cancelled = false
    const timer = setTimeout(async () => {
      await prepareAudioSession(options?.configureAudioSession)
      if (cancelled) return
      const player = createAudioPlayer(source, { keepAudioSessionActive: true })
      player.loop = true
      loop = { ...prepareLevelledPlayer(player), playing: false, lastWrite: 0, pauseTimer: null }
      loopRef.current = loop
      const { volume, rate } = wanted.current
      if (volume > 0) sound(loop, volume, rate, Date.now())
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
      if (loop) {
        if (loop.pauseTimer) clearTimeout(loop.pauseTimer)
        loop.player.remove()
      }
      loopRef.current = null
    }
  }, [source, options?.configureAudioSession])

  const setLevel = useCallback((volume: number, rate?: number) => {
    // A volume that isn't a number is silence here, never full volume.
    const v = Number.isFinite(volume) ? clampVolume(volume) : 0
    const r = clampRate(rate)
    wanted.current.volume = v
    wanted.current.rate = r
    const loop = loopRef.current
    if (!loop) return
    if (v > 0) sound(loop, v, r, Date.now())
    else silence(loop)
  }, [])

  return useMemo(() => ({ setLevel }), [setLevel])
}
