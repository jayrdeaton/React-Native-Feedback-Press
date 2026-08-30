module.exports = require('@infinitetoken/jest-config/react-native')({
  moduleNameMapper: {
    '^react-native$': '<rootDir>/src/__mocks__/react-native.ts',
    '^react-native-paper$': '<rootDir>/src/__mocks__/react-native-paper.ts',
    '^expo-audio$': '<rootDir>/src/__mocks__/expo-audio.ts',
    '^expo-haptics$': '<rootDir>/src/__mocks__/expo-haptics.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  overrides: {
    // The factory default already covers .tsx and excludes src/index.ts. The only real
    // deviation this package needs: it has a second build entry (src/audio/index.ts, the
    // ./audio subpath's own barrel), which the default can't know about — excluded the same
    // way as the main barrel, since it's pure re-exports too.
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/index.ts', '!src/audio/index.ts']
  }
})
