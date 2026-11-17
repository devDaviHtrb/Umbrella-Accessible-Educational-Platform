// Monorepo workaround: ensure Expo's dev-client "loading page" resolves.
//
// Expo SDK 52's dev server serves a `/_expo/loading` splash for development
// builds. Its CLI resolves `expo/static/loading-page/index.html` from the
// project root first, then falls back to a path inside `@expo/cli`. In this
// npm-workspaces monorepo (with `expo` hoisted to the repo root) BOTH lookups
// miss, so `/_expo/loading` returns 404 and the installed dev build shows
// "There was a problem loading the project. ... response error code: 404".
//
// The file DOES exist inside `@expo/cli/static/loading-page/`; it is simply not
// present at the `expo/static/loading-page/` path the resolver checks first.
// This script copies it there so the endpoint resolves (HTTP 200) and the dev
// build boots straight into the app.
//
// It runs on `postinstall` (so it survives `npm install`, which otherwise wipes
// the manual copy) and is idempotent + best-effort: any failure is logged, not
// fatal, so it never breaks installs on platforms where the paths differ.

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";

function main() {
  const require = createRequire(import.meta.url);

  // Resolve the hoisted `expo` and `@expo/cli` package locations.
  let expoPkg;
  let cliPkg;
  try {
    expoPkg = path.dirname(require.resolve("expo/package.json"));
    cliPkg = path.dirname(require.resolve("@expo/cli/package.json"));
  } catch (error) {
    console.log(
      `[fix-expo-loading-page] expo/@expo/cli not resolvable yet; skipping (${String(
        error,
      )}).`,
    );
    return;
  }

  const source = path.join(cliPkg, "static", "loading-page");
  const dest = path.join(expoPkg, "static", "loading-page");

  if (!existsSync(source)) {
    console.log(
      `[fix-expo-loading-page] source not found: ${source}; skipping.`,
    );
    return;
  }
  if (existsSync(path.join(dest, "index.html"))) {
    // Already in place (idempotent).
    return;
  }

  try {
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(source, dest, { recursive: true });
    console.log(`[fix-expo-loading-page] created ${dest} (monorepo workaround).`);
  } catch (error) {
    console.log(
      `[fix-expo-loading-page] could not copy loading page: ${String(error)}.`,
    );
  }
}

main();
