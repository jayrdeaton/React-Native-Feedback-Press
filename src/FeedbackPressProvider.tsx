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
  /** Injects react-native-paper so the Paper-flavored wrapper components (Button, Card, etc.) render as real Paper components instead of their plain-RN fallback. Pass `import * as RNPaper from 'react-native-paper'`; omit to keep the zero-dependency fallback UI. When set, this provider also wraps its own children in `paper.Portal.Host`, so this package's own context still reaches components rendered inside a Dialog/Menu/Snackbar (see the render body below for why that isn't automatic otherwise). */
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
  // react-native-paper's own Portal (what every Dialog/Menu/Snackbar renders through) doesn't
  // render its content in place: it hands children to the nearest Portal.Host's manager via an
  // imperative mount() call, which re-renders them as that host's own child - bypassing whatever
  // component tree originally contained the <Dialog>/<Portal> JSX entirely, this provider included.
  // Portal.tsx explicitly re-wraps that handoff in a fresh Paper ThemeProvider (reading Paper's own
  // theme at the original call site first), which is why a themed Dialog still looks right - but it
  // has no idea this package's own context (paper/sound/haptics) exists, so that's silently lost
  // for any of this package's Paper-flavored wrappers used inside a Dialog, with no error: each one
  // just quietly falls back to its plain, unthemed look and stops firing sound/haptics.
  //
  // Portal resolves its host via plain React context (PortalContext.Consumer), so nesting a second
  // Portal.Host here - inside this provider, using the very `paper` module it was already given -
  // shadows the outer root one (from PaperProvider) for every Portal anywhere in this subtree: their
  // mounted content now lands inside a host that's actually inside this provider, instead of one
  // that's outside it. This is a normal, supported react-native-paper pattern (Portal.Host is meant
  // to be nested per-scope - see its own doc comment), not a workaround. A consumer that never
  // renders a Dialog/Menu/Snackbar pays for one extra (flex: 1) View wrapper and nothing else.
  const content = paper ? <paper.Portal.Host>{children}</paper.Portal.Host> : children
  return (
    <HapticSettingsContext.Provider value={{ settings, set }}>
      <SoundSettingsContext.Provider value={{ settings: soundSettings, set: setSoundSetting }}>
        <PaperContext.Provider value={paper ?? null}>
          <SoundContext.Provider value={sound ?? EMPTY_SOUND}>{content}</SoundContext.Provider>
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
