import { Pressable } from 'react-native'

import { type FABProps, useFeedbackPressPaper } from '../../PaperContext'
import { useFeedbackHandlers } from '../../useFeedbackHandlers'
import { fallbackStyles } from './fallbackStyles'
import { renderFallbackIcon } from './renderFallbackIcon'

export type { FABProps }

// FAB does not expose onPressIn, so the haptic fires on onPress instead
export const FAB = (props: FABProps) => {
  const paper = useFeedbackPressPaper()
  const { icon, size, ...wired } = useFeedbackHandlers(props, { onLongPress: 'notification', onPress: 'selection' })

  if (paper) return <paper.FAB {...wired} icon={icon} size={size} />

  // No `paper` injected: plain-RN fallback, not a Material Design reproduction. Consumers
  // who want the real look pass `paper` to <FeedbackPressProvider>. onPressOut/delayLongPress
  // forwarded alongside onLongPress/onPress — useHoldToRepeat's onPressOut is what actually stops
  // its repeat interval on release, so dropping it here would leave that interval running forever
  // in fallback mode even after the real <paper.FAB> branch (which spreads {...wired} and so
  // forwards it fine) would have stopped it.
  return (
    <Pressable onLongPress={wired.onLongPress} onPress={wired.onPress} onPressOut={wired.onPressOut} delayLongPress={wired.delayLongPress} style={[fallbackStyles.fab, size === 'small' && fallbackStyles.fabSmall]}>
      {renderFallbackIcon(icon, '#ffffff', 24)}
    </Pressable>
  )
}
