// Metro bundler config for the Expo app (task 10.1).
//
// Two concerns are handled here:
//
// 1. Monorepo / npm workspaces resolution. This app lives at
//    `apps/mobile` inside a root-level npm workspace. Hoisted dependencies end
//    up in the ROOT `node_modules`, and the local `@libras/pipeline` package is
//    symlinked there. Metro must watch the repo root and resolve modules from
//    both the app-local and the root `node_modules`.
//
// 2. Avatar bundle assets. The vendored `vlibras-player-webjs` bundle
//    (`assets/vlibras/**`) ships Unity/WebGL artifacts with non-standard
//    extensions (`.unityweb`, `.data`, `.wasm`) plus the HTML host page. Metro
//    treats unknown extensions as source by default, so we register them as
//    assets (and drop them from `sourceExts` when they collide).

const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch the whole monorepo (in ADDITION to Expo's defaults) so edits in
//    local packages are picked up, and resolve modules from both the app and
//    the hoisted root node_modules. We append rather than replace so Expo's
//    own default watch/resolve entries are preserved (expo-doctor flags a
//    replaced `watchFolders`). Hierarchical lookup stays enabled (the default)
//    so nested dependency copies still resolve.
config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), workspaceRoot]),
);
config.resolver.nodeModulesPaths = Array.from(
  new Set([
    ...(config.resolver.nodeModulesPaths ?? []),
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ]),
);

// 1b. Resolve the browser-safe pipeline entry `@libras/pipeline/client`.
//
//     The app imports `@libras/pipeline/client` — a subpath that exposes only
//     the pure, Node-free pieces (types + `parseAndNormalizeSrt`), avoiding the
//     Node-only backend (`node:crypto`/ffmpeg) that the main barrel pulls in.
//
//     Two layers make this robust across Metro versions and cache states:
//       (a) enable package.json "exports" so the `./client` subpath declared in
//           `@libras/pipeline`'s package.json is honored; and
//       (b) a hard resolver alias mapping the exact module id to the compiled
//           file, so resolution never depends on the (unstable) exports flag or
//           on a stale Metro cache. The alias wins deterministically.
config.resolver.unstable_enablePackageExports = true;

const pipelineClient = path.resolve(
  workspaceRoot,
  "packages/pipeline/dist/client.js",
);
const extraAliases = {
  "@libras/pipeline/client": pipelineClient,
};
const previousResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const alias = extraAliases[moduleName];
  if (alias !== undefined) {
    return { type: "sourceFile", filePath: alias };
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// 2. Bundle the Unity/WebGL avatar artifacts and the HTML host page as assets.
const extraAssetExts = ["unityweb", "data", "wasm", "html"];
config.resolver.assetExts = Array.from(
  new Set([...config.resolver.assetExts, ...extraAssetExts]),
);
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => !extraAssetExts.includes(ext),
);

module.exports = config;
