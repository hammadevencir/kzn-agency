import { AUTH_PROFILE_UPDATED_EVENT } from "@/lib/auth/constants";

/**
 * Notifies shell UI (e.g. header) that Firebase profile fields changed.
 * Pass the user snapshot so listeners do not rely on `auth.currentUser` timing.
 *
 * @param {import("firebase/auth").User | null | undefined} user
 */
export function emitAuthProfileUpdated(user) {
  if (typeof window === "undefined") return;
  const detail = user
    ? {
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL ?? null,
      }
    : null;
  window.dispatchEvent(
    new CustomEvent(AUTH_PROFILE_UPDATED_EVENT, { detail })
  );
}
