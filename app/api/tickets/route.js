import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import { TICKETS_COLLECTION } from "@/lib/tickets/constants";
import { serializeTicketForCustomer } from "@/lib/tickets/server-tickets";

/**
 * GET — the signed-in customer's own tickets, newest first.
 * Internal admin notes are never included.
 */
export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const snap = await getAdminDb()
    .collection(TICKETS_COLLECTION)
    .where("userId", "==", user.uid)
    .get();
  const items = snap.docs
    .map(serializeTicketForCustomer)
    .sort((a, b) => b.createdAtMs - a.createdAtMs);
  return NextResponse.json({ items });
}
