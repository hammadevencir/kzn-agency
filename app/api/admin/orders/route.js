import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import {
  ORDERS_COLLECTION,
  ORDER_STATUS,
  ORDER_STATUSES,
  ratingDistribution,
} from "@/lib/orders/constants";
import { serializeOrder } from "@/lib/orders/server-orders";

export const runtime = "nodejs";

/**
 * @param {Array<Record<string, any>>} orders
 * @param {(o: Record<string, any>) => string} keyOf
 * @param {(o: Record<string, any>) => Record<string, unknown>} metaOf
 */
function groupStats(orders, keyOf, metaOf) {
  /** @type {Map<string, { meta: Record<string, unknown>, list: Array<Record<string, any>> }>} */
  const groups = new Map();
  for (const o of orders) {
    if (o.rating == null) continue;
    const key = keyOf(o);
    if (!groups.has(key)) groups.set(key, { meta: metaOf(o), list: [] });
    groups.get(key).list.push(o);
  }
  return [...groups.entries()]
    .map(([key, { meta, list }]) => {
      const { average, total } = ratingDistribution(list);
      return { key, ...meta, average, total };
    })
    .sort((a, b) => b.total - a.total);
}

/**
 * GET — ?status=new|pending|delivered|cancelled (default "new").
 * Returns the orders in that status plus per-status counts and smiley stats
 * (overall / per product / per category). Everything is filtered in memory, so
 * no composite Firestore index is needed. Visible to every admin sub-role.
 */
export async function GET(request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || ORDER_STATUS.NEW;
  if (!ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const db = getAdminDb();
  const snap = await db.collection(ORDERS_COLLECTION).get();
  const all = snap.docs.map((d) => serializeOrder(d, { admin: true }));

  /** @type {Record<string, number>} */
  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
  for (const o of all) {
    if (counts[o.status] != null) counts[o.status] += 1;
  }

  const items = all
    .filter((o) => o.status === status)
    .sort((a, b) => Number(b.createdAtMs) - Number(a.createdAtMs));

  const overall = ratingDistribution(all);
  const stats = {
    overall,
    byProduct: groupStats(
      all,
      (o) => String(o.productId || o.productName),
      (o) => ({ productName: o.productName, categoryTitle: o.categoryTitle })
    ),
    byCategory: groupStats(
      all,
      (o) => String(o.category || o.categoryTitle),
      (o) => ({ categoryTitle: o.categoryTitle })
    ),
  };

  return NextResponse.json({ items, counts, stats });
}
