/**
 * Admin sub-roles ("team" logins) — single source of truth for what each
 * admin sub-role may see. Safe to import from client components, proxy.js and
 * API routes (no server-only deps).
 *
 * Every admin keeps `users/{uid}.role === "admin"` (so all existing admin
 * checks, proxy redirects and Firestore rules keep working). The sub-role
 * lives in `users/{uid}.adminRole` and is mirrored into the session custom
 * claim `adminRole` by /api/auth/session. A missing value means "manager"
 * (full access) — this keeps pre-existing admins backwards compatible.
 */

/** @typedef {'manager' | 'support'} AdminRole */

export const ADMIN_ROLE = {
  /** Managers can see everything (default for existing admins). */
  MANAGER: "manager",
  /** Customer service team — restricted, see RESTRICTED_SECTIONS_FOR_SUPPORT. */
  SUPPORT: "support",
};

export const ADMIN_ROLES = [ADMIN_ROLE.MANAGER, ADMIN_ROLE.SUPPORT];

export const ADMIN_ROLE_LABEL = {
  [ADMIN_ROLE.MANAGER]: "Manager",
  [ADMIN_ROLE.SUPPORT]: "Customer Service",
};

/**
 * Admin section ids (match sidebar item ids in
 * components/common-admin-manager/sidebar.jsx).
 */
export const ADMIN_SECTION = {
  SETTINGS: "settings",
  AFFILIATE_REQUESTS: "affiliate-requests",
  CONTACT_REQUESTS: "contact-requests",
  FINANCIAL: "financial",
};

/** Sections the customer-service (support) sub-role may NOT see. */
export const RESTRICTED_SECTIONS_FOR_SUPPORT = [
  ADMIN_SECTION.SETTINGS,
  ADMIN_SECTION.AFFILIATE_REQUESTS,
  ADMIN_SECTION.CONTACT_REQUESTS,
  ADMIN_SECTION.FINANCIAL,
];

/**
 * @param {unknown} value
 * @returns {AdminRole} anything other than "support" ⇒ "manager"
 */
export function normalizeAdminRole(value) {
  return value === ADMIN_ROLE.SUPPORT ? ADMIN_ROLE.SUPPORT : ADMIN_ROLE.MANAGER;
}

/**
 * @param {unknown} adminRole
 * @param {string} sectionId
 */
export function canAccessAdminSection(adminRole, sectionId) {
  const r = normalizeAdminRole(adminRole);
  if (r === ADMIN_ROLE.MANAGER) return true;
  return !RESTRICTED_SECTIONS_FOR_SUPPORT.includes(sectionId);
}

/** @param {unknown} adminRole @returns {string[]} section ids hidden for this sub-role */
export function hiddenAdminSections(adminRole) {
  return normalizeAdminRole(adminRole) === ADMIN_ROLE.SUPPORT
    ? [...RESTRICTED_SECTIONS_FOR_SUPPORT]
    : [];
}

/** Restricted page paths → section id. */
const SECTION_PATH_PREFIXES = [
  ["/admin/settings", ADMIN_SECTION.SETTINGS],
  ["/admin/affiliate-requests", ADMIN_SECTION.AFFILIATE_REQUESTS],
  ["/admin/contact-requests", ADMIN_SECTION.CONTACT_REQUESTS],
  ["/admin/financial", ADMIN_SECTION.FINANCIAL],
];

/**
 * Maps an /admin/* page pathname to a permission-controlled section id.
 * @param {string} pathname
 * @returns {string | null} null when the path is not permission-controlled
 */
export function adminSectionForPath(pathname) {
  if (typeof pathname !== "string") return null;
  for (const [prefix, section] of SECTION_PATH_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return section;
  }
  return null;
}

/** @param {unknown} adminRole @param {string} pathname */
export function canAccessAdminPath(adminRole, pathname) {
  const section = adminSectionForPath(pathname);
  return section ? canAccessAdminSection(adminRole, section) : true;
}
