# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

# @rific/feedback-press

Haptic and sound feedback wrappers for React Native Paper and built-in pressable components. Drop-in replacements that fire `selection` haptics (and, optionally, an app-supplied sound) on touch-down and `notification` feedback on long press, with a single provider to toggle both globally.

Part of the `@rific` package ecosystem. Published at https://www.npmjs.com/package/@rific/feedback-press.

## Commands

```bash
npm run lint         # ESLint check
npm run fix           # Auto-fix lint issues
npm run typecheck    # TypeScript type check (tsc --noEmit)
npm test             # Jest (164 tests)
npm run test:watch   # Jest in watch mode
npm run build        # tsup, outputs CJS + ESM + types to dist/ (two entries: index.ts, audio/index.ts)
npm run build:watch  # tsup in watch mode
npm run verify        # lint + test + typecheck + build, in that order
```

Always run `npm run lint` before finishing any task.

## Release

Tag-based, using npm trusted publishing (OIDC, no token required):

```bash
npm run release:patch   # npm version patch && git push --follow-tags
npm run release:minor   # npm version minor && git push --follow-tags
npm run release:major   # npm version major && git push --follow-tags
```

`prepublishOnly` runs `build` automatically. `preversion` runs `verify` (lint + test + typecheck + build). The `publish.yml` workflow fires on `v*` tags and runs the shared `infinitetoken/Workflows` `npm-publish.yml` job (`id-token: write` for OIDC).

## Architecture

```
src/
  index.ts                    - main public exports (Provider, hooks, wrapper components, redux slices)
  audio/
    index.ts                  - public exports for the optional `./audio` subpath (useAudioPool)
    useAudioPool.ts            - round-robins presses across a small pool of expo-audio AudioPlayers so a fast repeat press never races a still-playing seekTo/play; lazily configures the shared (process-wide) audio session on first mount
  FeedbackPressProvider.tsx    - Provider: composes HapticSettingsContext + SoundSettingsContext + PaperContext + SoundContext into one tree; useFeedbackPressContext/useFeedbackPressSoundContext read the resolved enabled flags
  HapticSettingsContext.ts     - HapticSettings type ({ vibrate }), defaultHapticSettings, and its React context
  SoundContext.ts              - SoundConfig type ({ selection?, notification? }) and its React context - the ambient app-supplied sound callbacks
  SoundSettingsContext.ts      - SoundSettings type ({ enabled }); defaultSoundSettings is `!__DEV__` (sound muted in dev/simulator by default), and its React context
  PaperContext.ts              - local mirrors of react-native-paper's component prop shapes (ButtonProps, CardProps, ChipProps, etc.) plus PaperModuleShape and the PaperContext/useFeedbackPressPaper hook that injects the Paper module without importing its real types (so consumers who never installed react-native-paper aren't forced to resolve it)
  useFeedbackHandlers.ts       - core wiring hook: maps a FeedbackWiring config onto a component's own event props (selection fires on touch-down, notification on long-press); implements `exclusive` mode (defers selection to onPressOut so only one of selection/notification ever fires per gesture) and strips the reserved soundDisabled/hapticDisabled/sound/exclusive props before they reach the underlying component
  useHapticSettings.ts         - useContext(HapticSettingsContext) wrapper
  useSoundSettings.ts          - useContext(SoundSettingsContext) wrapper
  useVibration.ts              - low-level haptic primitives (selection/notification/short/medium/long/double/custom + force* variants that ignore the enabled toggle); iOS uses expo-haptics, Android falls back to Vibration.vibrate
  useHoldToRepeat.ts           - useHoldToRepeat / useHoldToRepeatByKey: setInterval-based repeat-while-held hooks with stale-closure-safe refs (latestAction/latestPulse) and idempotent start/stop
  withFeedback.tsx             - HOC escape hatch: wraps any component with useFeedbackHandlers wiring, for components this package doesn't ship a wrapper for
  globals.d.ts                 - declares the `__DEV__` global (not pulled from @types/react-native since this package's tsconfig doesn't include react-native's own types)
  components/
    native/
      Pressable.tsx             - withFeedback(RN Pressable)
      TouchableHighlight.tsx    - withFeedback(RN TouchableHighlight)
      TouchableOpacity.tsx      - withFeedback(RN TouchableOpacity)
    paper/
      AppbarAction.tsx          - Paper Appbar.Action wrapper, wired on onPress (Paper doesn't expose onPressIn there); plain-RN fallback icon button
      AppbarBackAction.tsx      - Paper Appbar.BackAction wrapper, wired on onPress; plain-RN fallback "←" button
      Button.tsx                - Paper Button wrapper; plain-RN fallback Pressable+Text
      Card.tsx                  - Paper Card wrapper plus Card.Content/Title/Actions/Cover subcomponents; plain-RN fallback (only Pressable-wraps when actually interactive)
      Checkbox.tsx               - Paper Checkbox wrapper, wired on onPress; plain-RN fallback checked/indeterminate box
      Chip.tsx                   - Paper Chip wrapper; plain-RN fallback
      FAB.tsx                    - Paper FAB wrapper, wired on onPress (Paper's FAB has no onPressIn); plain-RN fallback
      IconButton.tsx              - Paper IconButton wrapper; plain-RN fallback
      SegmentedButtons.tsx        - Paper SegmentedButtons wrapper, wired on onValueChange; plain-RN fallback (single-select only - can't detect Paper's multi-select mode without Paper)
      Switch.tsx                  - Paper Switch wrapper, wired on onValueChange; plain-RN fallback is RN's own Switch, unstyled
      TouchableRipple.tsx          - Paper TouchableRipple wrapper; plain-RN fallback Pressable with android_ripple
      fallbackStyles.ts            - fallbackColors + StyleSheet shared by every plain-RN fallback above (functional, not a Material Design reproduction)
      renderFallbackIcon.tsx        - renders Paper's `icon` prop shape (a name string or render function) without react-native-paper or an icon font installed
  redux/
    hapticSlice.ts              - thin binding over @rific/core's createSettingsSlice('haptic', {initialState: defaultHapticSettings}) factory - no @reduxjs/toolkit dependency, works with RTK, vanilla Redux, or none. Corrected 2026-09-18: this used to be a hand-rolled reducer/actions pair; it was migrated onto the shared factory in an earlier pass but this doc was never updated to match - see @rific/core's own CLAUDE.md for the factory itself
    soundSlice.ts               - same thin binding, createSettingsSlice('sound', {initialState: defaultSoundSettings})
  __mocks__/
    react-native.ts              - jest manual mock: View/Text/Image/Pressable/Switch/Touchable*, Platform (OS: 'ios'), Vibration.vibrate, StyleSheet passthrough
    react-native-paper.ts         - jest manual mock: every Paper component this package wraps, as jest.fn() stubs that capture props for assertions
    expo-haptics.ts               - jest manual mock: selectionAsync/notificationAsync/impactAsync + ImpactFeedbackStyle/NotificationFeedbackType enums
    expo-audio.ts                 - jest manual mock: useAudioPlayer/createAudioPlayer/setAudioModeAsync stubs
```

## Public API

`src/index.ts` (default entry):
- `FeedbackPressProvider` / `FeedbackPressProviderProps`: composes haptic settings, sound settings, and the optional injected Paper module for the whole tree; props are `children`, `initialValue`, `onChange`, `paper`, `sound`, `soundInitialValue`, `onSoundChange`
- `HapticSettings`, `defaultHapticSettings`, `HapticSettingsContext`: the `{ vibrate }` settings shape and its context
- `SoundConfig`, `SoundContext`: ambient `{ selection?, notification? }` sound callbacks and their context
- `SoundSettings`, `defaultSoundSettings`, `SoundSettingsContext`: the `{ enabled }` sound-toggle shape (defaults to `!__DEV__`) and its context
- `PaperModuleShape`, `useFeedbackPressPaper()`: the injected-Paper-module type and the hook that reads it
- `hapticActions`, `hapticReducer` / `soundActions`, `soundReducer`: standalone Redux-shaped reducers for each settings object
- `FeedbackTrigger`, `FeedbackWiring`, `FeedbackWiringEntry`, `PRESS_WIRING`, `useFeedbackHandlers(props, wiring?)`: the core event-wiring hook and its types
- `useHapticSettings()` / `useSoundSettings()`: read the current settings + setter from context
- `HoldToRepeatOptions`, `useHoldToRepeat(action, repeatMs, options?)`, `useHoldToRepeatByKey(action, repeatMs, options?)`: repeat-while-held hooks
- `useVibration()`: low-level haptic primitives (`selection`, `notification`, `short`/`medium`/`long`/`double`/`custom`, and `force*` variants that bypass the enabled toggle)
- `withFeedback(Component, wiring?)`: HOC that wires feedback handlers onto an arbitrary component
- Native wrappers: `Pressable`/`PressableProps`, `TouchableHighlight`/`TouchableHighlightProps`, `TouchableOpacity`/`TouchableOpacityProps`
- Paper wrappers (render real Paper components when `paper` is injected, a plain-RN fallback otherwise): `AppbarAction`, `AppbarBackAction`, `Button`, `Card` (with `.Content`/`.Title`/`.Actions`/`.Cover`), `Checkbox`, `Chip`, `FAB`, `IconButton`, `SegmentedButtons`, `Switch`, `TouchableRipple`, each with a matching `*Props` type

`src/audio/index.ts` (`@rific/feedback-press/audio` subpath):
- `AudioPoolOptions`, `useAudioPool(source, options?)`: pooled expo-audio playback hook that returns a single `() => void` trigger function

## Peer Dependencies

- `react` (required, >=19.0.0)
- `react-native` (required, >=0.76.0)
- `expo-haptics` (required, >=56.0.0) - drives `useVibration`'s iOS haptics
- `expo-audio` (optional, >=56.0.0) - only needed for the `./audio` subpath's `useAudioPool`
- `react-native-paper` (optional, >=5.0.0) - only needed to render the real Paper look; never auto-detected, injected explicitly via `<FeedbackPressProvider paper={...}>`, and every Paper wrapper renders a working plain-RN fallback when it's omitted

## Testing

- Framework: Jest + ts-jest (via `@infinitetoken/jest-config/react-native`), jsdom environment
- Mocks in `src/__mocks__/` for `react-native`, `react-native-paper`, `expo-haptics`, `expo-audio`
- 164 tests across 13 suites in `src/__tests__/`
- Coverage clears the fleet's 70%×4 default with real margin — measured 94.97/83.15/92.3/96.63% (statements/branches/functions/lines) as of 2026-08-30; no local `coverageThreshold` override

## Code Style

Enforced by ESLint + Prettier, run `npm run lint` before finishing any task.

**Prettier config:**
- Single quotes, JSX single quotes
- No semicolons
- No trailing commas
- Print width: 1000 (effectively disabled)

**ESLint rules (warnings unless noted):**
- `simple-import-sort` - imports and exports must be sorted
- `react-native/no-inline-styles` - no inline style objects
- `react-native/no-unused-styles` - no unused StyleSheet entries
- `no-console` - no console statements
- `react-hooks/rules-of-hooks` - error, not a warning
- `react-hooks/exhaustive-deps`, `react-hooks/refs`, `react-hooks/immutability`, `react-hooks/preserve-manual-memoization`, `react-hooks/set-state-in-effect`
- `@typescript-eslint/no-unused-vars` - `_`-prefixed vars/args/caught errors are exempt
- `src/__mocks__/**` is excluded from linting (its files sit outside `tsconfig.json`'s `include`, so the type-aware parser can't resolve them)
