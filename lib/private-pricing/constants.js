/**
 * Legendary Package — private-pricing applications (public /pricing form).
 * Safe to import from both client and server code.
 */

export const PRIVATE_PRICING_COLLECTION = "private-pricing-requests";
export const PRIVATE_PRICING_RATE_LIMIT_COLLECTION = "private-pricing-rate-limits";
export const PRIVATE_PRICING_STORAGE_PREFIX = "private-pricing";

/** Admin page + tab that lists these requests (used by the notification bell). */
export const PRIVATE_PRICING_ADMIN_HREF = "/admin/contact-requests?tab=private-pricing";

export const PRIVATE_PRICING_STATUS = {
  NEW: "new",
  CONTACTED: "contacted",
  QUOTED: "quoted",
  CLOSED: "closed",
};

export const PRIVATE_PRICING_STATUS_OPTIONS = [
  { value: PRIVATE_PRICING_STATUS.NEW, label: "New" },
  { value: PRIVATE_PRICING_STATUS.CONTACTED, label: "Contacted" },
  { value: PRIVATE_PRICING_STATUS.QUOTED, label: "Quoted" },
  { value: PRIVATE_PRICING_STATUS.CLOSED, label: "Closed" },
];

/** Must match CURRENT_AD_SPEND_OPTIONS in components/sections/website/pricing/pricing-data.js. */
export const PRIVATE_PRICING_SPEND_OPTIONS = ["$500K-1M", "2M", "5M", "10M", "$10M+"];

/** Honeypot input name — hidden from humans; bots that fill it are silently dropped. */
export const PRIVATE_PRICING_HONEYPOT_FIELD = "contactNickname";

export const PRIVATE_PRICING_MAX_FILES = 5;
export const PRIVATE_PRICING_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB each
export const PRIVATE_PRICING_MAX_TOTAL_BYTES = 30 * 1024 * 1024; // 30 MB for all files
/** Whole multipart body (files + text fields + boundaries). */
export const PRIVATE_PRICING_MAX_REQUEST_BYTES = PRIVATE_PRICING_MAX_TOTAL_BYTES + 512 * 1024;

/** Per-IP submissions allowed per rolling window. */
export const PRIVATE_PRICING_RATE_LIMIT = 5;
export const PRIVATE_PRICING_RATE_WINDOW_MS = 60 * 60 * 1000;

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const PRIVATE_PRICING_ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/csv",
  XLSX_TYPE,
]);

export const PRIVATE_PRICING_ACCEPT_ATTR =
  "image/png,image/jpeg,image/webp,application/pdf,text/csv,.png,.jpg,.jpeg,.webp,.pdf,.csv,.xlsx";

/** @param {string | undefined} name */
export function privatePricingContentTypeFromName(name) {
  const ext = String(name || "").toLowerCase().split(".").pop();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "pdf") return "application/pdf";
  if (ext === "csv") return "text/csv";
  if (ext === "xlsx") return XLSX_TYPE;
  return "";
}

/**
 * The extension decides the stored content type (browsers report CSV as
 * "application/vnd.ms-excel" on Windows, some send an empty type, etc.).
 * Falls back to the declared type only when there is no known extension.
 * @param {string | undefined} type
 * @param {string | undefined} name
 */
export function resolvePrivatePricingContentType(type, name) {
  const byName = privatePricingContentTypeFromName(name);
  if (byName) return byName;
  const t = String(type || "").toLowerCase();
  if (t === "image/jpg") return "image/jpeg";
  return PRIVATE_PRICING_ALLOWED_TYPES.has(t) ? t : "";
}
