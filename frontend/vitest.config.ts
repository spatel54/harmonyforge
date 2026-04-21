import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Enable Jest-style globals so engine tests (migrated from Jest) work without
    // adding explicit `import { describe, it, expect }` lines to every file.
    globals: true,
    environmentMatchGlobs: [
      ["**/musicxmlParser.test.ts", "happy-dom"],
      ["**/useGenerationConfigStore.test.ts", "happy-dom"],
      ["**/riffscorePositions.test.ts", "happy-dom"],
    ],
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
