import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import {
  TOP_UPS_COLLECTION,
  TOP_UP_STATUS,
} from "@/lib/top-ups/constants";

const USERS_COLLECTION = "users";

/** @param {string[]} arr @param {number} size */
function chunk(arr, size) {
  /** @type {string[][]} */
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** @param {unknown} raw */
function parseAmount(raw) {
  if (raw == null) return 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.\-]/g, "").trim();
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** @param {string | null | undefined} email */
function maskEmail(email) {
  if (!email || typeof email !== "string") return "";
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const keep = Math.min(2, local.length);
  return `${local.slice(0, keep)}${"•".repeat(Math.max(1, local.length - keep))}@${domain}`;
}

/**
 * Top-spending leaderboard for the signed-in user's dashboard.
 *
 * Spending = sum of `checkout.amount` across approved top-ups. Returns the top
 * 3 users plus, when the requester isn't in the top 3, their own rank as a
 * trailing entry flagged with `isMe`.
 */
export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const topUpsSnap = await db
      .collection(TOP_UPS_COLLECTION)
      .where("status", "==", TOP_UP_STATUS.APPROVED)
      .get();

    /** @type {Record<string, number>} */
    const spentByUser = {};
    for (const d of topUpsSnap.docs) {
      const data = d.data();
      const uid = typeof data.userId === "string" ? data.userId : "";
      if (!uid) continue;
      // Skip admin balance adjustments that never actually received money.
      if (data.kind === "admin_adjustment" || data.source === "admin_balance_update") {
        continue;
      }
      const amount = parseAmount(data.checkout?.amount ?? data.appliedBalanceDelta);
      if (!amount) continue;
      spentByUser[uid] = (spentByUser[uid] || 0) + amount;
    }

    const ranked = Object.entries(spentByUser)
      .map(([uid, total]) => ({ uid, total }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);

    const topThreeUids = ranked.slice(0, 3).map((r) => r.uid);

    const meRankIndex = ranked.findIndex((r) => r.uid === user.uid);
    /** @type {string[]} */
    const uidsToFetch = [...topThreeUids];
    if (meRankIndex >= 3) uidsToFetch.push(user.uid);

    /** @type {Record<string, { name: string, email: string, photoURL: string | null }>} */
    const profiles = {};
    for (const group of chunk(uidsToFetch, 30)) {
      if (group.length === 0) continue;
      const refs = group.map((u) => db.collection(USERS_COLLECTION).doc(u));
      const snaps = await db.getAll(...refs);
      for (const snap of snaps) {
        if (!snap.exists) continue;
        const data = snap.data() || {};
        const rawName =
          typeof data.displayName === "string" && data.displayName.trim()
            ? data.displayName.trim()
            : "";
        const email =
          typeof data.email === "string" ? data.email.trim() : "";
        const name =
          rawName || (email ? email.split("@")[0] : "User");
        profiles[snap.id] = {
          name,
          email,
          photoURL:
            typeof data.photoURL === "string" && data.photoURL.trim()
              ? data.photoURL.trim()
              : null,
        };
      }
    }

    const top = ranked.slice(0, 3).map((r, idx) => {
      const p = profiles[r.uid] || { name: "User", email: "", photoURL: null };
      const isMe = r.uid === user.uid;
      return {
        uid: r.uid,
        rank: idx + 1,
        name: isMe ? `${p.name} (You)` : p.name,
        emailMasked: isMe ? p.email : maskEmail(p.email),
        photoURL: p.photoURL,
        totalSpent: r.total,
        isMe,
      };
    });

    /** @type {null | { uid: string, rank: number, name: string, emailMasked: string, photoURL: string | null, totalSpent: number, isMe: boolean }} */
    let me = null;
    if (meRankIndex >= 3) {
      const p = profiles[user.uid] || { name: "You", email: "", photoURL: null };
      me = {
        uid: user.uid,
        rank: meRankIndex + 1,
        name: `${p.name} (You)`,
        emailMasked: p.email,
        photoURL: p.photoURL,
        totalSpent: ranked[meRankIndex].total,
        isMe: true,
      };
    }

    return NextResponse.json({
      top,
      me,
      totalParticipants: ranked.length,
    });
  } catch (err) {
    console.error("[leaderboard] failed:", err);
    return NextResponse.json({ error: "leaderboard_failed" }, { status: 500 });
  }
}
