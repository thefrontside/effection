/// <reference types="vitest" />

// Configure Vitest (https://vitest.dev/config/)
import checker from 'vite-plugin-checker';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /* for example, use global to avoid globals imports (describe, test, expect): */
    // globals: true,
  },
  plugins: [
    checker({
      typescript: { tsconfigPath: 'tsconfig.json' },
      overlay: true,
    }),
  ],
});
