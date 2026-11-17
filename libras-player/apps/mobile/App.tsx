// Expo app root component (tasks 10.1 + 10.2).
//
// This is the Expo application shell — it is DELIBERATELY SEPARATE from
// `src/index.ts`, which is the library barrel consumed by the pipeline/tsc
// build. The Expo entry (`index.js`) registers THIS component as the root via
// `registerRootComponent`.
//
// Task 10.2 mounts the `DemoScreen`, which loads a local schemaVersion-3
// manifest (served by `scripts/serve-package.mjs`) and renders the
// `LibrasTranslationPlayer` so play/pause/seek, the avatar toggle and the
// captions fallback can be exercised end to end. See `src/demo/DemoScreen.tsx`
// and the app README for how to run it.

import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";

import { DemoScreen } from "./src/demo/DemoScreen";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <DemoScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101114",
  },
});
