import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import { SUBSCRIPTIONS_COLLECTION } from "@/lib/subscriptions/constants";
import { AD_ACCOUNTS_COLLECTION } from "@/lib/ad-accounts/constants";
import { TOP_UPS_COLLECTION } from "@/lib/top-ups/constants";
import { buildUserInvoiceList } from "@/lib/user/build-user-invoice-list";

const GET_USERS_CHUNK = 100;
const FIRESTORE_GET_ALL_CHUNK = 10;
/** @param {string[]} uids */
function chunkUids(uids, size) {
  const out = [];
  for (let i = 0; i < uids.length; i += size) {
    out.push(uids.slice(i, i + size));
  }
  return out;
}

/**
 * All invoice-style payment records across end users (subscriptions with checkout,
 * ad account requests with checkout, top-ups with checkout).
 */
export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const [subscriptionsSnap, adAccountsSnap, topUpsSnap] = await Promise.all([
    db.collection(SUBSCRIPTIONS_COLLECTION).get(),
    db.collection(AD_ACCOUNTS_COLLECTION).get(),
    db.collection(TOP_UPS_COLLECTION).get(),
  ]);

  const rawItems = buildUserInvoiceList({
    subscriptionDocs: subscriptionsSnap.docs,
    adAccountDocs: adAccountsSnap.docs,
    topUpDocs: topUpsSnap.docs,
  });

  const uidSet = new Set(
    rawItems.map((i) => i.userId).filter((id) => typeof id === "string" && id.length > 0)
  );
  const uids = [...uidSet];

  /** @type {Map<string, { userId: string, displayName: string, photoURL: string | null, email: string | null }>} */
  const userById = new Map();

  const auth = getAdminAuth();
  for (const batch of chunkUids(uids, GET_USERS_CHUNK)) {
    const res = await auth.getUsers(batch.map((uid) => ({ uid })));
    for (const u of res.users) {
      userById.set(u.uid, {
        userId: u.uid,
        displayName: String(u.displayName ?? "").trim(),
        photoURL: u.photoURL ?? null,
        email: u.email ?? null,
      });
    }
  }

  for (const batch of chunkUids(uids, FIRESTORE_GET_ALL_CHUNK)) {
    if (batch.length === 0) continue;
    const refs = batch.map((uid) => db.collection("users").doc(uid));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const uid = snap.id;
      const data = snap.data();
      const existing = userById.get(uid) ?? {
        userId: uid,
        displayName: "",
        photoURL: null,
        email: null,
      };
      userById.set(uid, {
        userId: uid,
        displayName:
          existing.displayName || String(data?.displayName ?? "").trim(),
        photoURL: existing.photoURL ?? data?.photoURL ?? null,
        email: existing.email ?? data?.email ?? null,
      });
    }
  }

  for (const uid of uids) {
    if (!userById.has(uid)) {
      userById.set(uid, {
        userId: uid,
        displayName: "",
        photoURL: null,
        email: null,
      });
    }
  }

  const items = rawItems.map((row) => {
    const uid = row.userId;
    const user =
      uid && userById.has(uid)
        ? userById.get(uid)
        : {
            userId: uid || "",
            displayName: "",
            photoURL: null,
            email: null,
          };
    return { ...row, user };
  });

  return NextResponse.json({ items });
}
