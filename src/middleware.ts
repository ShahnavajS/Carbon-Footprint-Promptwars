import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Token-bucket rate limiter — dev/architecture placeholder.
// In production, replace with Redis/Upstash to share state across edge replicas.
const ipCache = new Map<string, { tokens: number; lastRefill: number }>();

const LIMIT = 100;
const WINDOW_MS = 60_000; // 1 minute
const REFILL_RATE = LIMIT / WINDOW_MS;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = ipCache.get(ip) ?? { tokens: LIMIT, lastRefill: now };
  const elapsed = now - bucket.lastRefill;
  const refilled = Math.min(LIMIT, bucket.tokens + elapsed * REFILL_RATE);

  if (refilled >= 1) {
    ipCache.set(ip, { tokens: refilled - 1, lastRefill: now });
    return true;
  }

  ipCache.set(ip, { tokens: 0, lastRefill: now });
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    const ip = getClientIp(request);

    if (!rateLimit(ip)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again in a moment.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
