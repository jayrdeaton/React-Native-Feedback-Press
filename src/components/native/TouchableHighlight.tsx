import { TouchableHighlight as RNTouchableHighlight, type TouchableHighlightProps } from 'react-native'

import { withFeedback } from '../../withFeedback'

export type { TouchableHighlightProps }

export const TouchableHighlight = withFeedback<TouchableHighlightProps>(RNTouchableHighlight)
