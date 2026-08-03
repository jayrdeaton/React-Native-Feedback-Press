import { requirePaper } from '../../paper'
import { useVibration } from '../../useVibration'

// Local mirror of react-native-paper's Switch props, limited to what this wrapper touches
// plus a pass-through index signature — see src/paper.ts's PaperModuleShape for the same
// pattern. This intentionally avoids `import type { Props } from 'react-native-paper'`,
// which forces TypeScript to resolve the peer's real type declarations even for consumers
// who never installed the optional "react-native-paper" peer dep.
export type SwitchProps = {
  value?: boolean
  onValueChange?: (value: boolean) => void
  [prop: string]: unknown
}

// Switch has no onPress/onPressIn at all — just a value-change callback — so the haptic
// fires the moment the toggle actually flips, on onValueChange.
export const Switch = ({ onValueChange, ...props }: SwitchProps) => {
  const { Switch: PaperSwitch } = requirePaper('Switch')
  const { selection } = useVibration()

  const handleValueChange = onValueChange
    ? (value: boolean) => {
        selection()
        onValueChange(value)
      }
    : undefined

  return <PaperSwitch {...props} onValueChange={handleValueChange} />
}
