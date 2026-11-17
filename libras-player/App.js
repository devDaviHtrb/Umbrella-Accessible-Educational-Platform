// Monorepo entry shim for the hoisted `expo/AppEntry.js`.
//
// In this npm-workspaces monorepo the `expo` package is hoisted to the repo
// root (`<root>/node_modules/expo`). Expo's default native entry,
// `node_modules/expo/AppEntry.js`, does `import App from "../../App"`, which
// resolves to THIS file (`<root>/App.js`) — not to the real app at
// `apps/mobile/App.tsx`. Without this shim Metro fails with
// `Unable to resolve "../../App" from "node_modules\expo\AppEntry.js"`.
//
// So this file simply re-exports the real Expo root component from the mobile
// app. It keeps the hoisted AppEntry fallback working for native builds
// (`expo start --android`, EAS dev/preview builds) without changing the app's
// own `index.js` entry (which `registerRootComponent`s the same component).
//
// This is a thin compatibility shim, not application code.

export { default } from "./apps/mobile/App";
