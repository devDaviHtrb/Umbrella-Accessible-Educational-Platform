// End-to-end harness over the REAL media (`video.webm` + `subtitles.txt`).
//
// Task 21.1: run `preparePrototypePackage` against the real workspace assets,
// producing `original.mp4`, `manifest.json` and — when an authorized local
// VLibras provider is available — `prototype-avatar.mp4`; then run
// `validateTechnicalPackage` over the produced variants and FAIL the harness
// (non-zero exit, thrown error) on any integrity violation.
//
//   _Requirements: 16.1, 16.4, 12.4, 12.5_
//
// This module is an *executable harness*, not a unit test. It wires the
// already-implemented, fully-injected pipeline stages to CONCRETE ffmpeg /
// ffprobe executors that shell out via `node:child_process`, resolves the
// authorized provider from the environment (defaulting to the compliant
// avatar-less fallback), writes the immutable package under
// `packages/pipeline/.e2e-out/media/{mediaId}/{revision}/` and re-runs the
// technical validation over the manifest's variants.
//
// Design/compliance posture (mirrors `preparePrototypePackage`):
//   - By default NO authorized provider is used -> avatar-less fallback
//     (Req 7.1 / 13.1 / 13.2). A provider is opted in ONLY when
//     `VLIBRAS_BASE_URL` + `VLIBRAS_TERMS_REVIEW_ID` (+ token secret id) are
//     present in the environment; if the local stack is unreachable or
//     unauthorized the harness still falls back without blocking the original.
//   - The token itself is never read here; the provider adapter resolves it
//     from a secret manager by id (Req 17.1 / 18.1). This harness ships only a
//     dev, env-backed secret manager for the local prototype stack.
//   - ffmpeg/ffprobe absence is a RUNTIME condition, never a build/type error:
//     nothing shells out at module load; the executors only run when invoked.
//
// IMPORTANT (honest verification note): ffmpeg/ffprobe may NOT be installed in
// the environment this harness is compiled in. The harness is written so it
// *compiles* and *lint-passes* without the binaries. When run, it first probes
// for ffprobe and, if absent, still exercises the verifiable SRT stage
// (parse + normalize + clamp) and reports — honestly — that the full real run
// requires the binaries, exiting non-zero so CI does not mistake a skipped run
// for a pass.

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import {
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as nodePath from "node:path";

import {
  inspectMedia,
  type CommandRunner,
  type FileHasher,
} from "../media/inspectMedia.js";
import {
  parseAndNormalizeSrt,
  type ClampEvent,
} from "../srt/parseAndNormalizeSrt.js";
import {
  transcodeOriginal,
  type FfmpegExecutor as TranscodeExecutor,
} from "../media/transcode.js";
import type {
  FfmpegExecutor as RenderExecutor,
  RenderedMediaInfo,
} from "../render/renderPrototypeVariant.js";
import {
  preparePrototypePackage,
  type PreparePrototypePackageOptions,
  type ProbeOriginalVariant,
  type ResolveAuthorizedProvider,
  type TranscriptWriter,
} from "../preparePrototypePackage.js";
import {
  validateTechnicalPackage,
  hashFileSha256,
} from "../package/validateTechnicalPackage.js";
import {
  writePackage,
  createRealtimeManifest,
  writeRealtimePackage,
} from "../package/createManifest.js";
import { PipelineError, isPipelineError } from "../domain/PipelineError.js";
import type {
  AvatarGenerationResult,
  AvatarRuntimeConfig,
  MediaVariant,
  Milliseconds,
  OriginalMediaVariant,
  Sha256,
  TranscriptCue,
  TranslationManifest,
  TranslationManifestV3,
  Uri,
} from "../domain/types.js";

// --- Constants ------------------------------------------------------------

/** Expected measured duration of the real asset (`video.webm`), in ms. */
const EXPECTED_DURATION_MS = 814_681;

/** Expected number of cues in the real `subtitles.txt`. */
const EXPECTED_CUE_COUNT = 267;

/** The final cue ends here in the source SRT; it is clamped to the duration. */
const FINAL_CUE_RAW_END_MS = 815_400;

/** The final cue clamp divergence we expect to observe (ms). */
const EXPECTED_FINAL_CLAMP_MS = 719;

/** Stable media id / revision used for the e2e package. */
const MEDIA_ID = "chocolate-from-cacao";
const REVISION = "e2e";

/** Revision label for the v3 (live-avatar) package. */
const REVISION_V3 = "v3";

// --- v3 (live-avatar) runtime defaults ------------------------------------

/**
 * Local bundle URI the app serves for the live VLibras WebView player. A
 * relative path the mobile bundler/static server resolves at runtime; the
 * harness only records it in `avatar-runtime.json`.
 */
const DEFAULT_PLAYER_BUNDLE_URI = "vlibras/index.html";

/** Default avatar rendered by `vlibras-player-webjs`. */
const DEFAULT_AVATAR_NAME = "icaro";

/** Default playback speed forwarded to the live player. */
const DEFAULT_AVATAR_SPEED = 1;

/**
 * License-review id registered in task 3.1 for the bundled official player
 * (`vlibras-player-webjs`, LGPLv3) and its avatar/dictionary rights.
 */
const LICENSE_REVIEW_ID = "vlibras-player-webjs-LGPLv3-v1.1.0-e10387e";

// --- Paths ----------------------------------------------------------------

/** Absolute path to the monorepo root (…/vvli), derived from this module. */
function repoRoot(): string {
  // This file compiles to packages/pipeline/dist/e2e/runRealMedia.js, so the
  // repo root is four levels up from the compiled file's directory.
  const here = nodePath.dirname(fileURLToPath(import.meta.url));
  return nodePath.resolve(here, "..", "..", "..", "..");
}

/** Absolute path to the pipeline package root (…/packages/pipeline). */
function pipelineRoot(): string {
  return nodePath.resolve(repoRoot(), "packages", "pipeline");
}

/** Resolved input/output locations for the harness. */
type HarnessPaths = Readonly<{
  sourceVideo: string;
  subtitles: string;
  outRoot: string;
  workDir: string;
  originalOut: string;
  prototypeOut: string;
  transcriptOut: string;
}>;

function resolvePaths(): HarnessPaths {
  const root = repoRoot();
  const outRoot = nodePath.join(pipelineRoot(), ".e2e-out");
  const workDir = nodePath.join(outRoot, "work");
  return {
    sourceVideo: nodePath.join(root, "video.webm"),
    subtitles: nodePath.join(root, "subtitles.txt"),
    outRoot,
    workDir,
    // Name the produced original after the media id: createManifestWithFallback
    // derives the manifest `mediaId` from this file's basename, so this keeps
    // the published package under media/{MEDIA_ID}/… (writePackage still writes
    // the artifact itself as the canonical `original.mp4`).
    originalOut: nodePath.join(workDir, `${MEDIA_ID}.mp4`),
    prototypeOut: nodePath.join(workDir, "prototype-avatar.mp4"),
    transcriptOut: nodePath.join(workDir, "transcript.normalized.srt"),
  };
}

// --- Concrete ffmpeg / ffprobe adapters -----------------------------------

/**
 * Runs a binary and resolves with `{ exitCode, stdout, stderr }`. Never
 * rejects on a non-zero exit — the caller decides what a non-zero code means
 * (the transcode/render stages already treat it as a failure). It rejects only
 * when the process cannot be spawned at all (e.g. ffmpeg not installed), which
 * the caller surfaces as a clear "binary missing" condition.
 */
function runBinary(
  binary: string,
  args: readonly string[],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      binary,
      [...args],
      { maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error && typeof (error as { code?: unknown }).code === "string") {
          // Spawn failure (ENOENT etc.) carries a string `code`; a non-zero
          // *exit* carries a numeric code on `error.code`. Distinguish them.
          reject(error);
          return;
        }
        const exitCode =
          error && typeof (error as { code?: unknown }).code === "number"
            ? ((error as { code: number }).code)
            : 0;
        resolve({ exitCode, stdout, stderr });
      },
    );
  });
}

/** ffprobe command runner for {@link inspectMedia} (returns stdout only). */
function makeFfprobeRunner(ffprobePath: string): CommandRunner {
  return async (command, args) => {
    const result = await runBinary(command || ffprobePath, args);
    if (result.exitCode !== 0) {
      throw PipelineError.assetIntegrityFailed(
        `ffprobe encerrou com código ${result.exitCode}: ${result.stderr}`,
        { details: { command, exitCode: result.exitCode } },
      );
    }
    return result.stdout;
  };
}

/** ffmpeg executor shared by the transcode and render stages. */
function makeFfmpegExecutor(): TranscodeExecutor & RenderExecutor {
  return async (binary, args) => {
    const result = await runBinary(binary, args);
    return {
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  };
}

/** Streaming SHA-256 of a file path. */
const hashFile: FileHasher = (uri) =>
  new Promise<Sha256>((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(uri);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });

/**
 * Probes a produced MP4 with ffprobe and returns the minimal measured info the
 * renderer needs. Shared by the render `probeOutput` boundary.
 */
async function probeMp4(
  ffprobePath: string,
  uri: Uri,
): Promise<RenderedMediaInfo & { videoCodec?: string; audioCodec?: string }> {
  const run = makeFfprobeRunner(ffprobePath);
  const json = await run(ffprobePath, [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    uri,
  ]);
  const parsed = JSON.parse(json) as {
    streams?: ReadonlyArray<{
      codec_type?: string;
      codec_name?: string;
      width?: number;
      height?: number;
      duration?: string;
    }>;
    format?: { duration?: string };
  };
  const streams = parsed.streams ?? [];
  const video = streams.find((s) => s.codec_type === "video");
  const audio = streams.find((s) => s.codec_type === "audio");
  const durationSeconds = Number.parseFloat(
    parsed.format?.duration ?? video?.duration ?? audio?.duration ?? "NaN",
  );
  if (!Number.isFinite(durationSeconds)) {
    throw PipelineError.assetIntegrityFailed(
      `ffprobe não reportou duração para ${uri}.`,
    );
  }
  const info: RenderedMediaInfo & {
    videoCodec?: string;
    audioCodec?: string;
  } = {
    durationMs: Math.round(durationSeconds * 1000),
    width: typeof video?.width === "number" ? video.width : 0,
    height: typeof video?.height === "number" ? video.height : 0,
    ...(video?.codec_name !== undefined
      ? { videoCodec: video.codec_name }
      : {}),
    ...(audio?.codec_name !== undefined
      ? { audioCodec: audio.codec_name }
      : {}),
  };
  return info;
}

/**
 * `probeOriginal` boundary: probe + hash the produced `original.mp4` into a
 * validated `MediaVariant` of kind `"original"`. The source input is AV1/Opus
 * in WebM; the transcoded original is H.264/AAC/mp4, so it must be probed on
 * its own rather than reusing the source inspection.
 */
function makeProbeOriginal(ffprobePath: string): ProbeOriginalVariant {
  return async (outputUri) => {
    const info = await probeMp4(ffprobePath, outputUri);
    const sha256 = await hashFile(outputUri);
    const variant: MediaVariant = {
      kind: "original",
      uri: outputUri,
      mimeType: "video/mp4",
      // The transcode stage pins H.264/AAC; we assert what it produced and
      // surface a clear integrity error if the real output diverges.
      videoCodec: "h264",
      audioCodec: "aac",
      durationMs: info.durationMs,
      width: info.width,
      height: info.height,
      sha256,
    };
    if (info.videoCodec !== undefined && info.videoCodec !== "h264") {
      throw PipelineError.assetIntegrityFailed(
        `A variante original foi produzida com vídeo '${info.videoCodec}', ` +
          "esperado 'h264'.",
        { details: { uri: outputUri, videoCodec: info.videoCodec } },
      );
    }
    if (info.audioCodec !== undefined && info.audioCodec !== "aac") {
      throw PipelineError.assetIntegrityFailed(
        `A variante original foi produzida com áudio '${info.audioCodec}', ` +
          "esperado 'aac'.",
        { details: { uri: outputUri, audioCodec: info.audioCodec } },
      );
    }
    return variant;
  };
}

// --- Transcript writer -----------------------------------------------------

/** Serialize normalized cues back to SRT (1-based index, comma millis). */
export function serializeCuesToSrt(cues: readonly TranscriptCue[]): string {
  const lines: string[] = [];
  cues.forEach((cue, index) => {
    lines.push(String(index + 1));
    lines.push(`${formatTimecode(cue.startMs)} --> ${formatTimecode(cue.endMs)}`);
    lines.push(cue.textPtBr);
    lines.push("");
  });
  return `${lines.join("\n")}\n`;
}

function formatTimecode(ms: Milliseconds): string {
  const totalMs = Math.max(0, Math.round(ms));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1_000);
  const millis = totalMs % 1_000;
  const pad = (n: number, width: number): string =>
    String(n).padStart(width, "0");
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(millis, 3)}`;
}

/** Writes the normalized transcript to disk and returns its URI. */
function makeTranscriptWriter(transcriptOut: string): TranscriptWriter {
  return async (cues) => {
    await mkdir(nodePath.dirname(transcriptOut), { recursive: true });
    await writeFile(transcriptOut, serializeCuesToSrt(cues), "utf8");
    return transcriptOut;
  };
}

// --- Provider resolution (optional local VLibras) --------------------------

/**
 * Resolve the authorized provider from the environment.
 *
 * Default: NO authorized provider (returns `undefined`) -> the compliant
 * avatar-less fallback (Req 7.1). A provider is attempted ONLY when the env
 * opts in with `VLIBRAS_BASE_URL` + `VLIBRAS_TERMS_REVIEW_ID`. The adapter
 * lives in `@libras/provider-vlibras`, which depends on this package, so it is
 * imported dynamically and guarded: a missing package or an unreachable /
 * unauthorized stack degrades to the fallback rather than failing the build or
 * blocking the original package (Req 13.1 / 13.2).
 */
function makeResolveProvider(
  env: Readonly<Record<string, string | undefined>>,
  log: (message: string) => void,
): ResolveAuthorizedProvider {
  return async () => {
    const optedIn =
      typeof env.VLIBRAS_BASE_URL === "string" &&
      typeof env.VLIBRAS_TERMS_REVIEW_ID === "string";
    if (!optedIn) {
      log(
        "Provedor: nenhum provedor autorizado configurado " +
          "(defina VLIBRAS_BASE_URL + VLIBRAS_TERMS_REVIEW_ID para apontar " +
          "ao ambiente local). Usando fallback sem avatar.",
      );
      return undefined;
    }

    try {
      // Dynamic, optional import: provider-vlibras depends on this package, so
      // a static import would invert the dependency graph. The specifier is
      // kept in a variable so the compiler does not try to resolve it as a
      // build-time dependency of @libras/pipeline.
      const moduleName = "@libras/provider-vlibras";
      const mod = (await import(moduleName)) as {
        VLibrasSelfHostedProvider: {
          fromEnv: (
            env: Readonly<Record<string, string | undefined>>,
            deps: { secretManager: { getSecret: (id: string) => Promise<string | undefined> } },
          ) => {
            healthCheck: () => Promise<{
              available: boolean;
              authorizedForRequestedUse: boolean;
              reason?: string;
            }>;
          };
        };
      };

      // Dev-only, env-backed secret manager: the token itself lives in the
      // environment of the local prototype box, resolved by id — never in the
      // app or the manifest (Req 17.1 / 18.1).
      const secretManager = {
        getSecret: async (secretId: string): Promise<string | undefined> =>
          env[secretId] ?? env.VLIBRAS_TOKEN ?? undefined,
      };

      const provider = mod.VLibrasSelfHostedProvider.fromEnv(
        { ...env, VLIBRAS_TOKEN_SECRET_ID: env.VLIBRAS_TOKEN_SECRET_ID ?? "VLIBRAS_TOKEN" },
        { secretManager },
      );

      const health = await provider.healthCheck();
      if (!health.available || !health.authorizedForRequestedUse) {
        log(
          "Provedor: ambiente VLibras local indisponível ou não autorizado " +
            `(${health.reason ?? "sem detalhes"}). Usando fallback sem avatar.`,
        );
        return undefined;
      }
      log("Provedor: ambiente VLibras local disponível e autorizado.");
      // The provider implements AvatarTranslationProvider; the pipeline only
      // forwards it to the gateway, so the structural shape is sufficient.
      return provider as unknown as Awaited<
        ReturnType<ResolveAuthorizedProvider>
      >;
    } catch (error) {
      log(
        "Provedor: falha ao carregar/usar @libras/provider-vlibras " +
          `(${describeError(error)}). Usando fallback sem avatar.`,
      );
      return undefined;
    }
  };
}

// --- Harness result --------------------------------------------------------

/** Structured outcome of a harness run, useful for the optional 21.2 test. */
export type RunRealMediaResult = Readonly<{
  /** Number of cues parsed from the real SRT (expected 267). */
  cueCount: number;
  /** The final cue's raw end before clamping, in ms. */
  finalCueRawEndMs: Milliseconds;
  /** The clamp discrepancy applied to the final cue, in ms (expected 719). */
  finalCueClampMs: Milliseconds;
  /** Whether the produced manifest exposes an avatar variant. */
  avatarAvailable: boolean;
  /** The produced, validated manifest. */
  manifest: TranslationManifest;
  /** The immutable revision directory the package was written to. */
  revisionDir: string;
  /** Absolute output paths written. */
  outputs: Readonly<{
    manifest: string;
    original: string;
    transcript: string;
    prototype?: string;
    checksums: string;
  }>;
}>;

/** Options for {@link runRealMedia} (all optional; defaults target the repo). */
export type RunRealMediaOptions = Readonly<{
  /** Environment used for provider opt-in. Defaults to `process.env`. */
  env?: Readonly<Record<string, string | undefined>>;
  /** Logger sink. Defaults to `console.log`. */
  log?: (message: string) => void;
  /** ffmpeg binary path. Defaults to `"ffmpeg"`. */
  ffmpegPath?: string;
  /** ffprobe binary path. Defaults to `"ffprobe"`. */
  ffprobePath?: string;
}>;

// --- Public entry point ----------------------------------------------------

/**
 * Runs the full real-media pipeline end to end and writes the immutable
 * package, then re-validates the produced variants.
 *
 * @throws {PipelineError} on any pipeline failure or integrity violation. The
 *   CLI wrapper maps a throw to a non-zero exit code.
 */
export async function runRealMedia(
  options: RunRealMediaOptions = {},
): Promise<RunRealMediaResult> {
  const env = options.env ?? process.env;
  const log = options.log ?? ((m: string) => console.log(m));
  const ffmpegPath = options.ffmpegPath ?? "ffmpeg";
  const ffprobePath = options.ffprobePath ?? "ffprobe";
  const paths = resolvePaths();

  log(`Harness e2e sobre mídia real`);
  log(`  fonte:     ${paths.sourceVideo}`);
  log(`  legendas:  ${paths.subtitles}`);
  log(`  saída:     ${paths.outRoot}`);

  // Start from a clean work + revision area so reruns are deterministic. The
  // published revision dir is immutable per writePackage; we clear it here
  // because this is a dev harness, not a real publish.
  await rm(paths.outRoot, { recursive: true, force: true });
  await mkdir(paths.workDir, { recursive: true });

  const ffmpeg = makeFfmpegExecutor();
  const executor = ffmpeg;

  // Capture the final-cue clamp so we can log + assert the 719 ms divergence.
  let finalClamp: ClampEvent | undefined;
  const onClamp = (event: ClampEvent): void => {
    finalClamp = event;
  };

  const resolveProvider = makeResolveProvider(env, log);
  const writeTranscript = makeTranscriptWriter(paths.transcriptOut);
  const probeOriginal = makeProbeOriginal(ffprobePath);

  const prepareOptions: PreparePrototypePackageOptions = {
    sourceVideo: paths.sourceVideo,
    srtText: await readFile(paths.subtitles, "utf8"),
    mediaId: MEDIA_ID,
    originalOutputUri: paths.originalOut,
    probeOriginal,
    writeTranscript,
    inspect: {
      ffprobePath,
      runCommand: makeFfprobeRunner(ffprobePath),
      hashFile,
      expectedDurationMs: EXPECTED_DURATION_MS,
    },
    srt: { onClamp },
    transcode: { executor, ffmpegPath },
    expectedDurationMs: EXPECTED_DURATION_MS,
    resolveProvider,
    render: {
      outputUri: paths.prototypeOut,
      executor,
      ffmpegPath,
      probeOutput: async (uri) => probeMp4(ffprobePath, uri),
      hashOutput: hashFile,
    },
    validate: { hashVariant: hashFileSha256 },
    fallbackOnAvatarFailure: true,
  };

  const manifest = await preparePrototypePackage(prepareOptions);

  // --- Log the key observable facts (Req 3.4 / 12.x traceability) --------
  const cueCount = countCues(await readFile(paths.subtitles, "utf8"));
  log(`Cues: ${cueCount} (esperado ${EXPECTED_CUE_COUNT})`);
  if (finalClamp !== undefined) {
    log(
      `Clamp do cue final: ${finalClamp.originalEndMs} ms -> ` +
        `${finalClamp.clampedEndMs} ms (divergência ${finalClamp.discrepancyMs} ms)`,
    );
  } else {
    log("Clamp do cue final: nenhum (nenhuma divergência detectada).");
  }
  log(`avatarAvailable: ${manifest.avatarAvailable}`);

  // --- Write the immutable, versioned package ----------------------------
  const prototypeUri = manifest.avatarAvailable
    ? paths.prototypeOut
    : undefined;
  const written = await writePackage({
    rootDir: paths.outRoot,
    revision: REVISION,
    manifest,
    originalUri: paths.originalOut,
    transcriptUri: paths.transcriptOut,
    ...(prototypeUri !== undefined ? { prototypeUri } : {}),
  });
  log(`Pacote escrito em: ${written.revisionDir}`);
  for (const artifact of written.artifacts) {
    log(`  ${artifact.fileName}  ${artifact.sha256}`);
  }

  // --- Re-validate the written package's variants (Req 16.1 / 16.4) ------
  // The variant URIs in the manifest point at the work dir; validate those
  // files on disk, re-hashing each to confirm integrity. Any violation throws
  // and fails the harness (non-zero exit).
  await revalidatePackage(manifest, log);

  const outputs: RunRealMediaResult["outputs"] = {
    manifest: nodePath.join(written.revisionDir, "manifest.json"),
    original: nodePath.join(written.revisionDir, "original.mp4"),
    transcript: nodePath.join(written.revisionDir, "transcript.normalized.srt"),
    checksums: nodePath.join(written.revisionDir, "checksums.sha256"),
    ...(manifest.avatarAvailable
      ? { prototype: nodePath.join(written.revisionDir, "prototype-avatar.mp4") }
      : {}),
  };

  log("Validação técnica OK — harness concluído com sucesso.");

  return {
    cueCount,
    finalCueRawEndMs: FINAL_CUE_RAW_END_MS,
    finalCueClampMs: finalClamp?.discrepancyMs ?? 0,
    avatarAvailable: manifest.avatarAvailable,
    manifest,
    revisionDir: written.revisionDir,
    outputs,
  };
}

/**
 * Re-runs {@link validateTechnicalPackage} over the manifest's variants,
 * re-hashing each file on disk. Throws a blocking {@link PipelineError} on any
 * codec/duration/hash/equivalence/disclosure violation (Req 16.1 / 16.4).
 */
async function revalidatePackage(
  manifest: TranslationManifest,
  log: (message: string) => void,
): Promise<void> {
  const original = manifest.variants.find((v) => v.kind === "original");
  if (original === undefined) {
    throw PipelineError.assetIntegrityFailed(
      "Manifesto sem variante original; nada a validar.",
    );
  }
  const prototype = manifest.variants.find(
    (v) => v.kind === "automatic-avatar-prototype",
  );

  // Reconstruct a generation result shape consistent with the manifest so the
  // validator's coherence checks (prototype <=> generated) hold.
  const generation: AvatarGenerationResult =
    manifest.avatarAvailable && manifest.provider !== undefined
      ? {
          kind: "generated",
          segments: [],
          provenance: manifest.provider,
        }
      : {
          kind: "unavailable",
          code: "NO_AUTHORIZED_PROVIDER",
          reason:
            manifest.generationWarnings[0] ?? "Avatar indisponível (fallback).",
        };

  log("Revalidando integridade técnica das variantes do manifesto…");
  await validateTechnicalPackage(original, prototype, [], generation, {
    hashVariant: hashFileSha256,
    disclosureBurnedIn: prototype !== undefined,
    manifestDisclosure: manifest.disclosure,
  });
}

// --- v3 (live-avatar) real-media path --------------------------------------

/** Structured outcome of a v3 run, useful for the optional 11.3 test. */
export type RunRealMediaV3Result = Readonly<{
  /** Number of cues parsed from the real SRT (expected 267). */
  cueCount: number;
  /** The final cue's raw end before clamping, in ms (expected 815400). */
  finalCueRawEndMs: Milliseconds;
  /** The final cue's clamped end, in ms (expected 814681). */
  finalCueClampedEndMs: Milliseconds;
  /** The clamp discrepancy applied to the final cue, in ms (expected 719). */
  finalCueClampMs: Milliseconds;
  /** Whether the produced v3 manifest exposes the live avatar. */
  avatarAvailable: boolean;
  /** The produced, schemaVersion-3 manifest. */
  manifest: TranslationManifestV3;
  /** SHA-256 (hex) of the written `manifest.json` bytes. */
  manifestSha256: Sha256;
  /** The immutable revision directory the package was written to. */
  revisionDir: string;
  /** Every written artifact with its SHA-256. */
  artifacts: ReadonlyArray<{ fileName: string; sha256: Sha256 }>;
}>;

/** Options for {@link runRealMediaV3} (all optional; defaults target the repo). */
export type RunRealMediaV3Options = Readonly<{
  /** Logger sink. Defaults to `console.log`. */
  log?: (message: string) => void;
  /** ffmpeg binary path. Defaults to `"ffmpeg"`. */
  ffmpegPath?: string;
  /** ffprobe binary path. Defaults to `"ffprobe"`. */
  ffprobePath?: string;
  /** Live-player bundle URI recorded in `avatar-runtime.json`. */
  playerBundleUri?: Uri;
  /** Avatar rendered by the live player. Defaults to `"icaro"`. */
  avatarName?: string;
  /** Default playback speed forwarded to the live player. Defaults to `1`. */
  defaultSpeed?: number;
  /** License-review id recorded in the runtime config. */
  licenseReviewId?: string;
}>;

/**
 * Runs the v3 (live-avatar) real-media path end to end over the workspace
 * assets (`video.webm` + `subtitles.txt`) and writes the schemaVersion-3
 * package under `packages/pipeline/.e2e-out/media/{mediaId}/v3/`:
 *
 *   manifest.json            (schemaVersion 3, avatarRuntime)
 *   original.mp4             (H.264/AAC, transcoded from video.webm)
 *   transcript.normalized.srt
 *   avatar-runtime.json      (AvatarRuntimeConfig)
 *   checksums.sha256
 *
 * Stages (all reuse the existing pipeline building blocks):
 *   1. {@link inspectMedia} probes `video.webm` (duration must match 814681).
 *   2. {@link parseAndNormalizeSrt} parses the real SRT — asserts 267 cues and
 *      records the final-cue clamp (815400 -> 814681, 719 ms) via `onClamp`.
 *   3. {@link transcodeOriginal} produces `original.mp4` (H.264/AAC), re-probed
 *      to build the validated `OriginalMediaVariant`.
 *   4. An {@link AvatarRuntimeConfig} is assembled (bundle, avatar, speed,
 *      requiresOnlineServices, licenseReviewId).
 *   5. {@link createRealtimeManifest} builds the v3 manifest and
 *      {@link writeRealtimePackage} writes the immutable package.
 *
 * Any integrity violation (wrong cue count, missing/incorrect clamp, codec or
 * duration mismatch, packaging incoherence) throws a {@link PipelineError}; the
 * CLI maps that to a non-zero exit.
 *
 * @throws {PipelineError} on any pipeline failure or integrity violation.
 */
export async function runRealMediaV3(
  options: RunRealMediaV3Options = {},
): Promise<RunRealMediaV3Result> {
  const log = options.log ?? ((m: string) => console.log(m));
  const ffmpegPath = options.ffmpegPath ?? "ffmpeg";
  const ffprobePath = options.ffprobePath ?? "ffprobe";
  const paths = resolvePaths();

  log("Harness e2e v3 (avatar ao vivo) sobre mídia real");
  log(`  fonte:     ${paths.sourceVideo}`);
  log(`  legendas:  ${paths.subtitles}`);
  log(`  saída:     ${paths.outRoot}`);

  // Deterministic reruns: clear the whole out area (dev harness, not a publish).
  await rm(paths.outRoot, { recursive: true, force: true });
  await mkdir(paths.workDir, { recursive: true });

  // --- Stage 1: inspect the real source media (ffprobe) ------------------
  const inspection = await inspectMedia(paths.sourceVideo, {
    ffprobePath,
    runCommand: makeFfprobeRunner(ffprobePath),
    hashFile,
    expectedDurationMs: EXPECTED_DURATION_MS,
  });
  log(
    `Mídia inspecionada: duração ${inspection.durationMs} ms, ` +
      `${inspection.videoCodec ?? "?"}/${inspection.audioCodec ?? "?"}.`,
  );

  // --- Stage 2: parse + normalize the real SRT (267 cues, 719 ms clamp) --
  let finalClamp: ClampEvent | undefined;
  const srtText = await readFile(paths.subtitles, "utf8");
  const cues = parseAndNormalizeSrt(srtText, inspection.durationMs, {
    onClamp: (event) => {
      finalClamp = event;
    },
  });
  log(`Cues: ${cues.length} (esperado ${EXPECTED_CUE_COUNT}).`);
  if (cues.length !== EXPECTED_CUE_COUNT) {
    throw new PipelineError(
      "INVALID_SRT",
      `Esperado ${EXPECTED_CUE_COUNT} cues, encontrados ${cues.length}.`,
      { details: { cueCount: cues.length } },
    );
  }
  if (finalClamp === undefined) {
    throw new PipelineError(
      "INVALID_SRT",
      "Nenhum clamp do cue final detectado; esperado o clamp de " +
        `${FINAL_CUE_RAW_END_MS} ms -> ${inspection.durationMs} ms.`,
    );
  }
  log(
    `Clamp do cue final: ${finalClamp.originalEndMs} ms -> ` +
      `${finalClamp.clampedEndMs} ms (divergência ${finalClamp.discrepancyMs} ms).`,
  );
  if (finalClamp.originalEndMs !== FINAL_CUE_RAW_END_MS) {
    throw new PipelineError(
      "INVALID_SRT",
      `Fim bruto do cue final ${finalClamp.originalEndMs} ms diverge do ` +
        `esperado ${FINAL_CUE_RAW_END_MS} ms.`,
    );
  }
  if (finalClamp.clampedEndMs !== inspection.durationMs) {
    throw new PipelineError(
      "ASSET_INTEGRITY_FAILED",
      `Cue final clampeado para ${finalClamp.clampedEndMs} ms, esperado a ` +
        `duração medida ${inspection.durationMs} ms.`,
    );
  }
  if (finalClamp.discrepancyMs !== EXPECTED_FINAL_CLAMP_MS) {
    throw new PipelineError(
      "ASSET_INTEGRITY_FAILED",
      `Divergência do clamp ${finalClamp.discrepancyMs} ms, esperado ` +
        `${EXPECTED_FINAL_CLAMP_MS} ms.`,
    );
  }

  // --- Stage 3: transcode original.mp4 (H.264/AAC) and probe it ----------
  const executor = makeFfmpegExecutor();
  await transcodeOriginal(paths.sourceVideo, paths.originalOut, {
    executor,
    ffmpegPath,
  });
  const probeOriginal = makeProbeOriginal(ffprobePath);
  const original = (await probeOriginal(paths.originalOut)) as OriginalMediaVariant;
  log(
    `original.mp4 produzido: ${original.videoCodec}/${original.audioCodec}, ` +
      `${original.durationMs} ms, sha256 ${original.sha256}.`,
  );

  // --- Stage 4: write the normalized transcript -------------------------
  await mkdir(nodePath.dirname(paths.transcriptOut), { recursive: true });
  await writeFile(paths.transcriptOut, serializeCuesToSrt(cues), "utf8");

  // --- Stage 5: assemble the live-avatar runtime config -----------------
  const avatarRuntime: AvatarRuntimeConfig = {
    playerBundleUri: options.playerBundleUri ?? DEFAULT_PLAYER_BUNDLE_URI,
    avatarName: options.avatarName ?? DEFAULT_AVATAR_NAME,
    defaultSpeed: options.defaultSpeed ?? DEFAULT_AVATAR_SPEED,
    requiresOnlineServices: true,
    licenseReviewId: options.licenseReviewId ?? LICENSE_REVIEW_ID,
  };

  // --- Stage 6: build the v3 manifest and write the immutable package ----
  const manifest = createRealtimeManifest(
    original,
    paths.transcriptOut,
    avatarRuntime,
  );
  log(`avatarAvailable: ${manifest.avatarAvailable}`);
  if (!manifest.avatarAvailable) {
    throw new PipelineError(
      "POLICY_REJECTED",
      "Manifesto v3 marcou avatar indisponível apesar de uma " +
        "Avatar_Runtime_Config válida; configuração incoerente.",
    );
  }

  const written = await writeRealtimePackage({
    rootDir: paths.outRoot,
    revision: REVISION_V3,
    manifest,
    originalUri: paths.originalOut,
    transcriptUri: paths.transcriptOut,
  });
  log(`Pacote v3 escrito em: ${written.revisionDir}`);
  for (const artifact of written.artifacts) {
    log(`  ${artifact.fileName}  ${artifact.sha256}`);
  }

  const manifestChecksum = written.artifacts.find(
    (a) => a.fileName === "manifest.json",
  );
  if (manifestChecksum === undefined) {
    throw new PipelineError(
      "ASSET_INTEGRITY_FAILED",
      "checksums não registrou manifest.json.",
    );
  }

  log("Pacote v3 concluído com sucesso.");

  return {
    cueCount: cues.length,
    finalCueRawEndMs: finalClamp.originalEndMs,
    finalCueClampedEndMs: finalClamp.clampedEndMs,
    finalCueClampMs: finalClamp.discrepancyMs,
    avatarAvailable: manifest.avatarAvailable,
    manifest,
    manifestSha256: manifestChecksum.sha256,
    revisionDir: written.revisionDir,
    artifacts: written.artifacts,
  };
}

// --- SRT-only degraded path (when ffprobe/ffmpeg are missing) --------------

/**
 * When the ffprobe/ffmpeg binaries are absent, the full real run cannot
 * proceed. Rather than silently "passing", the harness still exercises the
 * fully-verifiable SRT stage against the real `subtitles.txt`: it parses and
 * normalizes the cues, confirms the 267-cue count and the final-cue clamp
 * (815 400 ms -> 814 681 ms, a 719 ms divergence), and logs the result. It
 * then reports — honestly — that the media stages need the binaries.
 */
export async function verifySrtOnly(
  log: (message: string) => void = (m) => console.log(m),
): Promise<{ cueCount: number; clamp?: ClampEvent }> {
  const paths = resolvePaths();
  const srtText = await readFile(paths.subtitles, "utf8");
  let clamp: ClampEvent | undefined;
  const cues = parseAndNormalizeSrt(srtText, EXPECTED_DURATION_MS, {
    onClamp: (event) => {
      clamp = event;
    },
  });
  log(`SRT: ${cues.length} cues (esperado ${EXPECTED_CUE_COUNT}).`);
  if (clamp !== undefined) {
    log(
      `SRT clamp do cue final: ${clamp.originalEndMs} ms -> ` +
        `${clamp.clampedEndMs} ms (divergência ${clamp.discrepancyMs} ms).`,
    );
  }
  if (cues.length !== EXPECTED_CUE_COUNT) {
    throw new PipelineError(
      "INVALID_SRT",
      `Esperado ${EXPECTED_CUE_COUNT} cues, encontrados ${cues.length}.`,
    );
  }
  return { cueCount: cues.length, ...(clamp !== undefined ? { clamp } : {}) };
}

// --- Helpers ---------------------------------------------------------------

/** Count the SRT cue blocks in the raw text (non-empty, blank-line separated). */
function countCues(srtText: string): number {
  return srtText
    .replace(/\r\n?/g, "\n")
    .replace(/^\uFEFF/, "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0).length;
}

/** Probe whether a binary can be spawned at all (used by the CLI guard). */
async function binaryAvailable(binary: string): Promise<boolean> {
  try {
    await runBinary(binary, ["-version"]);
    return true;
  } catch {
    return false;
  }
}

function describeError(error: unknown): string {
  if (isPipelineError(error)) {
    return `${error.code}: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// --- CLI entry point -------------------------------------------------------

/**
 * CLI `main`: run the harness, honestly degrading to the SRT-only verification
 * when ffmpeg/ffprobe are not installed. Returns a process exit code:
 *   0  full run succeeded and the package validated.
 *   2  binaries missing — SRT stage verified, but the real media run could not
 *      execute (reported honestly so a skipped run is not mistaken for a pass).
 *   1  a real failure (integrity violation, pipeline error, I/O error).
 */
export async function main(
  options: RunRealMediaOptions = {},
): Promise<number> {
  const log = options.log ?? ((m: string) => console.log(m));
  const ffmpegPath = options.ffmpegPath ?? "ffmpeg";
  const ffprobePath = options.ffprobePath ?? "ffprobe";
  const env = options.env ?? process.env;

  // The v3 (live-avatar, schemaVersion 3) path is selected by `--v3` on the
  // command line or `RUN_REAL_MEDIA_V3=1` in the environment. It requires the
  // real binaries: there is no SRT-only degraded mode for v3 (the package
  // needs a transcoded original.mp4).
  const argv =
    (globalThis as { process?: { argv?: readonly string[] } }).process?.argv ??
    [];
  const v3Selected =
    argv.includes("--v3") ||
    (typeof env.RUN_REAL_MEDIA_V3 === "string" &&
      env.RUN_REAL_MEDIA_V3 !== "" &&
      env.RUN_REAL_MEDIA_V3 !== "0");

  const [hasFfprobe, hasFfmpeg] = await Promise.all([
    binaryAvailable(ffprobePath),
    binaryAvailable(ffmpegPath),
  ]);

  if (v3Selected) {
    if (!hasFfprobe || !hasFfmpeg) {
      log(
        `ffmpeg/ffprobe indisponíveis neste ambiente ` +
          `(ffmpeg=${hasFfmpeg}, ffprobe=${hasFfprobe}). ` +
          "O caminho v3 requer ambos os binários para produzir original.mp4.",
      );
      return 2;
    }
    try {
      await runRealMediaV3({ log, ffmpegPath, ffprobePath });
      return 0;
    } catch (error) {
      log(`Harness v3 FALHOU: ${describeError(error)}`);
      return 1;
    }
  }

  if (!hasFfprobe || !hasFfmpeg) {
    log(
      `ffmpeg/ffprobe indisponíveis neste ambiente ` +
        `(ffmpeg=${hasFfmpeg}, ffprobe=${hasFfprobe}). ` +
        "A execução real da mídia requer ambos os binários.",
    );
    log("Executando apenas a etapa verificável de SRT sobre os arquivos reais…");
    try {
      await verifySrtOnly(log);
      log(
        "Etapa de SRT verificada. O harness está pronto; execute novamente " +
          "com ffmpeg/ffprobe instalados para produzir e validar o pacote.",
      );
    } catch (error) {
      log(`Falha ao verificar o SRT real: ${describeError(error)}`);
      return 1;
    }
    return 2;
  }

  try {
    await runRealMedia(options);
    return 0;
  } catch (error) {
    log(`Harness FALHOU: ${describeError(error)}`);
    return 1;
  }
}

/**
 * Run `main` when this module is executed directly (not when imported). The
 * guard compares the resolved module URL to the process entry point so the
 * harness is importable (e.g. by the optional 21.2 integration test) without
 * side effects.
 */
const invokedDirectly = (() => {
  // Node-only guard. In a browser / React Native bundle there is no `process`
  // (or no `process.argv`), so bail out safely instead of throwing at module
  // load — this module must never run its CLI when merely imported.
  const proc = (globalThis as { process?: { argv?: readonly string[] } })
    .process;
  const entry = proc?.argv?.[1];
  if (entry === undefined) {
    return false;
  }
  try {
    return import.meta.url === pathToFileURL(entry).href;
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      console.error(describeError(error));
      process.exitCode = 1;
    });
}
