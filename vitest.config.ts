import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',

    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '**/*.config.ts'],

    // Setup files
    setupFiles: ['./tests/setup/vitest.setup.ts'],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.config.{ts,js}',
        'scripts/',
      ],
    },

    // Timeouts
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
});
