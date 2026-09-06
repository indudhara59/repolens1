import "server-only";
import { Redis } from "@upstash/redis";

let client: Redis | null = null;

export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!client) client = new Redis({ url, token });
  return client;
}

/**
 * Read-through cache. Falls back to calling `fn` uncached if Redis env vars
 * are missing, so the app still works before Upstash is configured.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const redis = getRedis();
  if (!redis) return fn();

  const hit = await redis.get<T>(key);
  if (hit !== null && hit !== undefined) return hit;

  const value = await fn();
  await redis.set(key, value, { ex: ttlSeconds });
  return value;
}

export const CACHE_TTL = {
  META: 60 * 60, // 1 hour
  RELEASES: 60 * 60, // 1 hour
  COMMITS: 10 * 60, // 10 min
  ISSUES: 10 * 60, // 10 min
  PRS: 10 * 60, // 10 min
} as const;
