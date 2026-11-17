import { defineConfig } from "vitest/config";

// Root Vitest configuration. Tests run in single-execution mode via the
// `vitest run` script (no watch), matching the spec's `--run` requirement.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["{packages,apps}/**/src/**/*.{test,spec}.ts"],
    passWithNoTests: true,
  },
});
