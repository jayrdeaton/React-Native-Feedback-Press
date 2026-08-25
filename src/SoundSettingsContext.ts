import { createContext } from 'react'

export type SoundSettings = {
  enabled: boolean
}

// Muted by default in dev/simulator builds (__DEV__) so local development and testing don't play
// sound unexpectedly; production builds default to enabled, unchanged from before this existed.
// Consumers that compute their own initial value (e.g. from persisted storage) should mirror this
// same !__DEV__ fallback rather than hardcoding `true`, so a fresh install in dev gets it too.
export const defaultSoundSettings: SoundSettings = {
  enabled: !__DEV__
}

export type SoundSettingsContextType = {
  settings: SoundSettings
  set: (patch: Partial<SoundSettings>) => void
}

export const SoundSettingsContext = createContext<SoundSettingsContextType>({
  settings: defaultSoundSettings,
  set: () => {}
})
