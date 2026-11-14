import { createSettingsContext, type SettingsContextValue } from '@rific/core'

export type MusicSettings = {
  enabled: boolean
}

// A setting of its own, apart from Sound: a player can keep a game's sound effects and turn its
// music off, or the other way round. Off by default in dev/simulator builds (__DEV__), as Sound is,
// so local development doesn't play music unexpectedly; production builds default to on. Apps that
// persist it should mirror the same !__DEV__ fallback.
export const defaultMusicSettings: MusicSettings = {
  enabled: !__DEV__
}

export type MusicSettingsContextType = SettingsContextValue<MusicSettings>

const musicSettingsContext = createSettingsContext<MusicSettings>(defaultMusicSettings)

export const MusicSettingsContext = musicSettingsContext.Context
export const MusicSettingsProvider = musicSettingsContext.Provider
export const useMusicSettingsInternal = musicSettingsContext.useSettings
