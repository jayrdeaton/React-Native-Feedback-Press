import { Pressable, Text } from 'react-native'

import { type AppbarBackActionProps, useFeedbackPressPaper } from '../../PaperContext'
import { useFeedbackHandlers } from '../../useFeedbackHandlers'
import { fallbackStyles } from './fallbackStyles'

export type { AppbarBackActionProps }

export const AppbarBackAction = (props: AppbarBackActionProps) => {
  const paper = useFeedbackPressPaper()
  const wired = useFeedbackHandlers(props, { onPress: 'selection' })

  if (paper) return <paper.Appbar.BackAction {...wired} />

  // No `paper` injected: plain-RN fallback, not a Material Design reproduction.
  return (
    <Pressable onPress={wired.onPress} style={fallbackStyles.iconButton}>
      <Text style={fallbackStyles.iconText}>←</Text>
    </Pressable>
  )
}
