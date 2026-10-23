/**
 * Shared transient-only retry policy for build-time CMS requests (JSON API and
 * image downloads): network errors/timeouts, 429 and 5xx are retried; every
 * other status (404, 401, 403, ...) is final.
 */
export class HttpStatusError extends Error {
  readonly status: number;
  /** Server-requested wait (Retry-After seconds), already capped. */
  readonly retryAfterMs?: number;
  constructor(status: number, message: string, retryAfterMs?: number) {
    super(message);
    this.name = "HttpStatusError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export const DEFAULT_RETRY_DELAYS_MS = [1_000, 3_000]; // 3 attempts total
export const MAX_RETRY_AFTER_MS = 10_000;

// Overridable (comma-separated ms) so tests do not wait on real backoff.
export function getRetryDelays(): number[] {
  const raw = process.env.CMS_FETCH_RETRY_DELAYS_MS;
  if (!raw) return DEFAULT_RETRY_DELAYS_MS;
  return raw.split(",").map((n) => Math.max(0, Number(n) || 0));
}

export function isTransient(error: unknown): boolean {
  if (error instanceof HttpStatusError) {
    return error.status === 429 || error.status >= 500;
  }
  return true;
}

/** Parse a Retry-After header given in seconds; capped, null if absent/invalid. */
export function parseRetryAfterMs(value: string | null | undefined): number | null {
  if (!value || !/^\s*\d+(\.\d+)?\s*$/.test(value)) return null;
  return Math.min(Math.round(Number(value) * 1000), MAX_RETRY_AFTER_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FetchRetryOptions {
  timeoutMs: number;
  fetch?: typeof fetch;
  /** Describes a non-OK response; defaults to "HTTP <status>". */
  describe?: (res: Response) => string;
  /** Build the error for a non-OK response (must be an HttpStatusError). */
  makeError?: (status: number, message: string, retryAfterMs?: number) => HttpStatusError;
  /**
   * Consume a successful response inside the retry loop; any failure while
   * reading is treated as transient. When omitted the raw Response is returned
   * and the caller consumes it (its errors are never retried).
   */
  read?: (res: Response) => Promise<unknown>;
}

/**
 * fetch() with up to 3 attempts. Each attempt gets its own timeout signal and
 * the caller's init (e.g. redirect: "error"). Unconsumed bodies of failed
 * responses are cancelled before retrying or throwing.
 */
export async function fetchWithRetry<T = Response>(
  url: string,
  init: RequestInit,
  { timeoutMs, fetch: fetchImpl = fetch, describe, makeError, read }: FetchRetryOptions
): Promise<T> {
  const delays = getRetryDelays();
  const maxAttempts = delays.length + 1;
  for (let attempt = 1; ; attempt += 1) {
    let retryAfterMs: number | undefined;
    try {
      const res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) {
        await res.body?.cancel().catch(() => {});
        const wait = res.status === 429 ? parseRetryAfterMs(res.headers.get("retry-after")) : null;
        const message = describe ? describe(res) : `HTTP ${res.status}`;
        const build = makeError ?? ((s, m, r) => new HttpStatusError(s, m, r));
        throw build(res.status, message, wait ?? undefined);
      }
      return (read ? await read(res) : res) as T;
    } catch (error) {
      if (attempt >= maxAttempts || !isTransient(error)) throw error;
      retryAfterMs = error instanceof HttpStatusError ? error.retryAfterMs : undefined;
      await sleep(retryAfterMs ?? delays[attempt - 1]);
    }
  }
}
