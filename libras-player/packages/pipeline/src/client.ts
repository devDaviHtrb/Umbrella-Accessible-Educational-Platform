// Client-safe entry point for `@libras/pipeline`.
//
// The main barrel (`index.ts`) re-exports the whole offline pipeline, which
// pulls in Node-only modules (`node:crypto`, `node:fs`, `node:child_process`,
// ffmpeg/ffprobe executors). Importing that barrel from a React Native / web
// bundle (the mobile app) makes Metro try to resolve `node:crypto` and fail.
//
// This entry exposes ONLY the pieces the client app actually needs at runtime,
// all of which are pure and free of any Node dependency:
//   - the domain types and interfaces (erased at compile time anyway);
//   - the `PipelineError` carrier (a plain Error subclass);
//   - `parseAndNormalizeSrt` and its options/`ClampEvent` (pure string/number
//     work, no I/O).
//
// The mobile app imports from `@libras/pipeline/client` (mapped in this
// package's `exports`), so it never reaches the Node-only backend code.

// Shared domain contracts (types and interfaces from the design document).
export type * from "./domain/types.js";

// Runtime error carrier for blocking failures (pure Error subclass).
export { PipelineError, isPipelineError } from "./domain/PipelineError.js";
export type { PipelineErrorOptions } from "./domain/PipelineError.js";

// SRT parsing and normalization (pure; no Node I/O).
export {
  parseAndNormalizeSrt,
  DEFAULT_CLAMP_TOLERANCE_MS,
} from "./srt/parseAndNormalizeSrt.js";
export type {
  ParseAndNormalizeSrtOptions,
  ClampEvent,
} from "./srt/parseAndNormalizeSrt.js";
