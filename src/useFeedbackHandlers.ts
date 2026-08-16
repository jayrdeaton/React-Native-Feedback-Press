import { useContext } from 'react'

import { SoundConfig, SoundContext } from './SoundContext'
import { useVibration } from './useVibration'

export type FeedbackTrigger = 'selection' | 'notification'

export type FeedbackWiringEntry<P> = FeedbackTrigger | { event: FeedbackTrigger; activeWhen?: (keyof P)[] }

export type FeedbackWiring<P> = Partial<Record<keyof P, FeedbackWiringEntry<P>>>

// The shape nearly every RN press component follows: `selection` fires the moment a finger
// goes down (onPressIn, not onPress, to match native iOS feel), gated on the element
// actually doing something (onPress or onLongPress present) so decorative elements stay
// silent; `notification` fires on a completed long press, independent of that gate.
export const PRESS_WIRING = {
  onPressIn: { event: 'selection', activeWhen: ['onPress', 'onLongPress'] },
  onLongPress: { event: 'notification' }
} as const

// Wires haptics (and, if the provider was given a `sound` config, an app-supplied sound
// callback) onto a set of a component's own event props without assuming its exact prop
// types. Every Paper/native wrapper in this package (and `withFeedback` for consumers' own
// components) is built on this. `wiring` maps a prop name to which event fires when it's
// called; `activeWhen` lets a prop only wire up when other named props are present (e.g.
// onPressIn only fires selection when the element also has onPress/onLongPress, so purely
// decorative elements don't buzz - or click - on touch).
export function useFeedbackHandlers<P extends object>(props: P, wiring: FeedbackWiring<P> = PRESS_WIRING as unknown as FeedbackWiring<P>): P {
  const { selection, notification } = useVibration()
  const contextSound: SoundConfig = useContext(SoundContext)
  const wired = { ...props } as Record<string, unknown>
  // Reserved props, not part of any wrapper's real prop type - read here (off `wired`, already
  // cast loose, not off the generic `P`, which has no known keys for these) and deleted below so
  // none of them ever reach the underlying Paper/native component as an unrecognized prop.
  const soundDisabled = wired.soundDisabled === true
  const hapticDisabled = wired.hapticDisabled === true
  // A component instance's own `sound` prop overrides the provider's ambient config for just
  // this press - e.g. a delete button wanting a distinct sound from the app-wide generic click,
  // without needing a second provider. Falls back to the provider's sound when omitted, which is
  // the common case.
  const sound: SoundConfig = (wired.sound as SoundConfig | undefined) ?? contextSound
  delete wired.soundDisabled
  delete wired.hapticDisabled
  delete wired.sound

  for (const key of Object.keys(wiring) as (keyof P)[]) {
    const entry = wiring[key]
    if (!entry) continue
    const event: FeedbackTrigger = typeof entry === 'string' ? entry : entry.event
    const activeWhen = typeof entry === 'string' ? undefined : entry.activeWhen
    const original = props[key]
    const isActive = activeWhen ? activeWhen.some((k) => !!props[k]) : typeof original === 'function'
    if (!isActive) continue
    // Same isActive gate every trigger already used, so a decorative element that fires nothing
    // fires nothing either way - and soundDisabled/hapticDisabled only suppress their own single
    // channel, independently, never each other.
    const fireHaptic = hapticDisabled ? undefined : event === 'selection' ? selection : notification
    const fireSound = soundDisabled ? undefined : sound[event]
    wired[key as string] = (...args: unknown[]) => {
      fireHaptic?.()
      fireSound?.()
      if (typeof original === 'function') (original as (...args: unknown[]) => void)(...args)
    }
  }
  return wired as P
}
