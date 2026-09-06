import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "@/lib/redis";

type RateLimitKind = "index" | "chat";

let indexLimiter: Ratelimit | null = null;
let chatLimiter: Ratelimit | null = null;

function getLimiter(kind: RateLimitKind): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  if (kind === "index") {
    if (!indexLimiter) {
      indexLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "60 s"),
        prefix: "ratelimit:index",
      });
    }
    return indexLimiter;
  }

  if (!chatLimiter) {
    chatLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      prefix: "ratelimit:chat",
    });
  }
  return chatLimiter;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export interface RateLimitResult {
  success: boolean;
  retryAfterSeconds?: number;
}

export async function checkRateLimit(
  kind: RateLimitKind,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(kind);
  if (!limiter) return { success: true };

  const result = await limiter.limit(identifier);
  if (result.success) return { success: true };

  const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return { success: false, retryAfterSeconds };
}

export const RATE_LIMIT_MESSAGE =
  "You're doing that a bit too fast — please wait a moment and try again.";
