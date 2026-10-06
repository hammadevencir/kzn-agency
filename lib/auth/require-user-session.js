import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, ROLE } from "@/lib/auth/constants";
import { verifySessionCookieServer } from "@/lib/auth/verify-session-proxy";
import {
  canAccessAdminSection,
  normalizeAdminRole,
} from "@/lib/auth/admin-permissions";

/**
 * @returns {Promise<{ uid: string, email: string | null, role: string, adminRole: string | null } | null>}
 */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;
  try {
    const decoded = await verifySessionCookieServer(session);
    const role = decoded.role ?? null;
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      role,
      // Admin sub-role from the session claim; missing ⇒ "manager".
      adminRole: role === ROLE.ADMIN ? normalizeAdminRole(decoded.adminRole) : null,
    };
  } catch {
    return null;
  }
}

/**
 * End-user portal only (ad account requests).
 * @returns {Promise<{ uid: string, email: string | null } | null>}
 */
export async function requireEndUserSession() {
  const user = await getSessionUser();
  if (!user || user.role !== ROLE.USER) return null;
  return { uid: user.uid, email: user.email };
}

/**
 * Any admin (manager or customer-service/support).
 * @returns {Promise<{ uid: string, email: string | null, adminRole: string } | null>}
 */
export async function requireAdminSession() {
  const user = await getSessionUser();
  if (!user || user.role !== ROLE.ADMIN) return null;
  return { uid: user.uid, email: user.email, adminRole: user.adminRole };
}

/**
 * Admin session that is also allowed to access a permission-controlled admin
 * section (see lib/auth/admin-permissions.js → RESTRICTED_SECTIONS_FOR_SUPPORT).
 *
 * Usage in an API route:
 *   const gate = await requireAdminSection("contact-requests");
 *   if (gate.error) return gate.error; // 401 not signed in / 403 forbidden
 *   const user = gate.user;
 *
 * Section ids: "settings", "affiliate-requests", "contact-requests",
 * "financial". Future /api/admin/financial/* routes MUST call
 * `requireAdminSection("financial")` so customer-service logins are blocked.
 *
 * @param {string} sectionId
 * @returns {Promise<{ user: { uid: string, email: string | null, adminRole: string }, error: null } | { user: null, error: Response }>}
 */
export async function requireAdminSection(sectionId) {
  const user = await requireAdminSession();
  if (!user) {
    return {
      user: null,
      error: Response.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  if (!canAccessAdminSection(user.adminRole, sectionId)) {
    return {
      user: null,
      error: Response.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  return { user, error: null };
}
