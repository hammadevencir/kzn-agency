import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, ROLE } from "@/lib/auth/constants";
import { verifySessionCookieServer } from "@/lib/auth/verify-session-proxy";

/**
 * @returns {Promise<{ uid: string, email: string | null, role: string } | null>}
 */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;
  try {
    const decoded = await verifySessionCookieServer(session);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      role: decoded.role ?? null,
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
 * @returns {Promise<{ uid: string, email: string | null } | null>}
 */
export async function requireAdminSession() {
  const user = await getSessionUser();
  if (!user || user.role !== ROLE.ADMIN) return null;
  return { uid: user.uid, email: user.email };
}

/**
 * @returns {Promise<{ uid: string, email: string | null } | null>}
 */
export async function requireManagerSession() {
  const user = await getSessionUser();
  if (!user || user.role !== ROLE.MANAGER) return null;
  return { uid: user.uid, email: user.email };
}
