// Minimal injectable HTTP client for the VLibras self-hosted provider.
//
// The provider never reaches for a global `fetch` directly: the transport
// is injected so tests can run without a network and so every call stays
// auditable. The surface is intentionally a small subset of the WHATWG
// `fetch` contract — just what the adapter needs.

/** Response shape the provider relies on (a subset of `fetch`'s Response). */
export interface HttpResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly headers: {
    get(name: string): string | null;
  };
  json(): Promise<unknown>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

/** Request options the provider sends (a subset of `fetch`'s RequestInit). */
export interface HttpRequest {
  readonly method: "GET" | "POST";
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: string;
  /** Abort signal so callers can enforce timeouts. */
  readonly signal?: AbortSignal;
}

/**
 * Injectable transport. In production this is a thin wrapper over the
 * platform `fetch`; in tests it is a stub that returns recorded fixtures.
 */
export type HttpClient = (
  url: string,
  request: HttpRequest,
) => Promise<HttpResponse>;

/** Default transport backed by the global `fetch`, when one is available. */
export function defaultHttpClient(): HttpClient {
  const globalFetch = (globalThis as { fetch?: typeof fetch }).fetch?.bind(
    globalThis,
  );

  if (!globalFetch) {
    throw new Error(
      "No global fetch is available; inject an HttpClient explicitly.",
    );
  }

  return async (url, request) => {
    const init: RequestInit = {
      method: request.method,
      headers: request.headers,
    };
    if (request.body !== undefined) {
      init.body = request.body;
    }
    if (request.signal !== undefined) {
      init.signal = request.signal;
    }
    const response = await globalFetch(url, init);
    return response as unknown as HttpResponse;
  };
}
