type Bucket = { tokens: number; lastRefillMs: number };

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitBuckets: Map<string, Bucket> | undefined;
}

function getBuckets() {
  if (!globalThis.__rateLimitBuckets) globalThis.__rateLimitBuckets = new Map();
  return globalThis.__rateLimitBuckets;
}

export function rateLimitOrThrow(opts: {
  key: string;
  capacity: number;
  refillPerSecond: number;
  nowMs?: number;
}) {
  const nowMs = opts.nowMs ?? Date.now();
  const buckets = getBuckets();
  const b = buckets.get(opts.key) ?? { tokens: opts.capacity, lastRefillMs: nowMs };

  const elapsedSec = Math.max(0, (nowMs - b.lastRefillMs) / 1000);
  const refill = elapsedSec * opts.refillPerSecond;
  const tokens = Math.min(opts.capacity, b.tokens + refill);

  const next: Bucket = { tokens, lastRefillMs: nowMs };
  if (next.tokens < 1) {
    buckets.set(opts.key, next);
    throw new Error("RATE_LIMITED");
  }

  next.tokens -= 1;
  buckets.set(opts.key, next);

  // Best-effort cleanup
  if (buckets.size > 10_000) {
    buckets.clear();
  }
}

export function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) return "unknown";
  return xff.split(",")[0]?.trim() || "unknown";
}

