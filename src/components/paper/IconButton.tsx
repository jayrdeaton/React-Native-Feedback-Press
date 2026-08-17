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
  // who want the real look pass `paper` to <FeedbackPressProvider>. onPressOut/delayLongPress
  // forwarded alongside onLongPress/onPress/onPressIn — see Button.tsx's own comment for why
  // (useHoldToRepeat's onPressOut is what stops its repeat interval on release).
  return (
    <Pressable delayLongPress={wired.delayLongPress} onLongPress={wired.onLongPress} onPress={wired.onPress} onPressIn={wired.onPressIn} onPressOut={wired.onPressOut} style={fallbackStyles.iconButton}>
      {renderFallbackIcon(icon)}
    </Pressable>
  )
}
