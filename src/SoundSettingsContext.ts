import { createContext } from 'react'

export type SoundSettings = {
  enabled: boolean
}

export const defaultSoundSettings: SoundSettings = {
  enabled: true
}

export type SoundSettingsContextType = {
  settings: SoundSettings
  set: (patch: Partial<SoundSettings>) => void
}

export const SoundSettingsContext = createContext<SoundSettingsContextType>({
  settings: defaultSoundSettings,
  set: () => {}
})
