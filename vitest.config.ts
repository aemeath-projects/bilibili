import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: [],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      thresholds: { functions: 80, lines: 80 },
    },
    reporters: ['default', 'junit'],
    outputFile: { junit: './test-results/junit.xml' },
  },
})
