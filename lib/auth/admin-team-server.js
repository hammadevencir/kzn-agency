import "server-only";

import { ROLE } from "@/lib/auth/constants";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import { ADMIN_ROLE, normalizeAdminRole } from "@/lib/auth/admin-permissions";

export const USERS_COLLECTION = "users";

/**
 * Manager-only gate for team (admin login) management.
 * @returns {Promise<{ user: { uid: string, email: string | null, adminRole: string }, error: null } | { user: null, error: Response }>}
 */
export async function requireManagerSession() {
  const user = await requireAdminSession();
  if (!user) {
    return { user: null, error: Response.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (normalizeAdminRole(user.adminRole) !== ADMIN_ROLE.MANAGER) {
    return { user: null, error: Response.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { user, error: null };
}

/**
 * Lists every admin login (users with role "admin"), merged with Auth state.
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {import("firebase-admin/auth").Auth} auth
 */
export async function listAdminTeam(db, auth) {
  const snap = await db.collection(USERS_COLLECTION).where("role", "==", ROLE.ADMIN).get();
  const docs = snap.docs.map((d) => ({ uid: d.id, data: d.data() || {} }));

  /** @type {Map<string, import("firebase-admin/auth").UserRecord>} */
  const records = new Map();
  for (let i = 0; i < docs.length; i += 100) {
    const chunk = docs.slice(i, i + 100).map((d) => ({ uid: d.uid }));
    if (!chunk.length) continue;
    const res = await auth.getUsers(chunk);
    for (const u of res.users) records.set(u.uid, u);
  }

  return docs
    .map(({ uid, data }) => {
      const rec = records.get(uid);
      const created = data.createdAt?.toMillis?.() ?? null;
      return {
        uid,
        email: rec?.email ?? data.email ?? "",
        displayName: rec?.displayName ?? data.displayName ?? "",
        adminRole: normalizeAdminRole(data.adminRole),
        disabled: Boolean(rec?.disabled),
        missingAuth: !rec,
        createdAtMs: created,
        lastLoginMs: data.lastLoginAt?.toMillis?.() ?? null,
      };
    })
    .sort((a, b) => (a.email || "").localeCompare(b.email || ""));
}

/**
 * Number of enabled manager logins.
 * @param {Awaited<ReturnType<typeof listAdminTeam>>} team
 */
export function countActiveManagers(team) {
  return team.filter(
    (m) => m.adminRole === ADMIN_ROLE.MANAGER && !m.disabled && !m.missingAuth
  ).length;
}
