import { useContext } from 'react'

import { SoundSettingsContext } from './SoundSettingsContext'

export const useSoundSettings = () => useContext(SoundSettingsContext)
