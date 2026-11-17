// Dev-only static file server for the generated translation package.
//
// Task 11.2 — serves the schemaVersion-3 package produced by task 11.1
// (`packages/pipeline/src/e2e/runRealMedia.ts` → `runRealMediaV3`) so the
// Expo demo app (task 10.2) can fetch `manifest.json`, stream `original.mp4`
// and read `transcript.normalized.srt` over HTTP during local development.
//
//   _Requirements: 12.5_
//
// ── What it serves ─────────────────────────────────────────────────────────
// A single root directory, defaulting to the immutable revision directory that
// task 11.1 writes:
//
//     packages/pipeline/.e2e-out/media/chocolate-from-cacao/v3/
//       manifest.json             (schemaVersion 3, avatarRuntime)
//       original.mp4              (H.264/AAC)
//       transcript.normalized.srt (267 cues, final cue clamped, 719 ms)
//       avatar-runtime.json       (Avatar_Runtime_Config)
//       checksums.sha256
//
// The official `vlibras-player-webjs` avatar bundle is NOT served from the
// generated package. The mobile app bundles it locally under
// `apps/mobile/assets/vlibras/` (task 3.1) and loads `index.html` from its own
// asset bundle. For convenience when prototyping outside the RN bundler, this
// server ALSO exposes that vendored bundle under the `/vlibras/` prefix when
// the directory exists — see `AVATAR_BUNDLE_DIR` below. Either way, the only
// artifacts the demo strictly needs from here are `manifest.json`,
// `original.mp4` and `transcript.normalized.srt`.
//
// ── Usage ───────────────────────────────────────────────────────────────────
//   node apps/mobile/scripts/serve-package.mjs
//   node apps/mobile/scripts/serve-package.mjs <packageDir> [port]
//   PACKAGE_DIR=/abs/path PORT=8787 node apps/mobile/scripts/serve-package.mjs
//
// CLI args take precedence over env vars; env vars take precedence over the
// built-in defaults (PACKAGE_DIR → the task-11.1 v3 output, PORT → 8787).
//
// ── Origin to use in the app (packageRepository) ─────────────────────────────
// The server base URL is logged on start, e.g. `http://localhost:8787/`, and
// the manifest is reachable directly at `http://localhost:8787/manifest.json`.
//
// NOTE — HTTP vs HTTPS mismatch (for task 10.2 to resolve):
// `HttpsTranslationPackageRepository`
// (`apps/mobile/src/data/packageRepository.ts`) intentionally REQUIRES https://
// and resolves `{baseUrl}/{mediaId}/{revision}/manifest.json`. This dev server
// speaks plain HTTP and serves the manifest at the ROOT (`/manifest.json`), so
// it is deliberately NOT drop-in compatible with that repository. This script
// does not rewrite the repository. For local dev the demo screen (task 10.2)
// should load the manifest via a direct HTTP `fetch` (or a dev-only flag/origin
// override) rather than through `HttpsTranslationPackageRepository`. Task 10.2
// owns closing that gap; this script only serves the bytes and documents the
// mismatch.
//
// Pure Node, zero external dependencies: node:http, node:fs, node:path only.

import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import * as nodePath from "node:path";

// ── Paths & config ──────────────────────────────────────────────────────────

/** This script lives at apps/mobile/scripts/serve-package.mjs. */
const SCRIPT_DIR = nodePath.dirname(fileURLToPath(import.meta.url));

/** Monorepo root (…/vvli), three levels up from this script. */
const REPO_ROOT = nodePath.resolve(SCRIPT_DIR, "..", "..", "..");

/** Default package directory: the v3 revision written by task 11.1. */
const DEFAULT_PACKAGE_DIR = nodePath.join(
  REPO_ROOT,
  "packages",
  "pipeline",
  ".e2e-out",
  "media",
  "chocolate-from-cacao",
  "v3",
);

/** Default port (overridable via `PORT` env or the second CLI arg). */
const DEFAULT_PORT = 8787;

/**
 * Optional vendored avatar bundle, served under `/vlibras/` when present. The
 * app normally bundles this itself; this is only a prototyping convenience.
 */
const AVATAR_BUNDLE_DIR = nodePath.join(
  REPO_ROOT,
  "apps",
  "mobile",
  "assets",
  "vlibras",
);
const AVATAR_BUNDLE_PREFIX = "/vlibras/";

/** Resolve the package root and port from CLI args and env, in that order. */
function resolveConfig(argv, env) {
  const [dirArg, portArg] = argv;
  const packageDir = nodePath.resolve(
    dirArg ?? env.PACKAGE_DIR ?? DEFAULT_PACKAGE_DIR,
  );
  const rawPort = portArg ?? env.PORT;
  const port =
    rawPort !== undefined ? Number.parseInt(rawPort, 10) : DEFAULT_PORT;
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Porta inválida: ${String(rawPort)}`);
  }
  return { packageDir, port };
}

// ── Content types ─────────────────────────────────────────────────────────

/** Map a file extension to a Content-Type for the artifacts we serve. */
function contentTypeFor(filePath) {
  const ext = nodePath.extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".json":
      return "application/json; charset=utf-8";
    case ".srt":
      // SRT subtitles. `application/x-subrip` is the common registered type;
      // some tools expect `text/*`. We send the subrip type with a charset.
      return "application/x-subrip; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".wasm":
      return "application/wasm";
    case ".unityweb":
      // Unity/WebGL compressed asset bundle (vlibras-player-webjs target/*).
      return "application/octet-stream";
    case ".data":
      return "application/octet-stream";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

// ── Request handling ─────────────────────────────────────────────────────

/** CORS + no-cache headers applied to every response (dev only). */
function baseHeaders() {
  return {
    // Fully open CORS so the app/WebView can fetch the manifest cross-origin.
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, Content-Type",
    "Access-Control-Expose-Headers":
      "Content-Length, Content-Range, Accept-Ranges",
    // Range requests require the server to advertise byte-range support.
    "Accept-Ranges": "bytes",
    // Dev server: never cache, so regenerated packages are picked up at once.
    "Cache-Control": "no-store",
  };
}

/**
 * Safely resolve a URL path to a file within one of the served roots. Returns
 * the absolute file path or `null` when the request escapes the root (path
 * traversal) or targets an unknown prefix.
 */
function resolveTarget(urlPath, packageDir) {
  // Decode and strip the query string; default `/` to the manifest-friendly
  // root listing (we serve `/manifest.json` for the bare manifest).
  let pathname;
  try {
    pathname = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return null;
  }

  // Vendored avatar bundle under /vlibras/ (optional convenience root).
  if (
    pathname === AVATAR_BUNDLE_PREFIX.replace(/\/$/, "") ||
    pathname.startsWith(AVATAR_BUNDLE_PREFIX)
  ) {
    const rel = pathname.slice(AVATAR_BUNDLE_PREFIX.length) || "index.html";
    return safeJoin(AVATAR_BUNDLE_DIR, rel);
  }

  // Everything else is served from the package directory.
  const rel = pathname === "/" ? "manifest.json" : pathname.replace(/^\/+/, "");
  return safeJoin(packageDir, rel);
}

/** Join `root` + `rel` and reject any result that escapes `root`. */
function safeJoin(root, rel) {
  const resolved = nodePath.resolve(root, rel);
  const rootWithSep = root.endsWith(nodePath.sep) ? root : root + nodePath.sep;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) {
    return null;
  }
  return resolved;
}

/** Parse a single `bytes=start-end` Range header against `size`. */
function parseRange(rangeHeader, size) {
  if (typeof rangeHeader !== "string") return undefined;
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (match === null) return undefined;
  const [, startRaw, endRaw] = match;
  let start;
  let end;
  if (startRaw === "" && endRaw === "") return undefined;
  if (startRaw === "") {
    // Suffix range: last N bytes.
    const suffix = Number.parseInt(endRaw, 10);
    if (!Number.isFinite(suffix) || suffix <= 0) return undefined;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number.parseInt(startRaw, 10);
    end = endRaw === "" ? size - 1 : Number.parseInt(endRaw, 10);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) return undefined;
  if (start > end || start < 0 || start >= size) return { unsatisfiable: true };
  end = Math.min(end, size - 1);
  return { start, end };
}

/** Handle one HTTP request against the resolved package root. */
function handleRequest(req, res, packageDir, log) {
  const method = req.method ?? "GET";

  if (method === "OPTIONS") {
    res.writeHead(204, baseHeaders());
    res.end();
    return;
  }
  if (method !== "GET" && method !== "HEAD") {
    res.writeHead(405, { ...baseHeaders(), Allow: "GET, HEAD, OPTIONS" });
    res.end("405 Method Not Allowed\n");
    return;
  }

  const target = resolveTarget(req.url ?? "/", packageDir);
  if (target === null) {
    res.writeHead(403, { ...baseHeaders(), "Content-Type": "text/plain" });
    res.end("403 Forbidden\n");
    log(`${method} ${req.url} -> 403 (fora da raiz)`);
    return;
  }

  let stats;
  try {
    stats = statSync(target);
  } catch {
    res.writeHead(404, { ...baseHeaders(), "Content-Type": "text/plain" });
    res.end("404 Not Found\n");
    log(`${method} ${req.url} -> 404`);
    return;
  }
  if (stats.isDirectory()) {
    // Serve the directory's index.html when present; otherwise 404 (no listing).
    const indexPath = nodePath.join(target, "index.html");
    if (!existsSync(indexPath)) {
      res.writeHead(404, { ...baseHeaders(), "Content-Type": "text/plain" });
      res.end("404 Not Found\n");
      log(`${method} ${req.url} -> 404 (diretório sem index.html)`);
      return;
    }
    return streamFile(req, res, indexPath, method, log);
  }

  return streamFile(req, res, target, method, log, stats.size);
}

/** Stream a regular file, honoring HEAD and a single Range request. */
function streamFile(req, res, filePath, method, log, knownSize) {
  const size = knownSize ?? statSync(filePath).size;
  const type = contentTypeFor(filePath);
  const headers = { ...baseHeaders(), "Content-Type": type };

  const range = parseRange(req.headers["range"], size);

  if (range !== undefined && range.unsatisfiable === true) {
    res.writeHead(416, {
      ...headers,
      "Content-Range": `bytes */${size}`,
    });
    res.end();
    log(`${method} ${req.url} -> 416 (range inválido)`);
    return;
  }

  if (range !== undefined) {
    const { start, end } = range;
    const chunkSize = end - start + 1;
    res.writeHead(206, {
      ...headers,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(chunkSize),
    });
    log(`${method} ${req.url} -> 206 ${start}-${end}/${size}`);
    if (method === "HEAD") {
      res.end();
      return;
    }
    const stream = createReadStream(filePath, { start, end });
    stream.on("error", () => res.destroy());
    stream.pipe(res);
    return;
  }

  res.writeHead(200, { ...headers, "Content-Length": String(size) });
  log(`${method} ${req.url} -> 200 ${size} (${type})`);
  if (method === "HEAD") {
    res.end();
    return;
  }
  const stream = createReadStream(filePath);
  stream.on("error", () => res.destroy());
  stream.pipe(res);
}

// ── Server bootstrap ────────────────────────────────────────────────────

/**
 * Create (but do not start) the HTTP server bound to `packageDir`. Exported so
 * a quick smoke test can start it on an ephemeral port and tear it down.
 */
export function createPackageServer(packageDir, log = () => {}) {
  return createServer((req, res) => {
    try {
      handleRequest(req, res, packageDir, log);
    } catch (error) {
      if (!res.headersSent) {
        res.writeHead(500, { ...baseHeaders(), "Content-Type": "text/plain" });
      }
      res.end("500 Internal Server Error\n");
      log(`Erro ao servir ${req.url}: ${String(error)}`);
    }
  });
}

/** Start the server and log the base URL plus example routes. */
async function main() {
  const { packageDir, port } = resolveConfig(
    process.argv.slice(2),
    process.env,
  );

  // Warn (but do not fail) when the default package dir is missing: the user
  // may have pointed elsewhere or not generated the package yet (task 11.1).
  let packageExists = true;
  try {
    const dirStat = await stat(packageDir);
    packageExists = dirStat.isDirectory();
  } catch {
    packageExists = false;
  }

  const server = createPackageServer(packageDir, (m) => console.log(`  ${m}`));

  server.listen(port, () => {
    const base = `http://localhost:${port}`;
    console.log("Servidor de pacote (dev) — Libras Translation Player");
    console.log(`  raiz do pacote: ${packageDir}`);
    if (!packageExists) {
      console.log(
        "  AVISO: a raiz do pacote não existe. Gere-a com a tarefa 11.1 " +
          "(runRealMediaV3) ou aponte PACKAGE_DIR para um pacote válido.",
      );
    }
    if (existsSync(AVATAR_BUNDLE_DIR)) {
      console.log(
        `  bundle do avatar: ${AVATAR_BUNDLE_DIR} (servido em ${base}${AVATAR_BUNDLE_PREFIX})`,
      );
    } else {
      console.log(
        "  bundle do avatar: ausente — o app empacota o VLibras localmente " +
          "(assets/vlibras); só o manifest/original/transcript são servidos aqui.",
      );
    }
    console.log(`  URL base:       ${base}/`);
    console.log("  Rotas:");
    console.log(
      `    ${base}/manifest.json              (manifesto schemaVersion 3)`,
    );
    console.log(
      `    ${base}/original.mp4               (vídeo H.264/AAC, suporta Range)`,
    );
    console.log(
      `    ${base}/transcript.normalized.srt  (legendas normalizadas)`,
    );
    console.log(
      `    ${base}/avatar-runtime.json        (Avatar_Runtime_Config)`,
    );
    console.log(`    ${base}/checksums.sha256           (integridade)`);
    console.log(
      `    ${base}${AVATAR_BUNDLE_PREFIX}index.html          (bundle do avatar, se presente)`,
    );
    console.log(
      "  CORS liberado (Access-Control-Allow-Origin: *). Ctrl+C para parar.",
    );
  });

  server.on("error", (error) => {
    console.error(
      `Falha ao iniciar o servidor na porta ${port}: ${String(error)}`,
    );
    process.exitCode = 1;
  });
}

// Only run when invoked directly (not when imported by a smoke test).
const invokedPath = process.argv[1] ? nodePath.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(String(error));
    process.exitCode = 1;
  });
}
