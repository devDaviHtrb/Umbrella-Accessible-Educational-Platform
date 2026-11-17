// Media inspection via ffprobe.
//
// `inspectMedia` validates the input media (MIME, codecs, dimensions and
// duration), records the measured duration in milliseconds and the SHA-256
// hash of the input, and fails with a blocking `DURATION_MISMATCH` error when
// the measured duration diverges from the expected value beyond the
// configured tolerance.
//
// Testability: the ffprobe invocation and the hashing are injected through
// `options.runCommand` and `options.hashFile`. Defaults shell out to the
// `ffprobe` binary and stream the file through Node's crypto, but tests can
// supply fakes so they never depend on the binary being installed. The build
// never requires ffprobe either — it is only touched at call time.
//
// _Requirements: 4.1, 4.2, 4.3, 4.4_

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { execFile } from "node:child_process";

import type { Milliseconds, Sha256, Uri } from "../domain/types.js";
import { PipelineError } from "../domain/PipelineError.js";

// --- Public contract ------------------------------------------------------

/** Measured, validated metadata about an inspected media file. */
export type MediaInspection = Readonly<{
  /** Measured container/stream duration in milliseconds. */
  durationMs: Milliseconds;
  /** Detected video codec (e.g. "av1", "h264"), or `undefined` if none. */
  videoCodec?: string;
  /** Detected audio codec (e.g. "opus", "aac"), or `undefined` if none. */
  audioCodec?: string;
  /** Video width in pixels, when a video stream is present. */
  width?: number;
  /** Video height in pixels, when a video stream is present. */
  height?: number;
  /** Container MIME type derived from the probed format. */
  mimeType: string;
  /** SHA-256 hash of the raw input bytes. */
  sha256: Sha256;
  /** Whether the file carries at least one audio stream. */
  hasAudio: boolean;
}>;

/**
 * Executes a command and resolves with its stdout. Injected to keep
 * `inspectMedia` testable without the ffprobe binary.
 */
export type CommandRunner = (
  command: string,
  args: readonly string[],
) => Promise<string>;

/** Computes the SHA-256 (hex) of a file at `uri`. Injected for testing. */
export type FileHasher = (uri: Uri) => Promise<Sha256>;

export type InspectMediaOptions = Readonly<{
  /** Expected media duration in ms. Defaults to the real asset: 814681 ms. */
  expectedDurationMs?: Milliseconds;
  /**
   * Allowed absolute divergence from `expectedDurationMs`, in ms, before a
   * blocking `DURATION_MISMATCH` is raised. Defaults to 0 (exact match).
   */
  durationToleranceMs?: Milliseconds;
  /** Path/name of the ffprobe binary. Defaults to "ffprobe". */
  ffprobePath?: string;
  /** Command executor. Defaults to running the real ffprobe binary. */
  runCommand?: CommandRunner;
  /** File hasher. Defaults to streaming SHA-256 over the file. */
  hashFile?: FileHasher;
}>;

/** Default expected duration for the prototype asset (`video.webm`). */
export const EXPECTED_DURATION_MS = 814_681;

/** Default divergence tolerance: exact match. */
export const DEFAULT_DURATION_TOLERANCE_MS = 0;

// --- Implementation -------------------------------------------------------

/**
 * Inspects `uri` with ffprobe, validating MIME, codecs, dimensions and
 * duration. Records the measured duration (ms) and the input SHA-256.
 *
 * @throws {PipelineError} with code `DURATION_MISMATCH` when the measured
 *   duration diverges from the expected value beyond the tolerance.
 */
export async function inspectMedia(
  uri: Uri,
  options: InspectMediaOptions = {},
): Promise<MediaInspection> {
  const expectedDurationMs = options.expectedDurationMs ?? EXPECTED_DURATION_MS;
  const durationToleranceMs =
    options.durationToleranceMs ?? DEFAULT_DURATION_TOLERANCE_MS;
  const ffprobePath = options.ffprobePath ?? "ffprobe";
  const runCommand = options.runCommand ?? defaultRunCommand;
  const hashFile = options.hashFile ?? defaultHashFile;

  const probeJson = await runCommand(ffprobePath, buildFfprobeArgs(uri));
  const probe = parseFfprobeOutput(probeJson, uri);

  const sha256 = await hashFile(uri);
  const inspection = toInspection(probe, sha256);

  const divergence = Math.abs(inspection.durationMs - expectedDurationMs);
  if (divergence > durationToleranceMs) {
    throw PipelineError.durationMismatch(
      `Duração medida (${inspection.durationMs} ms) diverge da esperada ` +
        `(${expectedDurationMs} ms) em ${divergence} ms, além da tolerância ` +
        `de ${durationToleranceMs} ms.`,
      {
        details: {
          uri,
          measuredDurationMs: inspection.durationMs,
          expectedDurationMs,
          divergenceMs: divergence,
          durationToleranceMs,
        },
      },
    );
  }

  return inspection;
}

// --- ffprobe plumbing -----------------------------------------------------

/** Builds the ffprobe argument list for a JSON probe of format + streams. */
export function buildFfprobeArgs(uri: Uri): readonly string[] {
  return [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    uri,
  ];
}

// Minimal shape of the ffprobe JSON we consume.
type FfprobeStream = Readonly<{
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  duration?: string;
}>;

type FfprobeFormat = Readonly<{
  duration?: string;
  format_name?: string;
}>;

type FfprobeOutput = Readonly<{
  streams?: readonly FfprobeStream[];
  format?: FfprobeFormat;
}>;

/** Parses ffprobe stdout, raising `ASSET_INTEGRITY_FAILED` on bad JSON. */
export function parseFfprobeOutput(json: string, uri: Uri): FfprobeOutput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (cause) {
    throw PipelineError.assetIntegrityFailed(
      `Saída do ffprobe não é JSON válido para ${uri}.`,
      { cause, details: { uri } },
    );
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw PipelineError.assetIntegrityFailed(
      `Saída do ffprobe inesperada para ${uri}.`,
      { details: { uri } },
    );
  }
  return parsed as FfprobeOutput;
}

/** Converts probed data + hash into the validated `MediaInspection` shape. */
function toInspection(probe: FfprobeOutput, sha256: Sha256): MediaInspection {
  const streams = probe.streams ?? [];
  const videoStream = streams.find((s) => s.codec_type === "video");
  const audioStream = streams.find((s) => s.codec_type === "audio");

  const durationSeconds = firstNumeric(
    probe.format?.duration,
    videoStream?.duration,
    audioStream?.duration,
  );
  if (durationSeconds === undefined) {
    throw PipelineError.assetIntegrityFailed(
      "Nenhuma duração reportada pelo ffprobe.",
    );
  }

  const inspection: {
    durationMs: Milliseconds;
    videoCodec?: string;
    audioCodec?: string;
    width?: number;
    height?: number;
    mimeType: string;
    sha256: Sha256;
    hasAudio: boolean;
  } = {
    durationMs: Math.round(durationSeconds * 1000),
    mimeType: mimeTypeFromFormat(probe.format?.format_name),
    sha256,
    hasAudio: audioStream !== undefined,
  };

  if (videoStream?.codec_name !== undefined) {
    inspection.videoCodec = videoStream.codec_name;
  }
  if (audioStream?.codec_name !== undefined) {
    inspection.audioCodec = audioStream.codec_name;
  }
  if (typeof videoStream?.width === "number") {
    inspection.width = videoStream.width;
  }
  if (typeof videoStream?.height === "number") {
    inspection.height = videoStream.height;
  }

  return inspection;
}

/** Returns the first argument that parses to a finite number (seconds). */
function firstNumeric(
  ...values: readonly (string | number | undefined)[]
): number | undefined {
  for (const value of values) {
    if (value === undefined) {
      continue;
    }
    const n = typeof value === "number" ? value : Number.parseFloat(value);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return undefined;
}

/**
 * Maps an ffprobe `format_name` (a comma-separated list) to a container MIME
 * type. Falls back to `application/octet-stream` for unknown formats.
 */
export function mimeTypeFromFormat(formatName: string | undefined): string {
  if (formatName === undefined) {
    return "application/octet-stream";
  }
  const names = formatName.split(",").map((n) => n.trim());
  for (const name of names) {
    const mime = FORMAT_TO_MIME[name];
    if (mime !== undefined) {
      return mime;
    }
  }
  return "application/octet-stream";
}

const FORMAT_TO_MIME: Readonly<Record<string, string>> = {
  matroska: "video/x-matroska",
  webm: "video/webm",
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
};

// --- Default (real) implementations ---------------------------------------

/** Default command runner: executes a binary and returns its stdout. */
const defaultRunCommand: CommandRunner = (command, args) =>
  new Promise<string>((resolve, reject) => {
    execFile(
      command,
      [...args],
      { maxBuffer: 16 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            PipelineError.assetIntegrityFailed(
              `Falha ao executar ${command}: ${stderr || error.message}`,
              { cause: error, details: { command } },
            ),
          );
          return;
        }
        resolve(stdout);
      },
    );
  });

/** Default file hasher: streams the file through SHA-256. */
const defaultHashFile: FileHasher = (uri) =>
  new Promise<Sha256>((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(uri);
    stream.on("error", (cause) =>
      reject(
        PipelineError.assetIntegrityFailed(`Falha ao ler ${uri} para hash.`, {
          cause,
          details: { uri },
        }),
      ),
    );
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
