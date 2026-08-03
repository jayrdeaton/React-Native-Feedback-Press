import { requirePaper } from '../../paper'
import { useVibration } from '../../useVibration'

// Local mirror of react-native-paper's Appbar.Action props, limited to what this wrapper
// touches plus a pass-through index signature — see src/paper.ts's PaperModuleShape for the
// same pattern. This intentionally avoids `import type { Props } from 'react-native-paper'`,
// which forces TypeScript to resolve the peer's real type declarations even for consumers
// who never installed the optional "react-native-paper" peer dep.
export type AppbarActionProps = {
  icon: unknown
  onPress?: () => void
  [prop: string]: unknown
}

// Fires on onPress, not onPressIn — same as AppbarBackAction, and for the same reason:
// Appbar.BackAction is itself built on top of Appbar.Action internally in Paper's own
// source (they share one underlying implementation), so whatever's true for BackAction's
// onPressIn support is true here too. See AppbarBackAction.tsx's own comment/test.
export const AppbarAction = ({ onPress, ...props }: AppbarActionProps) => {
  const { Appbar } = requirePaper('AppbarAction')
  const { selection } = useVibration()

  const handlePress = onPress
    ? () => {
        selection()
        onPress()
      }
    : undefined

  return <Appbar.Action {...props} onPress={handlePress} />
}
