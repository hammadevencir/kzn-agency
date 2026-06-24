import "server-only";

import { getAdminAuth } from "@/lib/firebase/admin";

/**
 * Verify Firebase session cookie (Node / proxy). Prefer over JWT-only parsing for correct claims.
 * @param {string} sessionCookie
 */
export async function verifySessionCookieServer(sessionCookie) {
  const auth = getAdminAuth();
  return auth.verifySessionCookie(sessionCookie, true);
}
