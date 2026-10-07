import { defineConfig } from "vitest/config";

// Tests du site statique. Les paquets ont leur propre configuration dans packages/*.
export default defineConfig({
  test: { include: ["site/**/*.test.mjs"], environment: "node" },
});
