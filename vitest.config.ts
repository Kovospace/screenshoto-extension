import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests live in test/, mirroring src/ (test/editor/model/History.test.ts covers src/editor/model/History.ts).
    include: ['test/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['test/support/setup.ts'],
    restoreMocks: true,
  },
});
