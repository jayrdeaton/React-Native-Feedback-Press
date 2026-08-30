const { defineConfig } = require('eslint/config')
const base = require('@infinitetoken/eslint-config/react-native')

module.exports = defineConfig([
  ...base,
  {
    // src/__mocks__ stays ignored: tsconfig.json excludes it from the TS project, so eslint's
    // type-aware parser can't resolve those files if this ignore is lifted (parsing errors).
    ignores: ['src/__mocks__/**']
  }
])
