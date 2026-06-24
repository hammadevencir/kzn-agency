import { isoFromFirestoreTimestamp } from "@/lib/admin/serialize-firestore";

function formatBalance(raw) {
  if (raw == null) return "—";
  let num = NaN;
  if (typeof raw === "number") {
    num = raw;
  } else if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.\-]/g, "").trim();
    if (cleaned) num = Number.parseFloat(cleaned);
  }
  if (!Number.isFinite(num)) return "—";
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function displayNameFromEmail(email) {
  if (!email || typeof email !== "string") return "User";
  return email.split("@")[0] || "User";
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} data
 */
export function mapTopUpAdminRow(id, data) {
  const created = isoFromFirestoreTimestamp(/** @type {*} */ (data.createdAt));
  const email = data.userEmail ? String(data.userEmail) : "—";
  const checkout =
    data.checkout && typeof data.checkout === "object"
      ? /** @type {Record<string, unknown>} */ (data.checkout)
      : {};
  const flow =
    data.flow && typeof data.flow === "object"
      ? /** @type {Record<string, unknown>} */ (data.flow)
      : {};
  const adId = data.adAccountId ? String(data.adAccountId) : "";
  const reqType =
    typeof data.requestType === "string" ? data.requestType : "";
  const isBalanceCreditRequest = reqType === "balance_credit_request";
  const isAdminAdjustment =
    data.kind === "admin_adjustment" || data.source === "admin_balance_update";
  const subLine = isAdminAdjustment
    ? "Admin balance adjustment (no payment received)"
    : isBalanceCreditRequest
      ? [
          String(flow.displayPlatform || flow.platformKey || "").trim(),
          "Free balance credit request",
        ]
          .filter(Boolean)
          .join(" · ") || "Balance credit request (free)"
    : [
        String(flow.displayPlatform || flow.platformKey || "").trim(),
        checkout.amount ? String(checkout.amount) : "",
      ]
        .filter(Boolean)
        .join(" · ");

  return {
    firestoreId: id,
    userId: typeof data.userId === "string" ? data.userId : "",
    id: id.length > 12 ? `${id.slice(0, 8)}…` : id,
    name: isAdminAdjustment ? "Admin" : displayNameFromEmail(email),
    email: isAdminAdjustment ? "—" : email,
    adAccountName: String(flow.displayPlatform || flow.platformKey || "Ad account"),
    adAccountId: adId ? `#${adId.slice(0, 8)}` : "—",
    adAccountFirestoreId: adId || "",
    dateRequested: formatDate(created),
    subscriptions: subLine || "—",
    currentBalance: formatBalance(data.adAccountBalanceSnapshot),
    topUpAmount: checkout.amount ? String(checkout.amount) : "—",
    platform: String(flow.displayPlatform || flow.platformKey || "—"),
    avatarUrl: typeof data.userPhotoURL === "string" ? data.userPhotoURL : null,
    status: data.status ? String(data.status) : "—",
    kind: isAdminAdjustment ? "admin_adjustment" : "user_request",
    rejectionReason: data.rejectionReason
      ? String(data.rejectionReason)
      : null,
    paymentNote:
      typeof data.paymentNote === "string" ? data.paymentNote : null,
    paymentProof: sanitizeProofForClient(data.paymentProof),
    requestType: reqType || null,
  };
}

/**
 * Normalize the `paymentProof` field persisted on a Firestore doc into the
 * shape consumed by admin/manager detail modals. Returns `null` when the
 * document has no proof (e.g. legacy records or admin_adjustment entries).
 * @param {unknown} raw
 */
function sanitizeProofForClient(raw) {
  if (!raw || typeof raw !== "object") return null;
  const p = /** @type {Record<string, unknown>} */ (raw);
  const url = typeof p.url === "string" ? p.url : "";
  if (!url) return null;
  return {
    url,
    path: typeof p.path === "string" ? p.path : "",
    name: typeof p.name === "string" ? p.name : "proof",
    contentType:
      typeof p.contentType === "string" ? p.contentType : "application/octet-stream",
    size: typeof p.size === "number" ? p.size : 0,
    uploadedAt: typeof p.uploadedAt === "string" ? p.uploadedAt : null,
  };
}
