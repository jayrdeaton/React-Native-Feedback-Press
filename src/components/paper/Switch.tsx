import { Switch as RNSwitch } from 'react-native'

import { type SwitchProps, useFeedbackPressPaper } from '../../PaperContext'
import { useFeedbackHandlers } from '../../useFeedbackHandlers'

export type { SwitchProps }

// Switch has no onPress/onPressIn at all, just a value-change callback, so the haptic
// fires the moment the toggle actually flips, on onValueChange.
export const Switch = (props: SwitchProps) => {
  const paper = useFeedbackPressPaper()
  const wired = useFeedbackHandlers(props, { onValueChange: 'selection' })

  if (paper) return <paper.Switch {...wired} />

  // No `paper` injected: plain-RN fallback. RN's own Switch is a fully-functional native
  // control already, so it needs no extra styling.
  return <RNSwitch onValueChange={wired.onValueChange} value={wired.value} />
}
