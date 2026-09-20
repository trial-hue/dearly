import { describe, expect, it } from 'vitest';

import { rateLimit, resetRateLimits } from '../rateLimit';

describe('G7 rate limiter', () => {
  it('allows the configured number per minute, then refuses with a retry time, and resets after the window', () => {
    resetRateLimits();
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) expect(rateLimit('ai:x', 5, t0 + i).ok).toBe(true);
    const refused = rateLimit('ai:x', 5, t0 + 10);
    expect(refused.ok).toBe(false);
    expect(refused.retryAfterSec).toBeGreaterThan(0);
    expect(refused.retryAfterSec).toBeLessThanOrEqual(60);
    expect(rateLimit('ai:y', 5, t0 + 10).ok).toBe(true); // another session is unaffected
    expect(rateLimit('ai:x', 5, t0 + 60_001).ok).toBe(true);
  });
});
