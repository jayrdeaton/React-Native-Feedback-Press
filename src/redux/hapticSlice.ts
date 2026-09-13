import { createSettingsSlice } from '@rific/core'

import { defaultHapticSettings, type HapticSettings } from '../HapticSettingsContext'

const hapticSlice = createSettingsSlice<HapticSettings>('haptic', { initialState: defaultHapticSettings })

export const hapticActions = hapticSlice.actions
export const hapticReducer = hapticSlice.reducer
