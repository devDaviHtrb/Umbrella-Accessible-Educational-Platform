// Avatar runtime fallback — degrade to video + audio + SRT captions.
//
// Task 6.2 — implements `handleAvatarRuntimeFailure` (pure) from design.md:
// when the WebView hosting `vlibras-player-webjs` emits an `error`, the live
// avatar becomes unavailable but the native video player (the master clock)
// keeps playing. The app drops the avatar and shows SRT captions instead,
// without depending on the avatar or the VLibras online services during
// playback.
//
// It underpins Requirements:
//   7.4   A player web `error` is treated as avatar unavailability, never as
//         a video interruption.
//   8.4   WebView / online-service failure degrades to video + captions.
//   8.5   The avatar error does not stop or reposition the native video.
//   13.2  The fallback keeps a playable experience from `original.mp4` + SRT.
//   13.4  The fallback does not depend on the avatar nor on VLibras online
//         services at playback time.
//
// Design reference — the `handleAvatarRuntimeFailure` formal specification:
//   function handleAvatarRuntimeFailure(
//     snapshot: PlaybackSnapshot,
//     error: WebToAppMessage & { type: "error" },
//   ): PlaybackSnapshot;
//   Postconditions: video and audio keep playing without interruption;
//   `automaticAvatarAvailable` becomes false and SRT captions are shown; the
//   fallback does not depend on the avatar nor on the online services.
//
// This module is pure: it derives a new snapshot from the inbound one and the
// error message. It never throws and never mutates its inputs.

import type {
  PlaybackSnapshot,
  WebToAppMessage,
} from "@libras/pipeline/client";

/** The `error` variant of {@link WebToAppMessage}. */
export type AvatarRuntimeErrorMessage = WebToAppMessage & { type: "error" };

/**
 * Derives a new {@link PlaybackSnapshot} after the live avatar runtime fails.
 *
 * Pure function: it reads `snapshot` and `error` and returns a fresh snapshot
 * without mutating either input. It never throws.
 *
 * The returned snapshot:
 * - marks the avatar as both disabled and unavailable
 *   (`automaticAvatarEnabled = false`, `automaticAvatarAvailable = false`)
 *   and sets `avatarRuntimeState = "error"`, so the UI stops relying on the
 *   avatar and surfaces SRT captions (Requirements 7.4, 8.4, 13.4);
 * - preserves every playback field — `mediaId`, `positionMs`, `durationMs`,
 *   `isPlaying`, `isBuffering` and `activeCueId` — so the native video and its
 *   audio keep playing uninterrupted at the same position (Requirements 8.5,
 *   13.2).
 *
 * The `error` argument carries the player-web failure details; it is accepted
 * to pin the contract (a WebView `error` event drives this transition) and to
 * keep the signature aligned with design.md, even though the resulting state
 * is the same for any avatar error.
 */
export function handleAvatarRuntimeFailure(
  snapshot: PlaybackSnapshot,
  error: AvatarRuntimeErrorMessage,
): PlaybackSnapshot {
  // `error` is intentionally not inspected: any avatar runtime error maps to
  // the same unavailable state. Referencing it keeps lint happy and documents
  // that the transition is driven by the WebView `error` event.
  void error;

  return {
    // --- Preserved playback state (native video keeps playing) ----------
    mediaId: snapshot.mediaId,
    positionMs: snapshot.positionMs,
    durationMs: snapshot.durationMs,
    isPlaying: snapshot.isPlaying,
    isBuffering: snapshot.isBuffering,
    activeCueId: snapshot.activeCueId ?? null,
    // --- Avatar dropped, captions take over -----------------------------
    automaticAvatarEnabled: false,
    automaticAvatarAvailable: false,
    avatarRuntimeState: "error",
  };
}

/**
 * Decides whether the SRT captions should be shown for a given snapshot.
 *
 * Pure helper. Captions are the fallback surface whenever the live avatar is
 * not carrying the translation — that is, when the avatar is unavailable, not
 * enabled, or in its `error` runtime state. This keeps captions visible in the
 * fallback produced by {@link handleAvatarRuntimeFailure} without depending on
 * the avatar or the online services at playback time (Requirements 8.4, 13.2,
 * 13.4).
 */
export function shouldShowCaptions(snapshot: PlaybackSnapshot): boolean {
  return (
    !snapshot.automaticAvatarAvailable ||
    !snapshot.automaticAvatarEnabled ||
    snapshot.avatarRuntimeState === "error"
  );
}
