import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(new URL(import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(rootDir, "src"),
      "@convex": path.join(rootDir, "convex")
    }
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
