import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    root: "tests",
    include: ["**/*.test.ts"],
    exclude: [],
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
      '@tests/': new URL('./tests/', import.meta.url).pathname,
    },
    silent: true
  },
});
