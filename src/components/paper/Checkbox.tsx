import { Pressable, Text, View } from 'react-native'

import { type CheckboxProps, useFeedbackPressPaper } from '../../PaperContext'
import { useFeedbackHandlers } from '../../useFeedbackHandlers'
import { fallbackStyles } from './fallbackStyles'

export type { CheckboxProps }

export const Checkbox = (props: CheckboxProps) => {
  const paper = useFeedbackPressPaper()
  const { status, ...wired } = useFeedbackHandlers(props, { onPress: 'selection' })

  if (paper) return <paper.Checkbox {...wired} status={status} />

  // No `paper` injected: plain-RN fallback, not a Material Design reproduction.
  return (
    <Pressable onPress={wired.onPress}>
      <View style={fallbackStyles.checkboxBox}>
        {status === 'checked' ? <Text style={fallbackStyles.checkboxMark}>✓</Text> : null}
        {status === 'indeterminate' ? <Text style={fallbackStyles.checkboxMark}>–</Text> : null}
      </View>
    </Pressable>
  )
}
