/**
 * POST /api/dev/seed
 * Dev-only helper that returns the demo account credentials so reviewers can
 * log into the public demo. In mock mode no Firestore writes are needed — the
 * demo session is persisted client-side via localStorage.
 *
 * Blocked outside development / mock-Firebase environments.
 */

import { NextResponse } from "next/server";
import { logger } from "@/services/logger.service";
import { DEMO_UID } from "@/config/constants";
import { internalError } from "@/lib/parse-request";

export const runtime = "nodejs";

const DEMO_EMAIL = "demo@ecoscore.app";
const DEMO_PASSWORD = "demo123456";

export async function POST() {
  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.includes("mock");

  if (!isDev) {
    return NextResponse.json(
      { error: "Seed endpoint only available in development environment." },
      { status: 403 }
    );
  }

  try {
    logger.info("Seed endpoint called — demo data is client-side (localStorage)");

    return NextResponse.json({
      success: true,
      message: "Demo account ready. Session is stored in localStorage.",
      loginDetails: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        uid: DEMO_UID,
      },
    });
  } catch (error) {
    logger.error("Seed failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalError("Seed failed");
  }
}
