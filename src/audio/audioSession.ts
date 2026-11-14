import { setAudioModeAsync } from 'expo-audio'

// The shared audio session every pool and loop in this subpath configures on first mount. See
// `configureAudioSession` on `AudioPoolOptions` for what it sets and why.

let audioSessionConfigured = false
// Set (and left set) as soon as any pool or loop mounts with `configureAudioSession: false`. Since
// `audioSessionConfigured` is a process-wide, first-caller-wins singleton, a per-instance opt-out
// can only be honored process-wide too - otherwise a later pool that omits the option would still
// silently configure the session out from under the opted-out one. This can't protect a session
// that's already been configured by an earlier default pool; it only suppresses configuration
// that hasn't happened yet.
let audioSessionAutoConfigureDisabled = false

/**
 * Called from a pool's or loop's deferred creation, before any `await`, so that an opted-out
 * instance always marks the opt-out before a same-tick default instance (whose timer fires
 * afterward, since same-delay `setTimeout` callbacks run in registration order) configures it.
 */
export async function prepareAudioSession(configureAudioSession: boolean | undefined): Promise<void> {
  if (configureAudioSession === false) {
    audioSessionAutoConfigureDisabled = true
    return
  }
  if (audioSessionConfigured || audioSessionAutoConfigureDisabled) return
  audioSessionConfigured = true
  try {
    await setAudioModeAsync({ interruptionMode: 'mixWithOthers', playsInSilentMode: false })
  } catch {
    audioSessionConfigured = false
  }
}

// Test-only escape hatch to reset the module-level singletons between tests.
export function __resetAudioSessionConfiguredForTests() {
  audioSessionConfigured = false
  audioSessionAutoConfigureDisabled = false
}
