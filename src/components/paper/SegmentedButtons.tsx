import { Pressable, Text, View } from 'react-native'

import { type SegmentedButtonsProps, useFeedbackPressPaper } from '../../PaperContext'
import { useFeedbackHandlers } from '../../useFeedbackHandlers'
import { fallbackStyles } from './fallbackStyles'

export type { SegmentedButtonsProps }

export const SegmentedButtons = (props: SegmentedButtonsProps) => {
  const paper = useFeedbackPressPaper()
  const wired = useFeedbackHandlers(props, { onValueChange: 'selection' })

  if (paper) return <paper.SegmentedButtons {...wired} />

  // No `paper` injected: plain-RN fallback, not a Material Design reproduction. Single-select
  // behavior only in this fallback, since we can't detect Paper's multi-select mode without Paper.
  const { buttons, value } = wired
  return (
    <View style={fallbackStyles.segmentedRow}>
      {buttons.map((button) => {
        const selected = Array.isArray(value) ? value.includes(button.value) : value === button.value
        return (
          <Pressable disabled={button.disabled} key={button.value} onPress={() => wired.onValueChange?.(button.value)} style={[fallbackStyles.segment, selected && fallbackStyles.segmentSelected, button.disabled && fallbackStyles.disabled]}>
            <Text style={[fallbackStyles.segmentText, selected && fallbackStyles.segmentTextSelected]}>{button.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
