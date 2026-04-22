import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from 'node:url';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src")
    }
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    reportsDirectory: './coverage',
    include: ['src/**/*.{ts,tsx}'],
    exclude: [
      'node_modules/',
      'src/test-setup.ts',
      '**/*.stories.tsx',
      '**/*.test.tsx',
      '**/mock-*.ts',
      '.storybook/',
      'vite.config.ts',
      'vitest.config.ts',
    ],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"]
  }
});
