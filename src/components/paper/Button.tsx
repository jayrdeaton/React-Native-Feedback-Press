import { Pressable, Text } from 'react-native'

import { type ButtonProps, useFeedbackPressPaper } from '../../PaperContext'
import { useFeedbackHandlers } from '../../useFeedbackHandlers'
import { fallbackStyles } from './fallbackStyles'

export type { ButtonProps }

export const Button = (props: ButtonProps) => {
  const paper = useFeedbackPressPaper()
  const { children, mode, ...wired } = useFeedbackHandlers(props)

  if (paper)
    return (
      <paper.Button {...wired} mode={mode}>
        {children}
      </paper.Button>
    )

  // No `paper` injected: plain-RN fallback, not a Material Design reproduction. Consumers
  // who want the real look pass `paper` to <FeedbackPressProvider>.
  const disabled = typeof wired.disabled === 'boolean' ? wired.disabled : false
  return (
    <Pressable disabled={disabled} onLongPress={wired.onLongPress} onPress={wired.onPress} onPressIn={wired.onPressIn} style={[fallbackStyles.button, (mode === 'outlined' || mode === 'text') && fallbackStyles.buttonOutlined, disabled && fallbackStyles.disabled]}>
      <Text style={fallbackStyles.buttonText}>{children}</Text>
    </Pressable>
  )
}
