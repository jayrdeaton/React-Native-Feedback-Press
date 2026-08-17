import { useContext, useEffect, useRef } from 'react'

import type { SoundConfig } from './SoundContext'
import { SoundContext } from './SoundContext'
import type { FeedbackTrigger } from './useFeedbackHandlers'
import { useVibration } from './useVibration'

export type HoldToRepeatOptions = {
  /**
   * Which feedback event fires every time `action` runs — the initial long-press and every
   * repeat tick alike, not just the first press. Defaults to `'selection'`, the lightest-weight
   * choice for a cadence that repeats every `repeatMs`. Pass `false` to run the repeat loop with
   * no feedback at all.
   */
  feedback?: FeedbackTrigger | false
  /** Suppresses just the haptic half of `feedback`, keeping any configured sound. */
  hapticDisabled?: boolean
  /** Suppresses just the sound half of `feedback`, keeping the haptic — the independent counterpart to `hapticDisabled`. */
  soundDisabled?: boolean
  /** Overrides the provider's ambient `sound` config for just this hold-to-repeat loop's own feedback — same `{ selection?, notification? }` shape as `<FeedbackPressProvider sound>`, and the same per-instance override every wrapper component's own `sound` prop already gives. */
  sound?: SoundConfig
}

// Shared by both hooks below: fires the same haptic+sound pair useFeedbackHandlers gives a
// component's own onPressIn/onLongPress, but on demand rather than wired to a prop — the repeat
// loop itself is what decides when a tick "presses," so it's the one place that can call this.
function usePulse(options?: HoldToRepeatOptions) {
  const { selection, notification } = useVibration()
  const contextSound = useContext(SoundContext)
  const sound = options?.sound ?? contextSound
  const trigger = options?.feedback ?? 'selection'
  return () => {
    if (trigger === false) return
    if (!options?.hapticDisabled) (trigger === 'selection' ? selection : notification)()
    if (!options?.soundDisabled) sound[trigger]?.()
  }
}

// A plain `setInterval(action, repeatMs)` closes over whatever `action`/pulse were at the moment
// the hold *started* — but both are typically recreated on every render (a useCallback keyed on
// the very state it's about to change next, or this hook's own returned pulse identity). Every
// tick after the first would silently keep calling those stale closures, recomputing the exact
// same step from whatever the values were when the hold began — the interval genuinely fires on
// schedule, it just never advances, which reads as "holding doesn't do anything" even though
// nothing is broken about the timer itself. latestAction/latestPulse (kept fresh via an effect,
// not mutated directly during render — the rules of hooks forbid that, and committing before
// paint is still well ahead of the interval's own next tick, at minimum repeatMs away) are what
// fix that: every tick calls whichever version is actually current, not the one that existed when
// the timer was scheduled.
//
// action's own first call (on the initial long-press) always uses the fresh closure directly — no
// staleness risk there, since it's invoked synchronously in the same call that created it. Every
// call after that, from the repeat interval, goes through the latest* refs instead.
export function useHoldToRepeat(action: () => void, repeatMs: number, options?: HoldToRepeatOptions) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const latestAction = useRef(action)
  const pulse = usePulse(options)
  const latestPulse = useRef(pulse)

  useEffect(() => {
    latestAction.current = action
  }, [action])
  useEffect(() => {
    latestPulse.current = pulse
  }, [pulse])

  const stop = () => {
    if (timer.current == null) return
    clearInterval(timer.current)
    timer.current = null
  }
  // Unmount-safe: still-held-down-while-navigating-away is an edge case, but a live interval would
  // otherwise keep firing in the background after whatever it was wired to is gone.
  useEffect(() => stop, [])

  const start = () => {
    // A second onLongPress before the matching onPressOut (RN's gesture-responder negotiation can
    // plausibly double-fire it) would otherwise overwrite timer.current with the new interval's id
    // and orphan the first one — nothing left holding its id to ever clearInterval it, so it keeps
    // firing action()/pulse() forever, surviving both onPressOut and unmount. Stopping whatever's
    // already running first keeps start() idempotent the same way stop() already is.
    stop()
    action()
    pulse()
    timer.current = setInterval(() => {
      latestAction.current()
      latestPulse.current()
    }, repeatMs)
  }

  return { onLongPress: start, onPressOut: stop }
}

// Keyed sibling of useHoldToRepeat, for a set of independently-holdable targets that all funnel
// through one action (e.g. per-item "randomize" buttons rendered from a list) rather than a
// single fixed one — one Map of timers keyed by target stands in for the single ref above, so
// unrelated targets never share or clobber each other's interval. Same
// call-immediately-then-setInterval-until-released mechanics and the same stale-closure fix as
// above.
export function useHoldToRepeatByKey<K>(action: (key: K) => void, repeatMs: number, options?: HoldToRepeatOptions) {
  const timers = useRef<Map<K, ReturnType<typeof setInterval>>>(new Map())
  const latestAction = useRef(action)
  const pulse = usePulse(options)
  const latestPulse = useRef(pulse)

  useEffect(() => {
    latestAction.current = action
  }, [action])
  useEffect(() => {
    latestPulse.current = pulse
  }, [pulse])

  const stop = (key: K) => {
    const timer = timers.current.get(key)
    if (timer == null) return
    clearInterval(timer)
    timers.current.delete(key)
  }
  // Unmount-safe, same reasoning as above — stops every still-held target's own timer, not just
  // whichever one happened to be most recently started.
  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearInterval(timer))
      timers.current.clear()
    },
    []
  )

  const start = (key: K) => {
    // Same idempotent-start fix as the plain hook's own start() — a second onLongPress(key)
    // before the matching onPressOut(key) would otherwise have Map.set silently overwrite the
    // still-running interval id for that key, orphaning it with nothing left to ever clear it.
    stop(key)
    action(key)
    pulse()
    timers.current.set(
      key,
      setInterval(() => {
        latestAction.current(key)
        latestPulse.current()
      }, repeatMs)
    )
  }

  return {
    onLongPress: (key: K) => () => start(key),
    onPressOut: (key: K) => () => stop(key)
  }
}
