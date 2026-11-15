import { type AudioSource, createAudioPlayer } from 'expo-audio'
import { useCallback, useEffect, useRef } from 'react'

import { applyLevel, type LevelledPlayer, type PlayAudio, prepareLevelledPlayer, readPlayOptions } from './audioLevel'
import { prepareAudioSession } from './audioSession'

export type AudioPoolOptions = {
  /**
   * How many independent players to create. Clamped to [1, MAX_POOL_SIZE]. Defaults to 4 - enough
   * that a fast double/triple-tap lands on a fresh, idle player instead of racing one still
   * mid-playback, without allocating more native players than realistic UI tapping ever needs
   * concurrently. Real allocation, not a fixed ceiling: `poolSize: 1` creates exactly one player.
   */
  poolSize?: number
  /**
   * Whether this pool configures the shared expo-audio session for UI sound effects the first
   * time any pool mounts, via `setAudioModeAsync({ interruptionMode: 'mixWithOthers',
   * playsInSilentMode: false })`, which iOS maps to the `.ambient` category: sound effects mix
   * with the user's music/podcast and go quiet when the Ring/Silent switch is on, the standard
   * behavior for game and UI sounds. Without it, iOS defaults to a `.soloAmbient` session that
   * stops the user's music/podcast and pays a session-negotiation delay on every press. Set to `false`
   * on a pool if the host app already manages `setAudioModeAsync` itself elsewhere and no pool
   * should touch it. Because the setting this gates is a process-wide singleton rather than
   * something scoped to one pool, opting out is process-wide too: once any pool mounts with
   * `configureAudioSession: false`, no pool (including ones that omit this option) will call
   * `setAudioModeAsync` for the rest of the app's lifetime. This only protects a session that
   * hasn't been configured yet, though - it can't undo a call that already happened because a
   * default (`true`) pool mounted first, so put the opted-out pool as early in mount order as
   * you can (e.g. alongside `FeedbackPressProvider`) if you rely on this. Default `true`.
   */
  configureAudioSession?: boolean
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

/** One pooled player, the level last written to it, and whether it is rewound and ready to play from the start. */
type PooledPlayer = LevelledPlayer & {
  /** True while the player sits at 0 with nothing playing, so a trigger only has to call play(). */
  atStart: boolean
  /** Bumped by every trigger, so a rewind that finishes after a newer trigger can't mark a playing player as ready. */
  plays: number
  finished: { remove(): void }
}

// Rewinds a player whose clip just finished, ready for its next turn. The rewind used to be part of
// every trigger (seekTo(0), then play() once the seek resolved), and a seek resolves at uneven times
// (AVPlayer's completion handler, then the bridge back to JS), so a steady run of triggers - a card
// deal's beat - came out as uneven sounds. Done here, after the clip, it is long finished by the time
// the round robin comes back to this player.
//
// It pauses before it seeks. On Android a finished clip is still playing as far as the player knows:
// expo-audio's ExoPlayer stays playWhenReady at its end, so a bare seekTo(0) starts the clip over, it
// finishes again, rewinds again, and every player that ever played loops for good (Android, 2026-11-14:
// noise that never stopped, even with Sound turned off). iOS and the web already stop at the end, so
// there the pause changes nothing.
function rewind(entry: PooledPlayer) {
  const plays = entry.plays
  entry.player.pause()
  void entry.player.seekTo(0).then(() => {
    if (entry.plays === plays) entry.atStart = true
  })
}

// Deferred a tick via setTimeout - expo-audio's play() blocks the native UI thread synchronously on
// Android, so firing it inline from a press handler adds that round-trip latency to the very state
// update the press triggers. A rewound player (atStart) just plays: no seek, so the sound starts a
// steady delay after its trigger. One that isn't (still playing, or its rewind hasn't resolved - a
// pool too small for how fast it's triggered) seeks to 0 first, which restarts a clip that's already
// playing or finished instead of no-oping. The play's volume and rate are written first, in the same
// deferred tick, and only when they differ from the player's last play.
function triggerPlayback(entry: PooledPlayer, volume: number, rate: number) {
  entry.plays += 1
  const ready = entry.atStart
  entry.atStart = false
  setTimeout(() => {
    applyLevel(entry, volume, rate)
    if (ready) entry.player.play()
    else void entry.player.seekTo(0).then(() => entry.player.play())
  }, 0)
}

/**
 * A single `AudioPlayer` retriggered rapidly races itself: a second press's `seekTo(0)` can reset
 * playback position out from under the first press's still-in-flight `play()` call, silently
 * aborting it - the sound never plays for that press at all, rather than merely overlapping or
 * cutting short. `useAudioPool` sidesteps this by round-robining across a small pool of
 * independent players instead of sharing one, so overlapping presses land on different players
 * and never race each other's `seekTo`/`play`. Each player rewinds as soon as its clip finishes,
 * so a trigger normally only calls `play()` and the sound starts a steady delay after it: a run of
 * evenly spaced triggers plays evenly spaced.
 *
 * Built on `createAudioPlayer` - a plain factory, not `useAudioPlayer` the hook - specifically so
 * exactly `poolSize` players get created, not a fixed maximum regardless of what's requested. A
 * hook can't be called a variable number of times (rules of hooks), but a plain function can be
 * called in an ordinary loop, so a rarely-retriggered sound can ask for `poolSize: 1` and
 * genuinely allocate one native player rather than paying for headroom it never uses.
 *
 * Returns a single play function - call `useAudioPool` once per distinct clip, the same way you'd
 * call `useAudioPlayer` once per clip. Each play can set its own volume and rate (`PlayOptions`):
 * an impact louder the harder it lands, or a clip pitched a little differently each time so a
 * repeated sound doesn't grate.
 *
 * Also configures the shared audio session by default - see `configureAudioSession` on
 * `AudioPoolOptions`.
 */
export function useAudioPool(source: AudioSource, options?: AudioPoolOptions): PlayAudio {
  const poolSize = clampPoolSize(options?.poolSize ?? DEFAULT_POOL_SIZE)
  const playersRef = useRef<PooledPlayer[]>([])
  const nextIndex = useRef(0)

  // Pool creation is pushed one tick out via setTimeout rather than run inline in the effect. A
  // screen that mounts many pools at once (e.g. the feedback-press demo's 42-sound sampler, 168
  // players total) would otherwise run every createAudioPlayer call synchronously in the same
  // commit-phase effect, blocking the JS thread right as the screen becomes interactive. Deferring
  // lets the screen finish mounting first; a human tap can't outrace a 0ms timer. Rebuilds the
  // whole pool from scratch on any source/poolSize change rather than trying to grow/shrink the
  // existing one in place - these are essentially always static requires in practice, so
  // simplicity wins over preserving in-flight players across a change that shouldn't happen after
  // mount anyway.
  useEffect(() => {
    let players: PooledPlayer[] = []
    let cancelled = false
    const timer = setTimeout(async () => {
      await prepareAudioSession(options?.configureAudioSession)
      if (cancelled) return
      // keepAudioSessionActive: true - without it, expo-audio tears the shared AVAudioSession
      // down (with a ~100ms delay) once every pooled player finishes and rebuilds it fresh on
      // the next play(). That teardown/rebuild is exactly the kind of per-press latency this
      // pool exists to avoid, and it's most visible on short clips (a few tens of ms) where the
      // session's own activation cost can eat into or outlast the clip itself. The session is a
      // per-process singleton anyway, so there's no isolation benefit to letting each pooled
      // player deactivate it independently - keep it warm for as long as the pool is mounted.
      players = Array.from({ length: poolSize }, () => {
        const player = createAudioPlayer(source, { keepAudioSessionActive: true })
        // A new player starts at 0, so its first trigger can play straight away.
        const entry: PooledPlayer = { ...prepareLevelledPlayer(player), atStart: true, plays: 0, finished: { remove() {} } }
        entry.finished = player.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) rewind(entry)
        })
        return entry
      })
      playersRef.current = players
      nextIndex.current = 0
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
      players.forEach((entry) => {
        entry.finished.remove()
        entry.player.remove()
      })
      playersRef.current = []
    }
  }, [source, poolSize, options?.configureAudioSession])

  return useCallback<PlayAudio>((play) => {
    const players = playersRef.current
    if (players.length === 0) return
    const entry = players[nextIndex.current]
    nextIndex.current = (nextIndex.current + 1) % players.length
    const { volume, rate } = readPlayOptions(play)
    triggerPlayback(entry, volume, rate)
  }, [])
}
