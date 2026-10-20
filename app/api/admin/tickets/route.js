import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import { TICKETS_COLLECTION, TICKET_STATUS, TICKET_STATUSES } from "@/lib/tickets/constants";
import { serializeTicket } from "@/lib/tickets/server-tickets";

export const runtime = "nodejs";

/**
 * GET — tickets for one status tab (default "open"), newest first, plus the
 * count per status for the tab badges. Visible to every admin sub-role.
 * ?status=open|in_progress|solved   ?countOnly=1 → only `counts` (sidebar badge)
 */
export async function GET(request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || TICKET_STATUS.OPEN;
  if (!TICKET_STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const db = getAdminDb();
  const col = db.collection(TICKETS_COLLECTION);
  if (searchParams.get("countOnly") === "1") {
    const open = await col.where("status", "==", TICKET_STATUS.OPEN).count().get();
    return NextResponse.json({ counts: { [TICKET_STATUS.OPEN]: open.data().count } });
  }
  // Equality-only queries + in-memory sort: no composite index needed.
  const [snap, ...countSnaps] = await Promise.all([
    col.where("status", "==", status).get(),
    ...TICKET_STATUSES.map((s) => col.where("status", "==", s).count().get()),
  ]);

  const items = snap.docs
    .map((d) => serializeTicket(d))
    .sort((a, b) => b.createdAtMs - a.createdAtMs);

  /** @type {Record<string, number>} */
  const counts = {};
  TICKET_STATUSES.forEach((s, i) => {
    counts[s] = countSnaps[i].data().count;
  });

  return NextResponse.json({ items, counts });
}
