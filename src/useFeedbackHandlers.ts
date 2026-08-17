import { useContext, useRef } from 'react'

import { SoundConfig, SoundContext } from './SoundContext'
import { useVibration } from './useVibration'

export type FeedbackTrigger = 'selection' | 'notification'

export type FeedbackWiringEntry<P> = FeedbackTrigger | { event: FeedbackTrigger; activeWhen?: (keyof P)[] }

export type FeedbackWiring<P> = Partial<Record<keyof P, FeedbackWiringEntry<P>>>

// The reserved props every wrapper in this package accepts alongside its own real props -
// stripped out inside useFeedbackHandlers before the rest reach the underlying component, so
// they never show up as an unrecognized DOM/native prop. Paper wrapper prop types (ButtonProps
// etc.) already declare these individually; withFeedback intersects this in for consumers'
// own components and this package's native Pressable/TouchableOpacity/TouchableHighlight
// wrappers, so `exclusive`/`soundDisabled`/etc. type-check there too, not just on Paper.
export type FeedbackExtraProps = {
  exclusive?: boolean
  hapticDisabled?: boolean
  soundDisabled?: boolean
  sound?: SoundConfig
}

// The shape nearly every RN press component follows: `selection` fires the moment a finger
// goes down (onPressIn, not onPress, to match native iOS feel), gated on the element
// actually doing something (onPress or onLongPress present) so decorative elements stay
// silent; `notification` fires on a completed long press, independent of that gate.
export const PRESS_WIRING = {
  onPressIn: { event: 'selection', activeWhen: ['onPress', 'onLongPress'] },
  onLongPress: { event: 'notification' }
} as const

const eventOf = <P>(entry: FeedbackWiringEntry<P> | undefined): FeedbackTrigger | undefined => (entry == null ? undefined : typeof entry === 'string' ? entry : entry.event)

// Wires haptics (and, if the provider was given a `sound` config, an app-supplied sound
// callback) onto a set of a component's own event props without assuming its exact prop
// types. Every Paper/native wrapper in this package (and `withFeedback` for consumers' own
// components) is built on this. `wiring` maps a prop name to which event fires when it's
// called; `activeWhen` lets a prop only wire up when other named props are present (e.g.
// onPressIn only fires selection when the element also has onPress/onLongPress, so purely
// decorative elements don't buzz - or click - on touch).
//
// `exclusive` (a reserved prop, same family as soundDisabled/hapticDisabled/sound) swaps the
// default "click on touch-down, pop separately if it escalates" for "exactly one fires per
// gesture, never both": selection is deferred from touch-down all the way to onPressOut, and
// only actually fires there if onLongPress didn't already fire notification earlier in that
// same press. Requires the wiring to contain an onLongPress->notification entry (every wiring
// config this package's own wrappers use does, including FAB's onPress-sourced one - the
// exclusive path only ever cares which key maps to notification, never which one maps to
// selection); otherwise `exclusive` is a no-op, since there's no long-press to be exclusive
// against. A ref (not a plain closure variable) tracks whether this press cycle already
// escalated, since this hook re-runs on every render and a plain variable would forget that
// between the onLongPress render and the later onPressOut render - the same stale-render gap
// useHoldToRepeat's own refs guard against.
export function useFeedbackHandlers<P extends object>(props: P, wiring: FeedbackWiring<P> = PRESS_WIRING as unknown as FeedbackWiring<P>): P {
  const { selection, notification } = useVibration()
  const contextSound: SoundConfig = useContext(SoundContext)
  const longPressFired = useRef(false)
  const wired = { ...props } as Record<string, unknown>
  // Reserved props, not part of any wrapper's real prop type - read here (off `wired`, already
  // cast loose, not off the generic `P`, which has no known keys for these) and deleted below so
  // none of them ever reach the underlying Paper/native component as an unrecognized prop.
  const soundDisabled = wired.soundDisabled === true
  const hapticDisabled = wired.hapticDisabled === true
  const exclusive = wired.exclusive === true
  // A component instance's own `sound` prop overrides the provider's ambient config for just
  // this press - e.g. a delete button wanting a distinct sound from the app-wide generic click,
  // without needing a second provider. Falls back to the provider's sound when omitted, which is
  // the common case.
  const sound: SoundConfig = (wired.sound as SoundConfig | undefined) ?? contextSound
  delete wired.soundDisabled
  delete wired.hapticDisabled
  delete wired.sound
  delete wired.exclusive

  const fire = (event: FeedbackTrigger) => {
    if (!hapticDisabled) (event === 'selection' ? selection : notification)()
    if (!soundDisabled) sound[event]?.()
  }

  const longPressKey = (Object.keys(wiring) as (keyof P)[]).find((key) => eventOf(wiring[key]) === 'notification')
  const exclusiveActive = exclusive && longPressKey != null

  if (exclusiveActive) {
    const key = longPressKey as keyof P
    const originalOnLongPress = props[key]
    const originalOnPressOut = (props as Record<string, unknown>).onPressOut
    const isActive = typeof originalOnLongPress === 'function' || typeof (props as Record<string, unknown>).onPress === 'function'
    if (isActive) {
      wired[key as string] = (...args: unknown[]) => {
        longPressFired.current = true
        fire('notification')
        if (typeof originalOnLongPress === 'function') (originalOnLongPress as (...args: unknown[]) => void)(...args)
      }
      // Claims onPressOut for its own deferred-selection firing - every wiring config in this
      // package leaves onPressOut unwired otherwise, so there's nothing else here to clobber.
      wired.onPressOut = (...args: unknown[]) => {
        if (!longPressFired.current) fire('selection')
        longPressFired.current = false
        if (typeof originalOnPressOut === 'function') (originalOnPressOut as (...args: unknown[]) => void)(...args)
      }
    }
  }

  for (const key of Object.keys(wiring) as (keyof P)[]) {
    // Exclusive mode already claimed the long-press key above (wired to the deferred-selection
    // onPressOut instead) - skip it here so this loop doesn't clobber that with an immediate fire.
    if (exclusiveActive && key === longPressKey) continue
    const entry = wiring[key]
    if (!entry) continue
    const event = eventOf(entry) as FeedbackTrigger
    const activeWhen = typeof entry === 'string' ? undefined : entry.activeWhen
    const original = props[key]
    const isActive = activeWhen ? activeWhen.some((k) => !!props[k]) : typeof original === 'function'
    if (!isActive) continue
    // In exclusive mode, selection's normal immediate-fire source (onPressIn, or onPress for
    // FAB/AppbarAction) is left completely unwired - `wired[key]` already equals the original
    // callback from the initial `{...props}` spread, so there's nothing to do here but leave it.
    if (exclusiveActive && event === 'selection') continue
    wired[key as string] = (...args: unknown[]) => {
      fire(event)
      if (typeof original === 'function') (original as (...args: unknown[]) => void)(...args)
    }
  }
  return wired as P
}
