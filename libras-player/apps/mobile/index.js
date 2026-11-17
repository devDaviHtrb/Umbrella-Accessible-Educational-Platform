// Expo entry point (task 10.1).
//
// NOTE: this is the APP entry, intentionally distinct from `src/index.ts`
// (the library barrel consumed by the pipeline/tsc build). `package.json`
// points `"main"` here. `registerRootComponent` calls `AppRegistry` and sets
// up the environment appropriately for Expo (dev client / Expo Go / web).

import { registerRootComponent } from "expo";

import App from "./App";

registerRootComponent(App);
