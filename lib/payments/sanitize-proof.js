/**
 * Shape received from the client after uploading the payment-proof file to
 * Firebase Storage (see `lib/user/upload-payment-proof.js`):
 *   { url, path, name, contentType, size, uploadedAt }
 *
 * We accept only string / number fields with reasonable length caps so that a
 * malicious client can't pollute the Firestore document with arbitrary data.
 *
 * @param {unknown} input
 * @returns {null | {
 *   url: string,
 *   path: string,
 *   name: string,
 *   contentType: string,
 *   size: number,
 *   uploadedAt: string,
 * }}
 */
export function sanitizePaymentProof(input) {
  if (!input || typeof input !== "object") return null;
  const p = /** @type {Record<string, unknown>} */ (input);
  const url = typeof p.url === "string" ? p.url.trim() : "";
  const path = typeof p.path === "string" ? p.path.trim() : "";
  if (!url || !path) return null;
  if (!/^https?:\/\//i.test(url)) return null;

  const name =
    typeof p.name === "string" && p.name ? p.name.slice(0, 200) : "proof";
  const contentType =
    typeof p.contentType === "string" && p.contentType
      ? p.contentType.slice(0, 120)
      : "application/octet-stream";
  const size =
    typeof p.size === "number" && Number.isFinite(p.size) && p.size >= 0
      ? Math.floor(p.size)
      : 0;
  const uploadedAt =
    typeof p.uploadedAt === "string" && p.uploadedAt
      ? p.uploadedAt.slice(0, 64)
      : new Date().toISOString();

  return {
    url: url.slice(0, 2048),
    path: path.slice(0, 1024),
    name,
    contentType,
    size,
    uploadedAt,
  };
}
