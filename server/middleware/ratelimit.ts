// Basic fixed-window rate limit on the public /api/* proxy.
// ponytail: in-memory, per serverless instance only, so it deters casual abuse
// rather than guaranteeing a global cap. The 30s response cache already shields
// the upstream feeds; this mainly caps function invocation cost.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;

interface Bucket {
  count: number;
  reset: number;
}
const buckets = new Map<string, Bucket>();

export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/')) return;

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || now > bucket.reset) {
    buckets.set(ip, { count: 1, reset: now + WINDOW_MS });
    // Opportunistic prune so the map does not grow unbounded.
    if (buckets.size > 5000) {
      for (const [key, b] of buckets) if (now > b.reset) buckets.delete(key);
    }
    return;
  }

  if (bucket.count >= MAX_PER_WINDOW) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' });
  }
  bucket.count++;
});
