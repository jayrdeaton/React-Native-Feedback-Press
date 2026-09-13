import { createSettingsContext, type SettingsContextValue } from '@rific/core'

export type HapticSettings = {
  vibrate: boolean
}

export const defaultHapticSettings: HapticSettings = {
  vibrate: true
}

export type HapticSettingsContextType = SettingsContextValue<HapticSettings>

// Single createSettingsContext() call, shared by FeedbackPressProvider.tsx and
// useHapticSettings.ts (each just re-exports the relevant piece under its original name) so
// there's exactly one Context instance backing all three files, same as before this migration.
const hapticSettingsContext = createSettingsContext<HapticSettings>(defaultHapticSettings)

export const HapticSettingsContext = hapticSettingsContext.Context
export const HapticSettingsProvider = hapticSettingsContext.Provider
export const useHapticSettingsInternal = hapticSettingsContext.useSettings
