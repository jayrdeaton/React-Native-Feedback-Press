import { Pressable, Text } from 'react-native'

import { type ChipProps, useFeedbackPressPaper } from '../../PaperContext'
import { useFeedbackHandlers } from '../../useFeedbackHandlers'
import { fallbackStyles } from './fallbackStyles'

export type { ChipProps }

export const Chip = (props: ChipProps) => {
  const paper = useFeedbackPressPaper()
  const { children, mode, ...wired } = useFeedbackHandlers(props)

  if (paper)
    return (
      <paper.Chip {...wired} mode={mode}>
        {children}
      </paper.Chip>
    )

  // No `paper` injected: plain-RN fallback, not a Material Design reproduction. Consumers
  // who want the real look pass `paper` to <FeedbackPressProvider>. onPressOut/delayLongPress
  // forwarded alongside onLongPress/onPress/onPressIn — see Button.tsx's own comment for why
  // (useHoldToRepeat's onPressOut is what stops its repeat interval on release).
  return (
    <Pressable delayLongPress={wired.delayLongPress} onLongPress={wired.onLongPress} onPress={wired.onPress} onPressIn={wired.onPressIn} onPressOut={wired.onPressOut} style={[fallbackStyles.chip, mode === 'outlined' && fallbackStyles.chipOutlined]}>
      <Text style={fallbackStyles.chipText}>{children}</Text>
    </Pressable>
  )
}
