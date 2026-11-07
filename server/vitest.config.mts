import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // `tsc` emits tests into dist/, which Vitest would otherwise treat as
    // CommonJS test files and fail on require('vitest').
    exclude: ['dist/**', 'node_modules/**'],
  },
})
