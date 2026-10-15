import type { ReactElement } from 'react'
import { type GestureResponderEvent, type Insets, Pressable, type StyleProp, StyleSheet, type ViewStyle } from 'react-native'

type ButtonProps = Record<string, unknown>

// Style keys that place a button within its parent rather than draw it. They move off Paper's
// button onto the hit target below, so the target sits exactly where the button used to.
// Everything else (size, colors, borders, opacity) stays on Paper's button.
const PLACEMENT_KEYS = new Set(['alignSelf', 'bottom', 'display', 'end', 'flex', 'flexBasis', 'flexGrow', 'flexShrink', 'left', 'position', 'right', 'start', 'top', 'transform', 'zIndex'])

const isPlacementKey = (key: string) => PLACEMENT_KEYS.has(key) || key.startsWith('margin') || key.startsWith('inset')

const handler = (value: unknown) => (typeof value === 'function' ? (value as (e: GestureResponderEvent) => void) : undefined)

// Makes `hitSlop` actually grow the touch area of Paper's IconButton, and of Appbar.Action and
// Appbar.BackAction, which render it. Paper puts the button's touchable inside a Surface with
// `overflow: 'hidden'`, and React Native's native hit testing (iOS and Android alike) never
// reaches past a clipping parent's bounds, so a hitSlop passed through to Paper is silently a
// no-op: the touch area stays at the button's own box (40pt at Paper's default size 24).
//
// With `hitSlop` set, this wraps Paper's button in a plain Pressable that owns the slop instead.
// The wrapper takes the button's placement styles and Paper's own 6pt margin, so its box is the
// button's box and the slop is measured from the button's edge, same as a real hitSlop. It draws
// nothing, so the button looks the same at rest and while pressed: a press inside the button
// still lands on Paper's touchable (with its ripple), and one in the slop band lands on the
// wrapper, which runs the same already-wired handlers (haptics, sound, the caller's callbacks)
// with no ripple. It's skipped from accessibility and focus; Paper's button is still the one
// screen readers and keyboards see. Without `hitSlop` the button renders exactly as before.
//
// Placement styles must be plain values: the wrapper isn't an Animated component, so an
// Animated value in, say, a transform won't drive it.
export function renderWithHitSlop(props: ButtonProps, renderButton: (props: ButtonProps) => ReactElement): ReactElement {
  const { hitSlop, style, ...rest } = props
  if (hitSlop == null) return renderButton(props)

  const placement: Record<string, unknown> = {}
  const look: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(StyleSheet.flatten(style as StyleProp<ViewStyle>) ?? {})) {
    const target = isPlacementKey(key) ? placement : look
    target[key] = value
  }

  // Mirrors Paper's TouchableRipple, which disables itself when it has no touch handler: a
  // decorative button's slop band shouldn't swallow touches meant for whatever sits beneath it.
  const interactive = [rest.onPress, rest.onLongPress, rest.onPressIn, rest.onPressOut].some((value) => typeof value === 'function')

  return (
    <Pressable accessible={false} focusable={false} importantForAccessibility='no' disabled={rest.disabled === true || !interactive} hitSlop={hitSlop as number | Insets} delayLongPress={rest.delayLongPress as number | undefined} onLongPress={handler(rest.onLongPress)} onPress={handler(rest.onPress)} onPressIn={handler(rest.onPressIn)} onPressOut={handler(rest.onPressOut)} style={[styles.target, placement as ViewStyle]}>
      {renderButton({ ...rest, style: [look, styles.button] })}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  // Paper's IconButton draws its Surface with a 6pt margin (its own styles.container, the same in
  // MD2 and MD3). The wrapper takes that margin over so its box is the button's box. A caller's own
  // margin keys move to the wrapper too, after this, so they still win.
  button: {
    margin: 0
  },
  target: {
    margin: 6
  }
})
