import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";

/**
 * GET — whether this user's dashboard is currently frozen by an admin pause.
 */
export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const snap = await db.collection("users").doc(user.uid).get();
  const data = snap.exists ? snap.data() : {};

  return NextResponse.json({
    paused: data?.accountPaused === true,
    reason: data?.pauseReason ? String(data.pauseReason) : null,
  });
}
