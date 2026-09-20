/** In-memory fixed-window limiter, keyed by session. Enough for a single-process pilot. */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limitPerMinute: number,
  nowMs = Date.now(),
): { ok: boolean; retryAfterSec: number } {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= nowMs) {
    buckets.set(key, { count: 1, resetAt: nowMs + 60_000 });
    return { ok: true, retryAfterSec: 0 };
  }
  if (bucket.count >= limitPerMinute) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - nowMs) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function resetRateLimits(): void {
  buckets.clear();
}
