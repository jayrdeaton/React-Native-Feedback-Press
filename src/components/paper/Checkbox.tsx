import { type GestureResponderEvent } from 'react-native'

import { requirePaper } from '../../paper'
import { useVibration } from '../../useVibration'

// Local mirror of react-native-paper's Checkbox props, limited to what this wrapper touches
// plus a pass-through index signature — see src/paper.ts's PaperModuleShape for the same
// pattern. This intentionally avoids `import type { Props } from 'react-native-paper'`,
// which forces TypeScript to resolve the peer's real type declarations even for consumers
// who never installed the optional "react-native-paper" peer dep.
export type CheckboxProps = {
  status: 'checked' | 'unchecked' | 'indeterminate'
  onPress?: (e: GestureResponderEvent) => void
  [prop: string]: unknown
}

// Fires on onPress — Paper's Checkbox doesn't declare an onPressIn of its own (unlike
// Button/IconButton/TouchableRipple), so the haptic lands on release rather than touch-down.
export const Checkbox = ({ onPress, ...props }: CheckboxProps) => {
  const { Checkbox: PaperCheckbox } = requirePaper('Checkbox')
  const { selection } = useVibration()

  const handlePress = onPress
    ? (e: GestureResponderEvent) => {
        selection()
        onPress(e)
      }
    : undefined

  return <PaperCheckbox {...props} onPress={handlePress} />
}
