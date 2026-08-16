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
  // who want the real look pass `paper` to <FeedbackPressProvider>.
  return (
    <Pressable onLongPress={wired.onLongPress} onPress={wired.onPress} style={[fallbackStyles.fab, size === 'small' && fallbackStyles.fabSmall]}>
      {renderFallbackIcon(icon, '#ffffff', 24)}
    </Pressable>
  )
}
