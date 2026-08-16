import { Pressable as RNPressable, type PressableProps } from 'react-native'

import { withFeedback } from '../../withFeedback'

export type { PressableProps }

export const Pressable = withFeedback<PressableProps>(RNPressable)
