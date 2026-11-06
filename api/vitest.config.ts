import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load the test environment before any module reads process.env.
config({ path: '.env.test', override: true });

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['tests/globalSetup.ts'],
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    // Tests share one database, so run files sequentially.
    fileParallelism: false,
  },
});
