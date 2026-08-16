# @rific/feedback-press

Haptic and sound feedback wrappers for React Native Paper and built-in pressable components. Drop-in replacements that fire `selection` haptics (and, optionally, an app-supplied sound) on touch-down and `notification` feedback on long press, with a single provider to toggle them globally.

## Install

```sh
npm install @rific/feedback-press
```

**Peer dependencies:**

```sh
# Required
npm install expo-haptics

# Optional, only needed to render the real Paper look
npm install react-native-paper
```

`react-native-paper` is never auto-detected and never a hard dependency of this package. Pass it to `<FeedbackPressProvider paper={...}>` (see below) and the Paper wrappers (`Button`, `Card`, `FAB`, etc.) render as real Paper components; omit it and they render a small built-in plain-RN fallback instead, so the package works the same whether you use Paper, a different styling library, or nothing at all. The exported Redux slice has no dependency on `@reduxjs/toolkit`: it works with RTK stores, vanilla Redux, or no Redux at all.

## Usage

### Without a provider (always-on)

The default context has haptics enabled, so the provider is optional if you don't need a toggle.

```tsx
import { Button, Card, TouchableRipple } from '@rific/feedback-press'

export function MyScreen() {
  return (
    <Card onPress={() => openDetail()}>
      <Card.Content>
        <TouchableRipple onPress={() => doSomething()}>
          <Text>Tap me</Text>
        </TouchableRipple>
        <Button onPress={() => submit()}>Submit</Button>
      </Card.Content>
    </Card>
  )
}
```

### With a provider (user-controlled toggle)

Wrap once at your app root and pass the user's settings: every component inside reads them automatically.

```tsx
import { FeedbackPressProvider } from '@rific/feedback-press'
import * as RNPaper from 'react-native-paper'

export function App() {
  return (
    <FeedbackPressProvider initialValue={{ vibrate: true }} onChange={saveSettings} paper={RNPaper}>
      <RootNavigator />
    </FeedbackPressProvider>
  )
}
```

`paper` is optional: pass it to get the real Paper look on the Paper wrappers, or omit it to use their plain-RN fallback.

### Using the hook directly

```tsx
import { useVibration } from '@rific/feedback-press'

export function DangerButton() {
  const { notification, forceDouble } = useVibration()

  return (
    <Pressable
      onPress={() => {
        notification() // respects the provider toggle
        deleteRecord()
      }}
      onLongPress={() => {
        forceDouble() // always fires, ignores the toggle
        wipeAll()
      }}
    />
  )
}
```

### `withFeedback`: wrapping your own components

The Paper and native wrappers below cover the common cases. For anything else (your own component, or one from a different styling library), `withFeedback` wires up the same haptic (and sound) behavior without a bespoke wrapper:

```tsx
import { withFeedback } from '@rific/feedback-press'
import { Button } from 'some-other-ui-library'

const FeedbackButton = withFeedback(Button)
// <FeedbackButton onPress={...}> now fires `selection` on press-down and `notification`
// on long-press, exactly like this package's own Button.
```

By default it wires `selection` to `onPressIn` (gated on `onPress`/`onLongPress` being present, so decorative elements stay silent) and `notification` to `onLongPress`, the same convention every component in this package follows. Pass a `wiring` map to target different props:

```tsx
// A value-driven component (like Switch) instead of a press-driven one:
const FeedbackToggle = withFeedback(SomeToggle, { onValueChange: 'selection' })

// A component with no onPressIn (fires on release instead of touch-down):
const FeedbackFAB = withFeedback(SomeFAB, { onPress: 'selection', onLongPress: 'notification' })
```

## Components

All components are drop-in replacements with identical prop types to their originals. The Paper wrappers render the real `react-native-paper` component when `paper` is injected into `<FeedbackPressProvider>`, and a small built-in plain-RN fallback (not a Material Design reproduction) otherwise; see [Install](#install).

### Paper wrappers

| Component | Fires on | Note |
|---|---|---|
| `Button` | `onPressIn` | |
| `IconButton` | `onPressIn` | |
| `TouchableRipple` | `onPressIn` | |
| `Card` | `onPressIn` | `onLongPress` has no event arg (Paper) |
| `Chip` | `onPressIn` | `onLongPress` has no event arg (Paper) |
| `AppbarBackAction` | `onPress` | Paper doesn't expose `onPressIn` |
| `AppbarAction` | `onPress` | Paper doesn't expose `onPressIn` |
| `FAB` | `onPress` | Paper doesn't expose `onPressIn` |
| `Checkbox` | `onPress` | Paper doesn't expose `onPressIn` |
| `Switch` | `onValueChange` | Value-driven, no `onPress`/`onPressIn` |
| `SegmentedButtons` | `onValueChange` | Value-driven, no `onPress`/`onPressIn` |

`Card` re-exports its subcomponents: `Card.Content`, `Card.Title`, `Card.Actions`, `Card.Cover`.

### Native wrappers

| Component | Fires on |
|---|---|
| `Pressable` | `onPressIn` |
| `TouchableOpacity` | `onPressIn` |
| `TouchableHighlight` | `onPressIn` |

**Feedback timing:** `selection` fires on `onPressIn` (finger down) rather than `onPress` (finger up) to match native iOS feel. Long press fires `notification` on `onLongPress`. Elements with no `onPress` or `onLongPress` are treated as non-interactive and fire nothing.

## `FeedbackPressProvider`

| Prop | Type | Default | Description |
|---|---|---|---|
| `initialValue` | `Partial<HapticSettings>` | `defaultHapticSettings` | Initial settings. Merged with defaults, partial is fine. |
| `onChange` | `(settings: HapticSettings) => void` | - | Called with the full settings object whenever settings change. |
| `paper` | `PaperModuleShape` | - | Injects `react-native-paper` (`import * as RNPaper from 'react-native-paper'`) so the Paper wrappers render the real thing instead of their plain-RN fallback. Never auto-detected, never required. |
| `sound` | `SoundConfig` | - | Fires an app-supplied callback alongside each haptic. See [Sound feedback](#sound-feedback). |
| `children` | `ReactNode` | - | |

```ts
type HapticSettings = {
  vibrate: boolean  // default: true
}
```

### `useHapticSettings`

Read or update settings from anywhere inside the provider:

```tsx
import { useHapticSettings } from '@rific/feedback-press'

export function SettingsScreen() {
  const { settings, set } = useHapticSettings()

  return (
    <Switch
      value={settings.vibrate}
      onValueChange={(value) => set({ vibrate: value })}
    />
  )
}
```

### Redux integration

If your app uses Redux, wire the included slice to your store and bridge it to the provider:

```tsx
import { configureStore } from '@reduxjs/toolkit'
import { hapticReducer, hapticActions, FeedbackPressProvider } from '@rific/feedback-press'
import { useSelector, useDispatch } from 'react-redux'

const store = configureStore({
  reducer: {
    haptic: hapticReducer,
    // ...
  }
})

export function App() {
  const dispatch = useDispatch()
  const settings = useSelector((state) => state.haptic)

  return (
    <FeedbackPressProvider
      initialValue={settings}
      onChange={(next) => dispatch(hapticActions.initialize(next))}
    >
      <RootNavigator />
    </FeedbackPressProvider>
  )
}
```

Available actions: `hapticActions.initialize(settings)` (replace all), `hapticActions.setVibrate(boolean)`.

## `useVibration`

```ts
const {
  // Semantic
  selection,           // () => void, light tap (iOS selectionAsync)
  notification,        // (type?) => void, success/warning/error pulse

  // Impact
  short,               // () => void, light impact
  medium,              // () => void, medium impact
  long,                // () => void, heavy impact
  double,              // () => void, two-pulse notification
  custom,              // (duration: number) => void

  // Force, bypass the enabled toggle
  force,               // (duration?: number) => void
  forceShort,          // () => void
  forceMedium,         // () => void
  forceLong,           // () => void
  forceDouble,         // () => void

  isEnabled,           // boolean, current provider state
} = useVibration()
```

All methods respect the `FeedbackPressProvider` `enabled` flag. The `force*` variants bypass it: use them for feedback that should always fire (error states, destructive confirmations).

On iOS, methods use `expo-haptics` native APIs. On Android, they fall back to `Vibration.vibrate()` with mapped durations.

## Sound feedback

Pass a `sound` config to `<FeedbackPressProvider>` to fire an app-supplied callback at the same instant a `selection`/`notification` haptic fires - a generic UI click sound, a success chime, whatever your app plays. It's entirely optional: omit `sound` and every component behaves exactly as before this prop existed, haptic-only.

```tsx
import { FeedbackPressProvider } from '@rific/feedback-press'

export function App() {
  return (
    <FeedbackPressProvider sound={{ selection: playClick, notification: playChime }}>
      <RootNavigator />
    </FeedbackPressProvider>
  )
}
```

| Key | Fires alongside |
|---|---|
| `selection` | the `selection` haptic |
| `notification` | the `notification` haptic |

Both keys are optional: pass only the ones you have a sound for.

### Per-instance overrides

Every wrapper component accepts three optional, wiring-time-only props for tweaking just that one instance — none of them ever reach the underlying Paper/native component:

| Prop | Effect |
|---|---|
| `soundDisabled` | Suppresses just the sound callback on this instance, keeping its haptic. |
| `hapticDisabled` | Suppresses just the haptic on this instance, keeping its sound - the independent counterpart to `soundDisabled`. |
| `sound` | Overrides the provider's ambient `sound` config for just this instance, e.g. a distinct sound for one particular button. Same `{ selection?, notification? }` shape as the provider's own `sound` prop. |

```tsx
// A silent-but-still-vibrating button:
<Button soundDisabled onPress={submit}>Submit</Button>

// A button that vibrates but never makes a sound, even with a provider-wide sound configured:
<IconButton icon='delete' hapticDisabled onPress={remove} />

// A button with its own distinct sound instead of the app-wide generic click:
<Button sound={{ selection: playDeleteSound }} onPress={remove}>Delete</Button>
```

## Usage with `@rific/auto-paper`

Paper wrappers automatically inherit the theme from `@rific/auto-paper`'s `Provider`, no extra wiring needed.

```tsx
import { Provider } from '@rific/auto-paper'
import { FeedbackPressProvider, Button } from '@rific/feedback-press'

export function App() {
  return (
    <Provider appearance="system" color="#FF6B6B">
      <FeedbackPressProvider initialValue={{ vibrate }}>
        <Button onPress={handlePress}>Themed + Haptic</Button>
      </FeedbackPressProvider>
    </Provider>
  )
}
```

## Platform notes

- **iOS**: uses `expo-haptics` (`selectionAsync`, `notificationAsync`, `impactAsync`)
- **Android**: falls back to `Vibration.vibrate()` with duration mapping
- **Web**: haptics are no-ops (expo-haptics returns silently)
