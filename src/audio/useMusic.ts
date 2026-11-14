import type { AudioSource } from 'expo-audio'
import { useEffect, useRef } from 'react'

import { useMusicSettings } from '../useMusicSettings'
import { LEVEL_MIN_INTERVAL_MS, type LoopingAudioOptions, useLoopingAudio } from './useLoopingAudio'

export type MusicOptions = LoopingAudioOptions & {
  /** How long a change of volume takes, in ms, including starting and stopping. Default `MUSIC_FADE_MS`. */
  fadeMs?: number
}

/** How long `useMusic` takes to fade from one volume to another by default. */
export const MUSIC_FADE_MS = 800

/**
 * A music track: `source` loops at `volume` (0 to 1) while the Music setting is on, and is silent
 * while it's off. A change of volume fades over `fadeMs`, so switching tracks is two of these, one
 * going to 0 and the other up (a menu track and a battle track, each at 0 while the other plays);
 * 0 pauses the track once it has faded out, and it picks up where it left off. Turning Music off
 * silences it at once. Separate from Sound: sound effects and music each have their own setting.
 * The loop should be made to repeat seamlessly; the players loop gaplessly on iOS and Android.
 */
export function useMusic(source: AudioSource, volume: number, options?: MusicOptions): void {
  const { settings } = useMusicSettings()
  const loop = useLoopingAudio(source, options)
  const fadeMs = options?.fadeMs ?? MUSIC_FADE_MS
  const level = useRef(0)

  const target = settings.enabled && Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0
  const enabled = settings.enabled

  useEffect(() => {
    // Turning Music off is at once, not a fade
    if (!enabled || fadeMs <= 0) {
      level.current = target
      loop.setLevel(target)
      return undefined
    }
    const from = level.current
    if (from === target) {
      loop.setLevel(target)
      return undefined
    }
    const start = Date.now()
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / fadeMs)
      level.current = from + (target - from) * t
      loop.setLevel(level.current)
      if (t >= 1) clearInterval(timer)
    }
    const timer = setInterval(step, LEVEL_MIN_INTERVAL_MS)
    step()
    return () => clearInterval(timer)
  }, [target, enabled, fadeMs, loop])
}
