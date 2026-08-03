import { requirePaper } from '../../paper'
import { useVibration } from '../../useVibration'

// Local mirror of react-native-paper's SegmentedButtons props, limited to what this wrapper
// touches plus a pass-through index signature — see src/paper.ts's PaperModuleShape for the
// same pattern. This intentionally avoids `import type { Props } from 'react-native-paper'`,
// which forces TypeScript to resolve the peer's real type declarations even for consumers
// who never installed the optional "react-native-paper" peer dep. onValueChange is typed as
// accepting either shape Paper's own single-select/multi-select discriminated union
// produces, rather than mirroring that full union — same simplification tradeoff Card.tsx's
// onLongPress takes.
export type SegmentedButtonsProps = {
  onValueChange?: (value: string | string[]) => void
  [prop: string]: unknown
}

// SegmentedButtons has no onPress/onPressIn of its own — each internal button is Paper's own
// private implementation detail — so the haptic fires the moment the selected value actually
// changes, on onValueChange.
export const SegmentedButtons = ({ onValueChange, ...props }: SegmentedButtonsProps) => {
  const { SegmentedButtons: PaperSegmentedButtons } = requirePaper('SegmentedButtons')
  const { selection } = useVibration()

  const handleValueChange = onValueChange
    ? (value: string | string[]) => {
        selection()
        onValueChange(value)
      }
    : undefined

  return <PaperSegmentedButtons {...props} onValueChange={handleValueChange} />
}
