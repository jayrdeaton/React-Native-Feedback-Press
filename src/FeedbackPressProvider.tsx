import { type ReactNode, useCallback, useContext, useState } from 'react'

import { defaultHapticSettings, type HapticSettings, HapticSettingsContext } from './HapticSettingsContext'
import { PaperContext, type PaperModuleShape } from './PaperContext'
import { type SoundConfig, SoundContext } from './SoundContext'
import { defaultSoundSettings, type SoundSettings, SoundSettingsContext } from './SoundSettingsContext'

const EMPTY_SOUND: SoundConfig = {}

export type FeedbackPressProviderProps = {
  children: ReactNode
  initialValue?: Partial<HapticSettings>
  onChange?: (settings: HapticSettings) => void
  /** Injects react-native-paper so the Paper-flavored wrapper components (Button, Card, etc.) render as real Paper components instead of their plain-RN fallback. Pass `import * as RNPaper from 'react-native-paper'`; omit to keep the zero-dependency fallback UI. */
  paper?: PaperModuleShape
  /** Fires an app-supplied callback at the same instant a `selection`/`notification` haptic fires - e.g. a generic UI click sound. Omit entirely for haptic-only behavior (the default, unchanged from before this prop existed). A single component instance can opt out of just the sound (keeping its haptic) via its own `soundDisabled` prop. */
  sound?: SoundConfig
  /** Initial value for the sound-enabled setting, analogous to `initialValue` for haptics. */
  soundInitialValue?: Partial<SoundSettings>
  /** Called with the full sound settings object whenever they change via `useSoundSettings().set`, analogous to `onChange` for haptics. */
  onSoundChange?: (settings: SoundSettings) => void
}

export function FeedbackPressProvider({ children, initialValue, onChange, paper, sound, soundInitialValue, onSoundChange }: FeedbackPressProviderProps) {
  const [settings, setSettings] = useState<HapticSettings>(() => ({ ...defaultHapticSettings, ...initialValue }))
  const set = useCallback(
    (patch: Partial<HapticSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch }
        onChange?.(next)
        return next
      })
    },
    [onChange]
  )
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => ({ ...defaultSoundSettings, ...soundInitialValue }))
  const setSoundSetting = useCallback(
    (patch: Partial<SoundSettings>) => {
      setSoundSettings((prev) => {
        const next = { ...prev, ...patch }
        onSoundChange?.(next)
        return next
      })
    },
    [onSoundChange]
  )
  return (
    <HapticSettingsContext.Provider value={{ settings, set }}>
      <SoundSettingsContext.Provider value={{ settings: soundSettings, set: setSoundSetting }}>
        <PaperContext.Provider value={paper ?? null}>
          <SoundContext.Provider value={sound ?? EMPTY_SOUND}>{children}</SoundContext.Provider>
        </PaperContext.Provider>
      </SoundSettingsContext.Provider>
    </HapticSettingsContext.Provider>
  )
}

export const useFeedbackPressContext = () => {
  const { settings } = useContext(HapticSettingsContext)
  return { enabled: settings.vibrate }
}

export const useFeedbackPressSoundContext = () => {
  const { settings } = useContext(SoundSettingsContext)
  return { enabled: settings.enabled }
}
