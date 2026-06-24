"use client";

/**
 * Exchange a Firebase ID token for an httpOnly session cookie (and sync Firestore + custom claims).
 * @param {import('firebase/auth').User} user
 * @param {'admin' | 'user' | 'manager' | 'auto'} portal — use `'auto'` for unified /login (role from Firestore).
 * @returns {Promise<'admin' | 'user' | 'manager'>}
 */
export async function establishSession(user, portal) {
  let forceRefresh = false;

  for (let attempt = 0; attempt < 3; attempt++) {
    const idToken = await user.getIdToken(forceRefresh);
    const payload =
      portal === "auto"
        ? { idToken, autoRole: true }
        : { idToken, portal };

    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.ok && typeof data.role === "string") {
      return /** @type {'admin' | 'user' | 'manager'} */ (data.role);
    }

    if (data.needsTokenRefresh) {
      forceRefresh = true;
      continue;
    }

    const err = new Error(data.message || data.error || "session_error");
    err.code = data.error;
    throw err;
  }

  throw new Error("session_exchange_failed");
}
