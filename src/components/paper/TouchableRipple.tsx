import { Pressable } from 'react-native'

import { type TouchableRippleProps, useFeedbackPressPaper } from '../../PaperContext'
import { useFeedbackHandlers } from '../../useFeedbackHandlers'
import { fallbackColors } from './fallbackStyles'

export type { TouchableRippleProps }

export const TouchableRipple = (props: TouchableRippleProps) => {
  const paper = useFeedbackPressPaper()
  const { children, ...wired } = useFeedbackHandlers(props)

  if (paper) return <paper.TouchableRipple {...wired}>{children}</paper.TouchableRipple>

  // No `paper` injected: plain-RN fallback, not a Material Design reproduction.
  // TouchableRipple doesn't impose its own visual style in Paper either, so there's no
  // wrapper style here, just a real ripple on Android via android_ripple. onPressOut/
  // delayLongPress forwarded alongside onLongPress/onPress/onPressIn — see Button.tsx's own
  // comment for why (useHoldToRepeat's onPressOut is what stops its repeat interval on release).
  return (
    <Pressable android_ripple={{ color: fallbackColors.tint }} delayLongPress={wired.delayLongPress} onLongPress={wired.onLongPress} onPress={wired.onPress} onPressIn={wired.onPressIn} onPressOut={wired.onPressOut}>
      {children}
    </Pressable>
  )
}
