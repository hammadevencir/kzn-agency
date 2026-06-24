import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import { backfillSubscriptionExpiries } from "@/lib/subscriptions/expiry-worker";

/**
 * One-shot admin utility: stamp `expiresAt = createdAt + 30 days` on any
 * previously-approved subscription that is missing the field.
 */
export async function POST() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const result = await backfillSubscriptionExpiries(db);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[backfill-expiry] failed:", err);
    return NextResponse.json(
      { error: "backfill_failed" },
      { status: 500 }
    );
  }
}
