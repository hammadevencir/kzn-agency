/**
 * Shared constants + sanitizer for creative images attached to an ad-account
 * request form (VIP "Send us some creatives so we can check if you are
 * eligible"). Safe to import from both client and server code.
 */

export const CREATIVES_STORAGE_PREFIX = "request-creatives";
export const CREATIVE_MAX_FILES = 5;
export const CREATIVE_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const CREATIVE_ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);
export const CREATIVE_ACCEPT_ATTR =
  "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";

/** @param {string | undefined} name */
export function creativeContentTypeFromName(name) {
  const ext = String(name || "").toLowerCase().split(".").pop();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "";
}

/**
 * Validate the `creatives` array sent with a request. Only entries that were
 * uploaded into the caller's own `request-creatives/{uid}/` folder are kept.
 * @param {unknown} input
 * @param {string} uid
 * @returns {{ url: string, path: string, name: string, contentType: string, size: number, uploadedAt: string }[]}
 */
export function sanitizeRequestCreatives(input, uid) {
  if (!Array.isArray(input) || !uid) return [];
  const prefix = `${CREATIVES_STORAGE_PREFIX}/${uid}/`;
  const out = [];
  for (const raw of input) {
    if (out.length >= CREATIVE_MAX_FILES) break;
    if (!raw || typeof raw !== "object") continue;
    const p = /** @type {Record<string, unknown>} */ (raw);
    const url = typeof p.url === "string" ? p.url.trim() : "";
    const path = typeof p.path === "string" ? p.path.trim() : "";
    if (!url || !path || !path.startsWith(prefix) || path.includes("..")) continue;
    if (!/^https:\/\/firebasestorage\.googleapis\.com\//i.test(url)) continue;
    out.push({
      url: url.slice(0, 2048),
      path: path.slice(0, 1024),
      name:
        typeof p.name === "string" && p.name ? p.name.slice(0, 200) : "creative",
      contentType:
        typeof p.contentType === "string" && p.contentType
          ? p.contentType.slice(0, 120)
          : "image/jpeg",
      size:
        typeof p.size === "number" && Number.isFinite(p.size) && p.size >= 0
          ? Math.floor(p.size)
          : 0,
      uploadedAt:
        typeof p.uploadedAt === "string" && p.uploadedAt
          ? p.uploadedAt.slice(0, 64)
          : new Date().toISOString(),
    });
  }
  return out;
}
