import type { AudioPlayer } from 'expo-audio'

/** How loud and how fast one play is. */
export type PlayOptions = {
  /** 0 (silent) to 1 (the clip as recorded). Default 1. */
  volume?: number
  /**
   * Playback speed, which moves the pitch with it, like a tape played faster or slower: 2 is an
   * octave up and twice as fast. Clamped to 0.5-2 (iOS caps it at 2). Default 1.
   */
  rate?: number
}

/** Plays one clip. Called with no options, it plays at full volume and normal speed. */
export type PlayAudio = (options?: PlayOptions) => void

export const MIN_PLAYBACK_RATE = 0.5
export const MAX_PLAYBACK_RATE = 2

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function clampVolume(volume: unknown): number {
  return Math.min(1, Math.max(0, finiteOr(volume, 1)))
}

export function clampRate(rate: unknown): number {
  return Math.min(MAX_PLAYBACK_RATE, Math.max(MIN_PLAYBACK_RATE, finiteOr(rate, 1)))
}

/**
 * Reads a play's options defensively: a play function handed straight to an event prop
 * (`onPress={play}`) gets the event object, which must play the clip as if called with nothing.
 */
export function readPlayOptions(options: unknown): { volume: number; rate: number } {
  const o = typeof options === 'object' && options !== null ? (options as PlayOptions) : undefined
  return { volume: clampVolume(o?.volume), rate: clampRate(o?.rate) }
}

/** A player and the volume and rate last written to it, so an unchanged level costs no native call. */
export type LevelledPlayer = {
  player: AudioPlayer
  volume: number
  rate: number
}

/**
 * Creates a player whose rate shifts its pitch (iOS and Android otherwise keep the pitch and
 * stretch the sound instead), at full volume and normal speed.
 */
export function prepareLevelledPlayer(player: AudioPlayer): LevelledPlayer {
  player.shouldCorrectPitch = false
  return { player, volume: 1, rate: 1 }
}

/**
 * Writes a volume and rate, skipping whichever already holds. The rate is per player and persists
 * between plays, so a pool sets it on every play rather than once. A rate set while the player is
 * paused waits for the next play() on every platform; it never starts playback by itself.
 */
export function applyLevel(entry: LevelledPlayer, volume: number, rate: number): void {
  if (entry.volume !== volume) {
    entry.player.volume = volume
    entry.volume = volume
  }
  if (entry.rate !== rate) {
    entry.player.setPlaybackRate(rate)
    entry.rate = rate
  }
}
