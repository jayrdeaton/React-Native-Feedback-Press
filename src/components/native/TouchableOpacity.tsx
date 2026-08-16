import { TouchableOpacity as RNTouchableOpacity, type TouchableOpacityProps } from 'react-native'

import { withFeedback } from '../../withFeedback'

export type { TouchableOpacityProps }

export const TouchableOpacity = withFeedback<TouchableOpacityProps>(RNTouchableOpacity)
