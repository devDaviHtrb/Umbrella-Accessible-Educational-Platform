# VLibras Player (embedded assets)

Static assets of the official VLibras Libras-avatar player, embedded so the
app can render the 3D avatar live inside a `react-native-webview`.

## Origin

- Repository: https://github.com/spbgovbr-vlibras/vlibras-player-webjs
- Package name: `vlibras` (upstream `package.json`), version **1.1.0**
- Commit: `e10387e40231476d72168eb8fea15970a64d8462` (branch `master`, 2024-07-04)
- License: **LGPL-3.0** (see [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE))

Cloned with `git clone --depth 1 --branch master`.

## Files

| File | Source | Notes |
| --- | --- | --- |
| `vlibras-player.js` | built from upstream `src/` | JS bundle, see "How the bundle was generated" |
| `target/UnityLoader.js` | upstream `src/target/` | copied verbatim (~153 KB) |
| `target/playerweb.data.unityweb` | upstream `src/target/` | copied verbatim (~8.11 MB) |
| `target/playerweb.wasm.code.unityweb` | upstream `src/target/` | copied verbatim (~3.03 MB) |
| `target/playerweb.wasm.framework.unityweb` | upstream `src/target/` | copied verbatim (~77 KB) |
| `target/playerweb.json` | upstream `src/target/` | copied verbatim (446 B) |
| `LICENSE` | upstream root | LGPL-3.0, copied verbatim |
| `NOTICE` | this repo | attribution + provenance + LGPLv3 notice |

> Size note: the task brief estimated `data.unityweb` at ~10 MB; the actual
> file in version 1.1.0 is **8.11 MB**. The wasm code file matches the ~3 MB
> estimate. The `target/` files are the unmodified upstream Unity build.

## How the bundle was generated (honest account)

The upstream build script is `webpack` (webpack **1.x**), driven by
`webpack.config.js`. That toolchain is a decade old and its dev dependencies
no longer install cleanly (`webpack@1` vs `webpack-cli@3` peer conflict:
`ERESOLVE`). **The legacy webpack build was NOT run.**

Instead, `vlibras-player.js` was produced with **esbuild** (`esbuild@0.24.0`),
bundling the upstream entry `src/index.js` into a single browser IIFE with
`globalName: "VLibras"`. This mirrors what the webpack config does: expose
`window.VLibras = { Player }` (the upstream `src/index.js` also assigns
`window.VLibras`). The webpack `externals: { window: "window" }` mapping was
reproduced with an alias from `require("window")` to the real global `window`.
Node core modules that webpack 1.x auto-polyfilled for the browser were aliased
to standard polyfills: `path` → `path-browserify`, `events` → `events`.
(`Player.js` imports `path` but only uses the commented-out `path.join`; the
active code path resolves asset URLs via `url-join`.)

Bundle facts (verified locally):

- `node --check vlibras-player.js` passes (valid syntax).
- No unresolved `require(...)` calls remain in the output (fully bundled).
- References `UnityLoader`, the translator URL `traducao2.vlibras.gov.br`, and
  the dictionary URL `dicionario2.vlibras.gov.br` (from upstream `src/config.js`).
- Exposes the player both as a top-level `VLibras` binding and as
  `window.VLibras`, so `new VLibras.Player({ target: { name, path } })` works.

### Not verified here

The player instantiates a Unity/WebGL runtime and calls the VLibras online
services. Whether it loads and animates end-to-end can only be confirmed by
loading the HTML page (task 3.2) inside a browser/WebView with network access.
That runtime verification was **not** performed in this task. If the esbuild
bundle ever misbehaves at runtime, the LGPLv3-compliant fallback is to run the
upstream `webpack` build (or re-bundle `src/`) and replace `vlibras-player.js`.

## licenseReviewId

Use this deterministic identifier in `AvatarRuntimeConfig.licenseReviewId`:

```
vlibras-player-webjs-LGPLv3-v1.1.0-e10387e
```

It encodes: component, license (LGPLv3), upstream version (1.1.0) and the
short commit (`e10387e`) this bundle was built from.

## Loading

The HTML bridge page (task 3.2) should reference:

```html
<script src="./vlibras-player.js"></script>
<script>
  const player = new VLibras.Player({ target: { name: "<avatar>", path: "./target" } });
  player.load(document.getElementById("wrapper"));
</script>
```

`UnityLoader.js` is loaded by the player itself from `target/UnityLoader.js`
(relative to the `target.path` passed above).
