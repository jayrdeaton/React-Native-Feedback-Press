import { type AudioPlayer, type AudioSource, createAudioPlayer } from 'expo-audio'
import { useCallback, useEffect, useRef } from 'react'

export type AudioPoolOptions = {
  /**
   * How many independent players to create. Clamped to [1, MAX_POOL_SIZE]. Defaults to 4 - enough
   * that a fast double/triple-tap lands on a fresh, idle player instead of racing one still
   * mid-playback, without allocating more native players than realistic UI tapping ever needs
   * concurrently. Real allocation, not a fixed ceiling: `poolSize: 1` creates exactly one player.
   */
  poolSize?: number
}

const DEFAULT_POOL_SIZE = 4

// A sanity ceiling, not a technical one - createAudioPlayer is a plain factory (not a hook), so
// nothing structurally caps how many can be created in a loop. This just guards against a typo'd
// or user-input-driven poolSize (e.g. poolSize: 400) accidentally allocating hundreds of native
// players. 16 comfortably covers even an aggressive rapid-fire SFX case with room to spare.
const MAX_POOL_SIZE = 16

function clampPoolSize(size: number): number {
  return Math.min(MAX_POOL_SIZE, Math.max(1, Math.round(size)))
}

// Deferred a tick via setTimeout, seekTo(0) before play() — expo-audio's play() blocks the
// native UI thread synchronously on Android, so firing it inline from a press handler adds that
// round-trip latency to the very state update the press triggers. seekTo(0) restarts a clip
// that's already playing or finished instead of no-oping.
function triggerPlayback(player: AudioPlayer) {
  setTimeout(() => {
    void player.seekTo(0).then(() => player.play())
  }, 0)
}

/**
 * A single `AudioPlayer` retriggered rapidly races itself: a second press's `seekTo(0)` can reset
 * playback position out from under the first press's still-in-flight `play()` call, silently
 * aborting it - the sound never plays for that press at all, rather than merely overlapping or
 * cutting short. `useAudioPool` sidesteps this by round-robining across a small pool of
 * independent players instead of sharing one, so overlapping presses land on different players
 * and never race each other's `seekTo`/`play`.
 *
 * Built on `createAudioPlayer` - a plain factory, not `useAudioPlayer` the hook - specifically so
 * exactly `poolSize` players get created, not a fixed maximum regardless of what's requested. A
 * hook can't be called a variable number of times (rules of hooks), but a plain function can be
 * called in an ordinary loop, so a rarely-retriggered sound can ask for `poolSize: 1` and
 * genuinely allocate one native player rather than paying for headroom it never uses.
 *
 * Returns a single `() => void` play function - call `useAudioPool` once per distinct clip, the
 * same way you'd call `useAudioPlayer` once per clip.
 */
export function useAudioPool(source: AudioSource, options?: AudioPoolOptions): () => void {
  const poolSize = clampPoolSize(options?.poolSize ?? DEFAULT_POOL_SIZE)
  const playersRef = useRef<AudioPlayer[]>([])
  const nextIndex = useRef(0)

  // Runs after commit, before any event handler (including the play function below) can possibly
  // fire, so playersRef.current is never read empty in practice. Rebuilds the whole pool from
  // scratch on any source/poolSize change rather than trying to grow/shrink the existing one in
  // place - these are essentially always static requires in practice, so simplicity wins over
  // preserving in-flight players across a change that shouldn't happen after mount anyway.
  useEffect(() => {
    const players = Array.from({ length: poolSize }, () => createAudioPlayer(source))
    playersRef.current = players
    nextIndex.current = 0
    return () => {
      players.forEach((player) => player.remove())
      playersRef.current = []
    }
  }, [source, poolSize])

  return useCallback(() => {
    const players = playersRef.current
    if (players.length === 0) return
    const player = players[nextIndex.current]
    nextIndex.current = (nextIndex.current + 1) % players.length
    triggerPlayback(player)
  }, [])
}
