import { type Insets, Pressable } from 'react-native'

import { type AppbarActionProps, useFeedbackPressPaper } from '../../PaperContext'
import { useFeedbackHandlers } from '../../useFeedbackHandlers'
import { fallbackStyles } from './fallbackStyles'
import { renderFallbackIcon } from './renderFallbackIcon'
import { renderWithHitSlop } from './renderWithHitSlop'

export type { AppbarActionProps }

// Fires on onPress, not onPressIn, same as AppbarBackAction and for the same reason:
// Appbar.BackAction is itself built on top of Appbar.Action internally in Paper's own
// source (they share one underlying implementation), so whatever's true for BackAction's
// onPressIn support is true here too. See AppbarBackAction.tsx's own comment/test.
export const AppbarAction = (props: AppbarActionProps) => {
  const paper = useFeedbackPressPaper()
  const { icon, ...wired } = useFeedbackHandlers(props, { onPress: 'selection' })

  // Paper's Appbar.Action is its IconButton underneath, so a hitSlop needs the same wrapper.
  if (paper) return renderWithHitSlop(wired, (actionProps) => <paper.Appbar.Action {...actionProps} icon={icon} />)

  // No `paper` injected: plain-RN fallback, not a Material Design reproduction.
  return (
    <Pressable hitSlop={wired.hitSlop as number | Insets | undefined} onPress={wired.onPress} style={fallbackStyles.iconButton}>
      {renderFallbackIcon(icon)}
    </Pressable>
  )
}
