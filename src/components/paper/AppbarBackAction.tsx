import { type Insets, Pressable, Text } from 'react-native'

import { type AppbarBackActionProps, useFeedbackPressPaper } from '../../PaperContext'
import { useFeedbackHandlers } from '../../useFeedbackHandlers'
import { fallbackStyles } from './fallbackStyles'
import { renderWithHitSlop } from './renderWithHitSlop'

export type { AppbarBackActionProps }

export const AppbarBackAction = (props: AppbarBackActionProps) => {
  const paper = useFeedbackPressPaper()
  const wired = useFeedbackHandlers(props, { onPress: 'selection' })

  // Paper's Appbar.BackAction is its IconButton underneath, so a hitSlop needs the same wrapper.
  if (paper) return renderWithHitSlop(wired, (actionProps) => <paper.Appbar.BackAction {...actionProps} />)

  // No `paper` injected: plain-RN fallback, not a Material Design reproduction.
  return (
    <Pressable hitSlop={wired.hitSlop as number | Insets | undefined} onPress={wired.onPress} style={fallbackStyles.iconButton}>
      <Text style={fallbackStyles.iconText}>←</Text>
    </Pressable>
  )
}
