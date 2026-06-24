/** @typedef {'admin' | 'user' | 'manager'} UserRole */

export const SESSION_COOKIE_NAME = "__session";

/** Firebase Admin session cookie duration (ms). Max 14 days. */
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5;

export const ROLE = {
  ADMIN: "admin",
  USER: "user",
  MANAGER: "manager",
};

export const LOGIN_PATH = {
  [ROLE.ADMIN]: "/login",
  [ROLE.USER]: "/login",
  [ROLE.MANAGER]: "/manager/login",
};

export const DASHBOARD_PATH = {
  [ROLE.ADMIN]: "/admin/dashboard",
  [ROLE.USER]: "/user/dashboard",
  [ROLE.MANAGER]: "/manager/dashboard",
};

/** Fired after settings updates Firebase profile so shell (e.g. header) can sync from `auth.currentUser`. */
export const AUTH_PROFILE_UPDATED_EVENT = "kzn-auth-profile-updated";
