import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'android/',
        'ios/',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
      ],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', 'android', 'ios'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});