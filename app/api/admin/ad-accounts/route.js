import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import {
  AD_ACCOUNTS_COLLECTION,
  AD_ACCOUNT_STATUS,
} from "@/lib/ad-accounts/constants";
import { TOP_UPS_COLLECTION } from "@/lib/top-ups/constants";
import { SUBSCRIPTIONS_COLLECTION } from "@/lib/subscriptions/constants";
import {
  mapAdAccountNewRequestRow,
  mapAdAccountApprovedRow,
} from "@/lib/admin/map-request-rows";

/**
 * ?tab=new — pending admin review (payment submitted)
 * ?tab=all — approved ad accounts
 */
export async function GET(request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "new";
  if (tab !== "new" && tab !== "all") {
    return NextResponse.json({ error: "invalid_tab" }, { status: 400 });
  }

  const status = tab === "new" ? "payment_submitted" : "approved";

  const db = getAdminDb();
  const snap = await db
    .collection(AD_ACCOUNTS_COLLECTION)
    .where("status", "==", status)
    .get();

  const paired = snap.docs.map((d) => ({
    id: d.id,
    data: d.data(),
    ms: d.data()?.createdAt?.toMillis?.() ?? 0,
  }));
  paired.sort((a, b) => b.ms - a.ms);

  /** @type {Map<string, number>} */
  const existingAdByUser = new Map();
  /** @type {Map<string, number>} */
  const subsByUser = new Map();

  if (tab === "new" && paired.length > 0) {
    const userIds = [
      ...new Set(
        paired
          .map((p) => p.data?.userId)
          .filter((u) => typeof u === "string" && u.length > 0)
      ),
    ];
    await Promise.all(
      userIds.map(async (uid) => {
        const [adSnap, subSnap] = await Promise.all([
          db
            .collection(AD_ACCOUNTS_COLLECTION)
            .where("userId", "==", uid)
            .where("status", "==", AD_ACCOUNT_STATUS.APPROVED)
            .get(),
          db.collection(SUBSCRIPTIONS_COLLECTION).where("userId", "==", uid).get(),
        ]);
        existingAdByUser.set(uid, adSnap.size);
        subsByUser.set(uid, subSnap.size);
      })
    );
  }

  /** @type {Map<string, import("firebase-admin/firestore").QueryDocumentSnapshot[]>} */
  const topUpsByAd = new Map();
  if (tab === "all" && paired.length > 0) {
    const adIds = paired.map((p) => p.id);
    for (let i = 0; i < adIds.length; i += 10) {
      const chunk = adIds.slice(i, i + 10);
      const topUpSnap = await db
        .collection(TOP_UPS_COLLECTION)
        .where("adAccountId", "in", chunk)
        .get();
      for (const d of topUpSnap.docs) {
        const key = String(d.data()?.adAccountId || "");
        if (!key) continue;
        const list = topUpsByAd.get(key) || [];
        list.push(d);
        topUpsByAd.set(key, list);
      }
    }
    for (const list of topUpsByAd.values()) {
      list.sort((a, b) => {
        const am = a.data()?.reviewedAt?.toMillis?.() ?? 0;
        const bm = b.data()?.reviewedAt?.toMillis?.() ?? 0;
        return bm - am;
      });
    }
  }

  const items = paired.map(({ id, data }) =>
    tab === "new"
      ? mapAdAccountNewRequestRow(id, data, { existingAdByUser, subsByUser })
      : mapAdAccountApprovedRow(id, data, topUpsByAd.get(id) || [])
  );

  return NextResponse.json({ items });
}
