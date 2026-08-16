import { type ReactNode, useCallback, useContext, useState } from 'react'

import { defaultHapticSettings, type HapticSettings, HapticSettingsContext } from './HapticSettingsContext'
import { PaperContext, type PaperModuleShape } from './PaperContext'
import { type SoundConfig, SoundContext } from './SoundContext'

const EMPTY_SOUND: SoundConfig = {}

export type FeedbackPressProviderProps = {
  children: ReactNode
  initialValue?: Partial<HapticSettings>
  onChange?: (settings: HapticSettings) => void
  /** Injects react-native-paper so the Paper-flavored wrapper components (Button, Card, etc.) render as real Paper components instead of their plain-RN fallback. Pass `import * as RNPaper from 'react-native-paper'`; omit to keep the zero-dependency fallback UI. */
  paper?: PaperModuleShape
  /** Fires an app-supplied callback at the same instant a `selection`/`notification` haptic fires - e.g. a generic UI click sound. Omit entirely for haptic-only behavior (the default, unchanged from before this prop existed). A single component instance can opt out of just the sound (keeping its haptic) via its own `soundDisabled` prop. */
  sound?: SoundConfig
}

export function FeedbackPressProvider({ children, initialValue, onChange, paper, sound }: FeedbackPressProviderProps) {
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
  return (
    <HapticSettingsContext.Provider value={{ settings, set }}>
      <PaperContext.Provider value={paper ?? null}>
        <SoundContext.Provider value={sound ?? EMPTY_SOUND}>{children}</SoundContext.Provider>
      </PaperContext.Provider>
    </HapticSettingsContext.Provider>
  )
}

export const useFeedbackPressContext = () => {
  const { settings } = useContext(HapticSettingsContext)
  return { enabled: settings.vibrate }
}
