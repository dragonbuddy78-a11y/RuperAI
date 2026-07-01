interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60_000;
const DEFAULT_WINDOW_MS = 60_000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  lastCleanup = now;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = DEFAULT_WINDOW_MS,
): RateLimitResult {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });

    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetAt,
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export function createRateLimitKey(
  prefix: string,
  identifier: string,
): string {
  return `${prefix}:${identifier}`;
}

export const AI_RATE_LIMIT = {
  requests: 20,
  windowMs: 60_000,
} as const;

export const AUTH_RATE_LIMIT = {
  requests: 10,
  windowMs: 15 * 60_000,
} as const;

export function checkAiRateLimit(userId: string): RateLimitResult {
  return rateLimit(
    createRateLimitKey("ai", userId),
    AI_RATE_LIMIT.requests,
    AI_RATE_LIMIT.windowMs,
  );
}

export function checkAuthRateLimit(identifier: string): RateLimitResult {
  return rateLimit(
    createRateLimitKey("auth", identifier),
    AUTH_RATE_LIMIT.requests,
    AUTH_RATE_LIMIT.windowMs,
  );
}