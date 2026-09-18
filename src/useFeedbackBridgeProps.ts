import { useMemo } from 'react'

import type { FeedbackPressProviderProps } from './FeedbackPressProvider'

/**
 * The subset of FeedbackPressProviderProps a consuming app's own Redux-backed "FeedbackBridge"
 * component is responsible for supplying. Every field here has an identically-named counterpart
 * on FeedbackPressProviderProps itself (see that file) - deliberately not renamed, so wiring this
 * up needs no new vocabulary beyond the provider's own. `paper` and `children` are excluded:
 * `paper` is a static `import * as RNPaper from 'react-native-paper'`, not app state, and
 * `children` is the JSX the app's own FeedbackBridge already renders inside
 * `<FeedbackPressProvider>` - neither one is part of the Redux/sound wiring this hook exists to
 * collect.
 */
export type FeedbackBridgeProps = Omit<FeedbackPressProviderProps, 'children' | 'paper'>

/**
 * Reshapes an app's own Redux-sourced haptic/sound state and callbacks into the exact prop object
 * `<FeedbackPressProvider>` expects, so a consuming app's "FeedbackBridge" component - every game
 * in the fleet defines one, reading `state.haptic`/`state.sound` from its own store and
 * dispatching `hapticActions.initialize`/`soundActions.initialize` on change - can hand its own
 * `useSelector`/`dispatch`/sound-source results straight to this hook instead of re-deriving the
 * same five-prop shape by hand in every app:
 *
 * ```tsx
 * const FeedbackBridge = ({ children }: Props) => {
 *   const haptic = useSelector((state: RootState) => state.haptic)
 *   const sound = useSelector((state: RootState) => state.sound)
 *   const dispatch = useDispatch()
 *   const onChange = useCallback((s: HapticSettings) => dispatch(hapticActions.initialize(s)), [dispatch])
 *   const onSoundChange = useCallback((s: SoundSettings) => dispatch(soundActions.initialize(s)), [dispatch])
 *   const playSelection = useAudioPool(require('../../assets/sounds/select.wav'))
 *   const playNotification = useAudioPool(require('../../assets/sounds/notification.wav'))
 *   const bridgeProps = useFeedbackBridgeProps({ initialValue: haptic, onChange, soundInitialValue: sound, onSoundChange, sound: { selection: playSelection, notification: playNotification } })
 *   return <FeedbackPressProvider {...bridgeProps} paper={RNPaper}>{children}</FeedbackPressProvider>
 * }
 * ```
 *
 * Deliberately takes plain values and callbacks rather than a `dispatch` function or any
 * Redux-specific type: this package has no opinion on any app's own RootState shape, or even that
 * state management is Redux at all - the app does its own `useSelector`/`dispatch`/sound-source
 * wiring (which is genuinely app-specific: two inline `useAudioPool(require(...))` calls in some
 * apps, a shared `useDefaultSounds()` hook in others) and passes just the results in.
 */
export function useFeedbackBridgeProps(props: FeedbackBridgeProps): FeedbackBridgeProps {
  const { initialValue, onChange, soundInitialValue, onSoundChange, sound } = props
  return useMemo(() => ({ initialValue, onChange, soundInitialValue, onSoundChange, sound }), [initialValue, onChange, soundInitialValue, onSoundChange, sound])
}
