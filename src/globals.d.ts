// React Native/Metro injects this at runtime (true in dev, false in release builds). Declared
// here rather than pulled from @types/react-native since this package's tsconfig doesn't include
// react-native's own types (see package.json's peer-only react-native dependency).
declare global {
  const __DEV__: boolean
}

export {}
