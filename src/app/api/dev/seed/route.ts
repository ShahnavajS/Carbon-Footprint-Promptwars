import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  console.log("📋 Seed endpoint called");

  // In mock mode, just validate and respond - no actual Firestore writes needed
  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.includes("mock");
  if (!isDev) {
    console.log("❌ Not in development mode");
    return NextResponse.json(
      { error: "Seed endpoint only available in development environment." },
      { status: 403 }
    );
  }

  try {
    const testEmail = "test@ecoscore.com";
    const testPassword = "password123";
    const testUid = "test-eco-user-id";

    console.log("✅ Demo data ready (stored in localStorage)");

    return NextResponse.json({
      success: true,
      message: "Demo account ready. Use localStorage for data storage.",
      loginDetails: {
        email: testEmail,
        password: testPassword,
        uid: testUid,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error("❌ Seed error:", err.message);
    return NextResponse.json(
      { error: "Seed failed", details: err.message || String(err) },
      { status: 500 }
    );
  }
}
