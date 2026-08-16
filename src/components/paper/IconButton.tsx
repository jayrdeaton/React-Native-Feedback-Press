import { Pressable } from 'react-native'

import { type IconButtonProps, useFeedbackPressPaper } from '../../PaperContext'
import { useFeedbackHandlers } from '../../useFeedbackHandlers'
import { fallbackStyles } from './fallbackStyles'
import { renderFallbackIcon } from './renderFallbackIcon'

export type { IconButtonProps }

export const IconButton = (props: IconButtonProps) => {
  const paper = useFeedbackPressPaper()
  const { icon, ...wired } = useFeedbackHandlers(props)

  if (paper) return <paper.IconButton {...wired} icon={icon} />

  // No `paper` injected: plain-RN fallback, not a Material Design reproduction. Consumers
  // who want the real look pass `paper` to <FeedbackPressProvider>.
  return (
    <Pressable onLongPress={wired.onLongPress} onPress={wired.onPress} onPressIn={wired.onPressIn} style={fallbackStyles.iconButton}>
      {renderFallbackIcon(icon)}
    </Pressable>
  )
}
