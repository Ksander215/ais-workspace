import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '**/node_modules/**'],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'forks',
  },
});
