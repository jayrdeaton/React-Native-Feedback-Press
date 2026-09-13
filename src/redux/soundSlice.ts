import { createSettingsSlice } from '@rific/core'

import { defaultSoundSettings, type SoundSettings } from '../SoundSettingsContext'

const soundSlice = createSettingsSlice<SoundSettings>('sound', { initialState: defaultSoundSettings })

export const soundActions = soundSlice.actions
export const soundReducer = soundSlice.reducer
