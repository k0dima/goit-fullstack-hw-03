import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    env: {
      JWT_SECRET: "test-secret",
      DATABASE_URL: "postgresql://test:test@127.0.0.1:1/test",
    },
  },
});
