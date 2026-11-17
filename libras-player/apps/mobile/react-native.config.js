// React Native CLI autolinking config for this monorepo app.
//
// Why this file exists:
//   The native third-party modules this app uses — `react-native-webview`
//   (`RNCWebViewModule`) and `react-native-video` (`RCTVideo`) — are HOISTED to
//   the repo-root `node_modules` by npm workspaces, not the app-local one. RN
//   CLI autolinking (which wires non-Expo native modules into the Android/iOS
//   build) only scans the project's own `node_modules` by default, so in this
//   layout it finds NOTHING and the EAS build produces an APK WITHOUT those
//   native modules. At runtime the JS then crashes with
//   `TurboModuleRegistry.getEnforcing('RNCWebViewModule') could not be found`.
//
//   Pointing `dependencies[<pkg>].root` at the hoisted package directory tells
//   autolinking exactly where each native module lives, so EAS compiles them
//   into the binary. Paths are resolved from the repo root via `require.resolve`
//   so they are correct regardless of hoisting.

const path = require("path");

/** Absolute path to a hoisted package's root (where its package.json sits). */
function resolvePackageRoot(pkg) {
  return path.dirname(require.resolve(`${pkg}/package.json`));
}

module.exports = {
  dependencies: {
    "react-native-webview": {
      root: resolvePackageRoot("react-native-webview"),
    },
    "react-native-video": {
      root: resolvePackageRoot("react-native-video"),
    },
  },
};
