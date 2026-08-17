import type { ComponentType } from 'react'

import { type FeedbackExtraProps, type FeedbackWiring, useFeedbackHandlers } from './useFeedbackHandlers'

// Escape hatch for components this package doesn't ship a wrapper for: your own
// components, or another styling library's. Wraps `Component` with the same feedback wiring
// every Button/Pressable/etc. in this package uses: `selection` on `onPressIn`, gated on
// `onPress`/`onLongPress` being present, and `notification` on `onLongPress`. Pass `wiring`
// to target different props, e.g. `{ onValueChange: 'selection' }` for a Switch-shaped
// component, or `{ onPress: 'selection' }` for one with no `onPressIn`. The returned component's
// props are `P & FeedbackExtraProps` - `Component` itself never sees soundDisabled/hapticDisabled/
// sound/exclusive (useFeedbackHandlers strips them before forwarding), but callers get them typed.
export function withFeedback<P extends object>(Component: ComponentType<P>, wiring?: FeedbackWiring<P>): ComponentType<P & FeedbackExtraProps> {
  const WithFeedback = (props: P & FeedbackExtraProps) => {
    const wired = useFeedbackHandlers(props, wiring)
    return <Component {...wired} />
  }
  WithFeedback.displayName = `withFeedback(${Component.displayName ?? Component.name ?? 'Component'})`
  return WithFeedback
}
