import { createSettingsSlice } from '@rific/core'

import { defaultMusicSettings, type MusicSettings } from '../MusicSettingsContext'

const musicSlice = createSettingsSlice<MusicSettings>('music', { initialState: defaultMusicSettings })

export const musicActions = musicSlice.actions
export const musicReducer = musicSlice.reducer
