import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import { SUBSCRIPTIONS_COLLECTION } from "@/lib/subscriptions/constants";
import { mapSubscriptionAdminRow } from "@/lib/admin/map-request-rows";

/**
 * List subscriptions for admin review.
 * ?status=payment_submitted|approved|rejected
 */
export async function GET(request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  if (
    !status ||
    !["payment_submitted", "approved", "rejected"].includes(status)
  ) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const db = getAdminDb();

  /** @type {import("firebase-admin/firestore").QueryDocumentSnapshot[]} */
  let docs = [];

  if (status === "payment_submitted") {
    const [snapNew, snapUpgrade] = await Promise.all([
      db
        .collection(SUBSCRIPTIONS_COLLECTION)
        .where("status", "==", status)
        .get(),
      db
        .collection(SUBSCRIPTIONS_COLLECTION)
        .where("pendingUpgradeReview", "==", true)
        .get(),
    ]);
    const seen = new Set();
    for (const d of snapNew.docs) {
      seen.add(d.id);
      docs.push(d);
    }
    for (const d of snapUpgrade.docs) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      docs.push(d);
    }
  } else {
    const snap = await db
      .collection(SUBSCRIPTIONS_COLLECTION)
      .where("status", "==", status)
      .get();
    docs = snap.docs;
  }

  function reviewMs(data) {
    if (!data || typeof data !== "object") return 0;
    const pu =
      data.pendingUpgrade &&
      typeof data.pendingUpgrade === "object"
        ? /** @type {Record<string, unknown>} */ (data.pendingUpgrade)
        : null;
    const puPaid = pu?.paymentSubmittedAt;
    /** @type {any} */
    const puTs = puPaid;
    if (puTs && typeof puTs.toMillis === "function") {
      try {
        return puTs.toMillis();
      } catch {
        /* ignore */
      }
    }
    const top = data.paymentSubmittedAt;
    /** @type {any} */
    const topTs = top;
    if (topTs && typeof topTs.toMillis === "function") {
      try {
        return topTs.toMillis();
      } catch {
        /* ignore */
      }
    }
    const c = data.createdAt;
    /** @type {any} */
    const cTs = c;
    if (cTs && typeof cTs.toMillis === "function") {
      try {
        return cTs.toMillis();
      } catch {
        /* ignore */
      }
    }
    return 0;
  }

  const paired = docs.map((d) => ({
    id: d.id,
    data: d.data(),
    ms: reviewMs(d.data()),
  }));
  paired.sort((a, b) => b.ms - a.ms);
  const items = paired.map(({ id, data }) => mapSubscriptionAdminRow(id, data));

  return NextResponse.json({ items });
}
