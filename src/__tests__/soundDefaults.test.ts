// defaultSoundSettings.enabled is computed once, at module load, from __DEV__ - so each case
// below sets the global before a fresh `require`, via jest.resetModules(), rather than mutating
// the already-imported singleton. Restoring both afterward keeps this test isolated from the rest
// of the suite, which relies on __DEV__ being unset (so `!__DEV__` reads true, same as the old
// hardcoded default) everywhere else.
describe('defaultSoundSettings dev/prod default', () => {
  const original = (global as { __DEV__?: boolean }).__DEV__

  afterEach(() => {
    ;(global as { __DEV__?: boolean }).__DEV__ = original
    jest.resetModules()
  })

  it('defaults sound off when __DEV__ is true (dev/simulator builds)', () => {
    ;(global as { __DEV__?: boolean }).__DEV__ = true
    jest.resetModules()
    const { defaultSoundSettings } = require('../SoundSettingsContext')
    expect(defaultSoundSettings.enabled).toBe(false)
  })

  it('defaults sound on when __DEV__ is false (production builds)', () => {
    ;(global as { __DEV__?: boolean }).__DEV__ = false
    jest.resetModules()
    const { defaultSoundSettings } = require('../SoundSettingsContext')
    expect(defaultSoundSettings.enabled).toBe(true)
  })
})
