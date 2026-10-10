import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'app/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'e2e'],
  },
});
