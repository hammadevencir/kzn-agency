import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/require-user-session";
import { ROLE } from "@/lib/auth/constants";
import { AD_ACCOUNTS_COLLECTION } from "@/lib/ad-accounts/constants";
import { SUBSCRIPTIONS_COLLECTION } from "@/lib/subscriptions/constants";
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

export async function GET() {
  const sessionUser = await getSessionUser();
  if (
    !sessionUser ||
    (sessionUser.role !== ROLE.ADMIN && sessionUser.role !== ROLE.MANAGER)
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const usersSnap = await db
    .collection(USERS_COLLECTION)
    .where("role", "==", ROLE.USER)
    .get();

  if (usersSnap.empty) {
    return NextResponse.json({ users: [] });
  }

  const uids = usersSnap.docs.map((d) => d.id);
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

  function createdMs(ts) {
    if (ts == null) return 0;
    try {
      if (typeof ts.toMillis === "function") return ts.toMillis();
    } catch {
      return 0;
    }
    return 0;
  }

  const users = usersSnap.docs
    .map((doc) => {
      const uid = doc.id;
      const data = doc.data();
      const name =
        (typeof data.displayName === "string" && data.displayName.trim()
          ? data.displayName
          : null) ||
        (typeof data.email === "string" ? data.email.split("@")[0] : null) ||
        "—";
      const email = typeof data.email === "string" ? data.email : "—";
      return {
        id: uid,
        name,
        email,
        joinedDate: formatJoinedDate(data.createdAt),
        adAccounts: String(adCount[uid] ?? 0).padStart(2, "0"),
        subscriptions: String(subCount[uid] ?? 0).padStart(2, "0"),
        _sort: createdMs(data.createdAt),
      };
    })
    .sort((a, b) => b._sort - a._sort)
    .map(({ _sort, ...row }) => row);

  return NextResponse.json({ users });
}
