import "server-only";

import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/require-user-session";
import { ROLE } from "@/lib/auth/constants";
import { AD_ACCOUNTS_COLLECTION, AD_ACCOUNT_STATUS } from "@/lib/ad-accounts/constants";
import { SUBSCRIPTIONS_COLLECTION, SUBSCRIPTION_STATUS } from "@/lib/subscriptions/constants";
import { TOP_UPS_COLLECTION, TOP_UP_STATUS } from "@/lib/top-ups/constants";
import { formatJoinedDate } from "@/lib/admin/admin-users-helpers";

const USERS_COLLECTION = "users";

function chunk(arr, size) {
  /** @type {string[][]} */
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function createdMs(ts) {
  if (ts == null) return 0;
  try {
    if (typeof ts.toMillis === "function") return ts.toMillis();
  } catch {
    return 0;
  }
  return 0;
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {import("firebase-admin/firestore").QueryDocumentSnapshot[]} userDocs
 */
async function enrichRegistrationRows(db, userDocs) {
  const uids = userDocs.map((d) => d.id);
  if (uids.length === 0) return [];

  /** @type {Record<string, number>} */
  const adCount = {};
  /** @type {Record<string, number>} */
  const subCount = {};
  for (const uid of uids) {
    adCount[uid] = 0;
    subCount[uid] = 0;
  }

  for (const group of chunk(uids, 30)) {
    const [adSnap, subSnap] = await Promise.all([
      db.collection(AD_ACCOUNTS_COLLECTION).where("userId", "in", group).get(),
      db
        .collection(SUBSCRIPTIONS_COLLECTION)
        .where("userId", "in", group)
        .get(),
    ]);
    for (const d of adSnap.docs) {
      const u = d.data()?.userId;
      if (typeof u === "string" && adCount[u] != null) {
        adCount[u] += 1;
      }
    }
    for (const d of subSnap.docs) {
      const u = d.data()?.userId;
      if (typeof u === "string" && subCount[u] != null) {
        subCount[u] += 1;
      }
    }
  }

  return userDocs.map((doc) => {
    const uid = doc.id;
    const data = doc.data();
    const name =
      (typeof data.displayName === "string" && data.displayName.trim()
        ? data.displayName
        : null) ||
      (typeof data.email === "string" ? data.email.split("@")[0] : null) ||
      "—";
    return {
      customerName: name,
      joinedDate: formatJoinedDate(data.createdAt),
      subscriptions: String(subCount[uid] ?? 0).padStart(2, "0"),
      adAccounts: String(adCount[uid] ?? 0).padStart(2, "0"),
    };
  });
}

/**
 * @param {import("firebase-admin/firestore").Query} q
 */
async function countQuery(q) {
  try {
    const snap = await q.count().get();
    return snap.data().count;
  } catch {
    const snap = await q.get();
    return snap.size;
  }
}

/**
 * Admin / manager dashboard: aggregate counts + 10 most recent end-user registrations.
 * @returns {Promise<null | {
 *   stats: { totalTopUps: number, totalSubscriptions: number, totalUsers: number, totalAdAccounts: number },
 *   recentRegistrations: Array<{ customerName: string, joinedDate: string, subscriptions: string, adAccounts: string }>,
 *   viewer: { displayName: string, email: string | null }
 * }>}
 */
export async function loadAdminDashboardData() {
  const sessionUser = await getSessionUser();
  if (
    !sessionUser ||
    (sessionUser.role !== ROLE.ADMIN && sessionUser.role !== ROLE.MANAGER)
  ) {
    return null;
  }

  const db = getAdminDb();
  const auth = getAdminAuth();

  const [
    totalUsers,
    totalAdAccounts,
    totalSubscriptions,
    totalTopUps,
  ] = await Promise.all([
    countQuery(db.collection(USERS_COLLECTION).where("role", "==", ROLE.USER)),
    countQuery(
      db
        .collection(AD_ACCOUNTS_COLLECTION)
        .where("status", "==", AD_ACCOUNT_STATUS.APPROVED)
    ),
    countQuery(
      db
        .collection(SUBSCRIPTIONS_COLLECTION)
        .where("status", "==", SUBSCRIPTION_STATUS.APPROVED)
    ),
    countQuery(
      db
        .collection(TOP_UPS_COLLECTION)
        .where("status", "==", TOP_UP_STATUS.APPROVED)
    ),
  ]);

  /** @type {import("firebase-admin/firestore").QueryDocumentSnapshot[]} */
  let recentDocs;
  try {
    const snap = await db
      .collection(USERS_COLLECTION)
      .where("role", "==", ROLE.USER)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();
    recentDocs = snap.docs;
  } catch {
    const snap = await db
      .collection(USERS_COLLECTION)
      .where("role", "==", ROLE.USER)
      .get();
    recentDocs = [...snap.docs]
      .sort(
        (a, b) =>
          createdMs(b.data().createdAt) - createdMs(a.data().createdAt)
      )
      .slice(0, 10);
  }

  const recentRegistrations = await enrichRegistrationRows(db, recentDocs);

  let displayName = "";
  let email = sessionUser.email ?? null;
  try {
    const rec = await auth.getUser(sessionUser.uid);
    displayName =
      (typeof rec.displayName === "string" && rec.displayName.trim()
        ? rec.displayName
        : "") ||
      (email ? email.split("@")[0] : "");
    email = rec.email ?? email;
  } catch {
    displayName = email ? email.split("@")[0] : "";
  }

  return {
    stats: {
      totalTopUps,
      totalSubscriptions,
      totalUsers,
      totalAdAccounts,
    },
    recentRegistrations,
    viewer: {
      displayName: displayName || "there",
      email,
    },
  };
}
