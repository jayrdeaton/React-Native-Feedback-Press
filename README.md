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

## `useHoldToRepeat`

For a long-press-and-hold control that should keep firing for as long as it's held — a stepper FAB, a randomize button, anything with a "do it again, and again" gesture — rather than a single one-shot `onLongPress`. Fires `action` once immediately, then again every `repeatMs` for as long as the hold continues, alongside a `selection`/`notification` pulse (haptic and, if configured, sound) on **every** one of those firings, not just the first.

Component-agnostic: `useHoldToRepeat` just returns plain `onLongPress`/`onPressOut` callbacks, so it works with any component that exposes those two props — every wrapper in this package (`Button`, `Card`, `Chip`, `FAB`, `IconButton`, `TouchableRipple`, the native `Pressable`/`TouchableOpacity`/`TouchableHighlight`), a plain `react-native-paper` or bare-RN component, or your own via `withFeedback`. It's demonstrated below with `FAB`, but nothing about it is FAB-specific — including in this package's own plain-RN fallback (no `paper` injected): every wrapper that accepts `onLongPress` also correctly forwards `onPressOut`/`delayLongPress` in fallback mode, not just when Paper is real.

```tsx
import { FAB, useHoldToRepeat } from '@rific/feedback-press'

export function StepperFAB({ onStep }: { onStep: () => void }) {
  const hold = useHoldToRepeat(onStep, 400)

  return <FAB icon='plus' onLongPress={hold.onLongPress} onPressOut={hold.onPressOut} delayLongPress={400} />
}
```

```ts
const {
  onLongPress,  // () => void — wire to the component's own onLongPress
  onPressOut,   // () => void — wire to the component's own onPressOut
} = useHoldToRepeat(action, repeatMs, options?)
```

| Option | Type | Default | Description |
|---|---|---|---|
| `feedback` | `'selection' \| 'notification' \| false` | `'selection'` | Which feedback event fires on every tick. `false` disables feedback for the whole repeat loop; `action` still fires normally. |
| `hapticDisabled` | `boolean` | `false` | Suppresses just the haptic, keeping any sound. |
| `soundDisabled` | `boolean` | `false` | Suppresses just the sound, keeping the haptic. |
| `sound` | `SoundConfig` | - | Overrides the provider's ambient `sound` config for just this hold-to-repeat loop, the same per-instance override every wrapper component's own `sound` prop already gives. |

`useHoldToRepeatByKey` is the keyed sibling, for a set of independently-holdable targets that all funnel through one action (e.g. per-item "randomize" buttons rendered from a list) instead of a single fixed one — same shape, but `action` takes a `key`, and `onLongPress`/`onPressOut` are curried on it. Two different keys held at once keep entirely separate timers; releasing one never stops the other's.

```tsx
const hold = useHoldToRepeatByKey(randomizeGroup, 1000)

<FAB onLongPress={hold.onLongPress('mirror')} onPressOut={hold.onPressOut('mirror')} />
```

Both hooks call `action` (and pulse feedback) synchronously on the initial `onLongPress` — pair with a component that already fires its own `notification` there (like this package's own `FAB`) and the very first press gets both; that's intentional, the same "confirmed, now repeating" double-pulse a real long-press-then-hold naturally reads as.

`onLongPress` is safe to call again before a matching `onPressOut` (e.g. a gesture handler that double-fires it) — it restarts the repeat cleanly instead of leaking the previous interval.

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

### Playing the sounds: `@rific/feedback-press/audio`

`sound` just wants a `() => void` per event - how you build `playClick`/`playChime` is up to you. If you're using `expo-audio`, `@rific/feedback-press/audio` exports `useAudioPool`, a small hook that plays a clip through a round-robin pool of players instead of a single shared one:

```sh
npm install expo-audio
```

```tsx
import { useAudioPool } from '@rific/feedback-press/audio'
import { FeedbackPressProvider } from '@rific/feedback-press'

const CLICK_SOUND = require('./assets/click.wav')
const CHIME_SOUND = require('./assets/chime.wav')

export function App() {
  const playClick = useAudioPool(CLICK_SOUND)
  const playChime = useAudioPool(CHIME_SOUND, { poolSize: 6 })

  return (
    <FeedbackPressProvider sound={{ selection: playClick, notification: playChime }}>
      <RootNavigator />
    </FeedbackPressProvider>
  )
}
```

**Why a pool, not a single player:** a single `AudioPlayer` retriggered rapidly races itself - a second press's `seekTo(0)` (needed so a retriggered clip restarts from the top instead of resuming mid-clip) can reset playback position out from under the first press's still-in-flight `play()` call, silently aborting it. The sound just never plays for that press, not merely overlaps or cuts short. `useAudioPool` builds the pool with `createAudioPlayer` (a plain factory, not the `useAudioPlayer` hook) and hands back a single play function; overlapping presses land on different players internally and never race each other.

`poolSize` (default `4`, clamped to 16) is a real allocation, not a fixed ceiling - `poolSize: 1` creates exactly one native player, `poolSize: 6` creates six. Pick it per clip based on how often that specific sound actually gets retriggered in quick succession: a one-shot sound (a win/loss jingle) is fine at the default or even `1`, while something a user might rapidly double/triple-tap wants more headroom. Call `useAudioPool` once per clip, same as `useAudioPlayer`.

`expo-audio` is a peer dependency of this subpath only, not of the package's main entry - haptics-only consumers never need it installed, and Metro never traces it unless you import from `@rific/feedback-press/audio` yourself.

### Per-instance overrides

Every wrapper component accepts four optional, wiring-time-only props for tweaking just that one instance — none of them ever reach the underlying Paper/native component:

| Prop | Effect |
|---|---|
| `soundDisabled` | Suppresses just the sound callback on this instance, keeping its haptic. |
| `hapticDisabled` | Suppresses just the haptic on this instance, keeping its sound - the independent counterpart to `soundDisabled`. |
| `sound` | Overrides the provider's ambient `sound` config for just this instance, e.g. a distinct sound for one particular button. Same `{ selection?, notification? }` shape as the provider's own `sound` prop. |
| `exclusive` | Fires exactly one of `selection`/`notification` per gesture instead of both - see below. |

```tsx
// A silent-but-still-vibrating button:
<Button soundDisabled onPress={submit}>Submit</Button>

// A button that vibrates but never makes a sound, even with a provider-wide sound configured:
<IconButton icon='delete' hapticDisabled onPress={remove} />

// A button with its own distinct sound instead of the app-wide generic click:
<Button sound={{ selection: playDeleteSound }} onPress={remove}>Delete</Button>
```

### `exclusive`

By default, `selection` fires the moment a finger goes down (`onPressIn`, matching native iOS feel) and `notification` fires separately if the press escalates into a completed long-press - so a slow press-and-hold fires *both*, one after the other. That's the right feel for most buttons, but some presses want the opposite: a stepper's `-`/`+`, a delete action distinct from a delete-and-undo long-press, anything where the two feedback events represent mutually exclusive outcomes of the same gesture rather than an escalating pair.

```tsx
<Button exclusive onPress={submit} onLongPress={submitAndClose}>Submit</Button>
```

With `exclusive`, `selection` is deferred all the way to release and only actually fires if the press never escalated - `notification` alone fires for a completed long-press, never both. Your own `onPress`/`onLongPress`/`onPressIn`/`onPressOut` callbacks are unaffected either way; only the haptic/sound feedback's timing changes. Works on every wrapper that accepts `onLongPress` (`Button`, `Card`, `Chip`, `FAB`, `IconButton`, `TouchableRipple`), the native `Pressable`/`TouchableOpacity`/`TouchableHighlight` wrappers, and your own components via `withFeedback` - anywhere the underlying `wiring` maps some prop to `notification`. On a component with no long-press concept (`Checkbox`, `Switch`, `SegmentedButtons`, `AppbarAction`, `AppbarBackAction`), `exclusive` is a harmless no-op, since there's nothing to be exclusive against.

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
