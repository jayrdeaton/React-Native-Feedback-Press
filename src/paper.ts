import type { ComponentType } from 'react'
import type { GestureResponderEvent } from 'react-native'

// Hand-written shape covering only the react-native-paper members this
// package's wrapper components actually touch (see src/components/paper/*).
// This intentionally avoids `typeof import('react-native-paper')`, which
// forces TypeScript to resolve the peer's real type declarations even for
// consumers who never installed the optional "react-native-paper" peer dep.
type PaperPressableProps = {
  onPress?: (e: GestureResponderEvent) => void
  onLongPress?: ((e: GestureResponderEvent) => void) | (() => void)
  onPressIn?: (e: GestureResponderEvent) => void
  // Wrapper components spread the caller's real react-native-paper props
  // (typed elsewhere via `import type { ... } from 'react-native-paper'')
  // through to these components, so allow arbitrary pass-through props.
  [prop: string]: unknown
}

type PaperPressable = ComponentType<PaperPressableProps>

type PaperModuleShape = {
  Button: PaperPressable
  IconButton: PaperPressable
  Chip: PaperPressable
  TouchableRipple: PaperPressable
  FAB: PaperPressable
  Checkbox: PaperPressable
  Switch: PaperPressable
  SegmentedButtons: PaperPressable
  Appbar: {
    BackAction: PaperPressable
    Action: PaperPressable
  }
  Card: PaperPressable & {
    Content: ComponentType<{ [prop: string]: unknown }>
    Title: ComponentType<{ [prop: string]: unknown }>
    Actions: ComponentType<{ [prop: string]: unknown }>
    Cover: ComponentType<{ [prop: string]: unknown }>
  }
}

export const paper = (() => {
  try {
    return require('react-native-paper') as PaperModuleShape
  } catch {
    return null
  }
})()

export const requirePaper = (component: string) => {
  if (!paper) throw new Error(`[@rific/haptic-press] <${component}> requires the optional peer dependency "react-native-paper" to be installed.`)
  return paper
}
