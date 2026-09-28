import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.js"],
    coverage: { include: ["src/profileUrl.js", "src/detect.js", "src/settings.js", "src/report.js"] },
  },
});
