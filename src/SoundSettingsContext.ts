import { createSettingsContext, type SettingsContextValue } from '@rific/core'

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

export type SoundSettingsContextType = SettingsContextValue<SoundSettings>

// Single createSettingsContext() call, shared by FeedbackPressProvider.tsx and
// useSoundSettings.ts (each just re-exports the relevant piece under its original name) so
// there's exactly one Context instance backing all three files, same as before this migration.
const soundSettingsContext = createSettingsContext<SoundSettings>(defaultSoundSettings)

export const SoundSettingsContext = soundSettingsContext.Context
export const SoundSettingsProvider = soundSettingsContext.Provider
export const useSoundSettingsInternal = soundSettingsContext.useSettings
