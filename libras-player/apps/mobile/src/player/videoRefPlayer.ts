// Adapter: react-native-video `VideoRef` -> controller `NativeMediaPlayer`.
//
// Task 20.2 — the `LibrasPlayerController` (task 20.1) drives a single native
// player through the library-agnostic `NativeMediaPlayer` interface. This
// module adapts a react-native-video `<Video>` instance (reached through its
// imperative `VideoRef`) to that interface so the component can reuse the
// controller's variant-switching logic unchanged.
//
// It deliberately contains NO JSX and no React: it is pure glue around a
// mutable ref plus the position the `<Video>` reports through its events. The
// component feeds progress/seek/load events in via `reportPosition`, keeping
// `getPosition()` synchronous as the controller requires (the library's own
// `getCurrentPosition()` is async and therefore unsuitable here).
//
// No WebView, no browser automation and no generation API are involved — this
// only commands an already-loaded native MP4 source (Requirements 15.4, 15.5).

import type { Milliseconds } from "@libras/pipeline/client";
import type { ReactVideoSource, VideoRef } from "react-native-video";

import type { NativeMediaPlayer } from "./controller";

/** Convert seconds (react-native-video unit) to whole milliseconds. */
export function secondsToMs(seconds: number): Milliseconds {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return 0;
  }
  return Math.round(seconds * 1000);
}

/** Convert milliseconds to seconds (react-native-video `seek` unit). */
export function msToSeconds(ms: Milliseconds): number {
  if (!Number.isFinite(ms) || ms < 0) {
    return 0;
  }
  return ms / 1000;
}

/**
 * A {@link NativeMediaPlayer} backed by a react-native-video `VideoRef`.
 *
 * The component is responsible for:
 *  - rendering the `<Video>` with {@link currentSourceUri} and keeping the
 *    `ref` pointed at this adapter's {@link attach} target, and
 *  - forwarding `onProgress`, `onSeek` and `onLoad` positions through
 *    {@link reportPosition} so {@link getPosition} stays synchronous.
 *
 * `setSource` records the requested URI and resolves on the next `onLoad`
 * reported for that URI (or immediately if the ref is not attached yet, e.g.
 * before first mount), so the controller's `load`/`switchVariant` await the
 * source actually being ready.
 */
export class VideoRefNativeMediaPlayer implements NativeMediaPlayer {
  #ref: VideoRef | null = null;
  #currentUri: string | undefined;
  #positionMs: Milliseconds = 0;
  #pendingLoad: { uri: string; resolve: () => void } | undefined;
  #onSourceChange: ((uri: string | undefined) => void) | undefined;

  /**
   * @param onSourceChange Optional callback invoked whenever the desired source
   *   URI changes, so the component can re-render the `<Video>` with the new
   *   `source`. Not required for the adapter's own correctness.
   */
  public constructor(onSourceChange?: (uri: string | undefined) => void) {
    this.#onSourceChange = onSourceChange;
  }

  /** The URI the `<Video>` should currently render, or `undefined`. */
  public get currentSourceUri(): string | undefined {
    return this.#currentUri;
  }

  /** The `source` prop value for the `<Video>`, derived from the URI. */
  public get currentSource(): ReactVideoSource | undefined {
    return this.#currentUri === undefined
      ? undefined
      : { uri: this.#currentUri };
  }

  /** Point the adapter at the live `VideoRef` (or `null` on unmount). */
  public attach(ref: VideoRef | null): void {
    this.#ref = ref;
  }

  /**
   * Feed a position (in ms) reported by the `<Video>` via its `onProgress`,
   * `onSeek` or `onLoad` events. When a `setSource` for {@link uri} is pending
   * and this report carries the matching source URI, the pending load resolves.
   */
  public reportPosition(positionMs: Milliseconds, uri?: string): void {
    if (Number.isFinite(positionMs) && positionMs >= 0) {
      this.#positionMs = positionMs;
    }
    const pending = this.#pendingLoad;
    if (pending !== undefined && (uri === undefined || uri === pending.uri)) {
      this.#pendingLoad = undefined;
      pending.resolve();
    }
  }

  /** Resolve a pending `setSource` after the `<Video>` reports `onLoad`. */
  public reportLoaded(uri?: string): void {
    const pending = this.#pendingLoad;
    if (pending === undefined) {
      return;
    }
    if (uri === undefined || uri === pending.uri) {
      this.#positionMs = 0;
      this.#pendingLoad = undefined;
      pending.resolve();
    }
  }

  public async setSource(uri: string): Promise<void> {
    if (uri === this.#currentUri) {
      return;
    }
    this.#currentUri = uri;
    this.#positionMs = 0;
    this.#onSourceChange?.(uri);

    // If the ref is not attached yet (e.g. first load before mount), resolve
    // immediately — the component will render the source and the controller's
    // subsequent seek/play are applied once the ref attaches.
    if (this.#ref === null) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.#pendingLoad = { uri, resolve };
    });
  }

  public async play(): Promise<void> {
    this.#ref?.resume();
  }

  public async pause(): Promise<void> {
    this.#ref?.pause();
  }

  public async seek(positionMs: Milliseconds): Promise<void> {
    this.#positionMs = clampNonNegative(positionMs);
    this.#ref?.seek(msToSeconds(this.#positionMs));
  }

  public getPosition(): Milliseconds {
    return this.#positionMs;
  }

  public async release(): Promise<void> {
    this.#ref = null;
    this.#currentUri = undefined;
    this.#positionMs = 0;
    this.#pendingLoad = undefined;
  }
}

function clampNonNegative(value: Milliseconds): Milliseconds {
  return Number.isFinite(value) && value > 0 ? value : 0;
}
