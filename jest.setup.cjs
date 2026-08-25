/* eslint-disable no-console */
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection in test:', reason)
})

// Metro always defines this global at runtime; jsdom doesn't, so referencing __DEV__ (e.g.
// defaultSoundSettings) throws ReferenceError unless something sets it first. Set to false (not
// true) so defaultSoundSettings.enabled stays `true` here, matching every other test's assumption
// that sound fires by default - the dev-vs-prod default itself is covered separately, in
// soundDefaults.test.ts, which overrides this per-case via jest.resetModules().
global.__DEV__ = false
