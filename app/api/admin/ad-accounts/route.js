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
 * ?tab=paused — approved ad accounts currently paused
 * ?tab=deleted — soft-deleted ad accounts
 */
export async function GET(request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "new";
  if (!["new", "all", "paused", "deleted"].includes(tab)) {
    return NextResponse.json({ error: "invalid_tab" }, { status: 400 });
  }

  const db = getAdminDb();
  const col = db.collection(AD_ACCOUNTS_COLLECTION);

  const baseQuery =
    tab === "new"
      ? col.where("status", "==", AD_ACCOUNT_STATUS.PAYMENT_SUBMITTED)
      : tab === "paused"
        ? col.where("paused", "==", true)
        : tab === "deleted"
          ? col.where("deleted", "==", true)
          : col.where("status", "==", AD_ACCOUNT_STATUS.APPROVED);

  const [
    snap,
    newTotalSnap,
    allTotalSnap,
    pausedTotalSnap,
    deletedTotalSnap,
    newDeletedSnap,
    allDeletedSnap,
    pausedDeletedSnap,
  ] = await Promise.all([
    baseQuery.get(),
    col.where("status", "==", AD_ACCOUNT_STATUS.PAYMENT_SUBMITTED).count().get(),
    col.where("status", "==", AD_ACCOUNT_STATUS.APPROVED).count().get(),
    col.where("paused", "==", true).count().get(),
    col.where("deleted", "==", true).count().get(),
    col.where("status", "==", AD_ACCOUNT_STATUS.PAYMENT_SUBMITTED).where("deleted", "==", true).count().get(),
    col.where("status", "==", AD_ACCOUNT_STATUS.APPROVED).where("deleted", "==", true).count().get(),
    col.where("paused", "==", true).where("deleted", "==", true).count().get(),
  ]);
  const counts = {
    new: newTotalSnap.data().count - newDeletedSnap.data().count,
    all: allTotalSnap.data().count - allDeletedSnap.data().count,
    paused: pausedTotalSnap.data().count - pausedDeletedSnap.data().count,
    deleted: deletedTotalSnap.data().count,
  };

  let paired = snap.docs.map((d) => ({
    id: d.id,
    data: d.data(),
    ms: d.data()?.createdAt?.toMillis?.() ?? 0,
  }));
  if (tab !== "deleted") {
    paired = paired.filter((p) => p.data?.deleted !== true);
  }
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
  if (tab !== "new" && paired.length > 0) {
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

  return NextResponse.json({ items, counts });
}
