/**
 * @param {import("firebase-admin/firestore").Timestamp | null | undefined} ts
 */
function timestampToIso(ts) {
  if (ts == null) return null;
  if (typeof ts.toMillis === "function") {
    try {
      return ts.toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * @param {import("firebase-admin/firestore").Timestamp | null | undefined} ts
 */
function timestampMs(ts) {
  if (ts == null) return 0;
  if (typeof ts.toMillis === "function") {
    try {
      return ts.toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

/** @param {string | undefined} status */
export function invoiceStatusLabel(status) {
  switch (status) {
    case "pending_payment":
      return "Awaiting payment";
    case "payment_submitted":
      return "Pending review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status ? String(status).replace(/_/g, " ") : "—";
  }
}

/** @param {Record<string, unknown> | undefined} flow */
function flowPlatform(flow) {
  if (!flow || typeof flow !== "object") return "—";
  const display = flow.displayPlatform ?? flow.platformKey;
  return display != null && String(display).trim() !== ""
    ? String(display).trim()
    : "—";
}

/**
 * Label for the Subscriptions invoice column (matches product design, e.g. "White Hat - SILVER").
 * @param {Record<string, unknown>} co — checkout
 * @param {Record<string, unknown> | undefined} flow
 */
function subscriptionLineForInvoice(co, flow) {
  const name = String(co.subscriptionName ?? "").trim();
  const f = flow && typeof flow === "object" ? flow : {};
  const wh = name.match(/Meta\s*[-–]\s*White Hat\s*\(\s*([^)]+?)\s*\)/i);
  if (wh) return `White Hat - ${wh[1].trim()}`;
  const vip = name.match(
    /Meta\s*[-–]\s*VIP Ad Accounts\s*\(\s*([^)]+?)\s*\)/i
  );
  if (vip) return `VIP - ${vip[1].trim()}`;
  if (typeof f.planTier === "string" && f.planTier.trim()) {
    const cat = f.accountCategory;
    if (cat === "white_hat") return `White Hat - ${f.planTier.trim()}`;
    if (cat === "vip") return `VIP - ${f.planTier.trim()}`;
  }
  if (name) return name.replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
  return "Platform subscription";
}

/**
 * @param {unknown} checkout
 */
function hasCheckout(checkout) {
  if (!checkout || typeof checkout !== "object") return false;
  const c = /** @type {Record<string, unknown>} */ (checkout);
  const amount = c.amount != null ? String(c.amount).trim() : "";
  const name =
    c.subscriptionName != null ? String(c.subscriptionName).trim() : "";
  return Boolean(amount || name);
}

/** Design: #4675 (4-digit display from stable hash of ad account id) */
function shortDisplayAccountId(adAccountDocId) {
  if (!adAccountDocId || typeof adAccountDocId !== "string") return "—";
  const hex = adAccountDocId.replace(/[^a-f0-9]/gi, "");
  if (hex.length < 2) {
    return `#${adAccountDocId.slice(0, 4)}`;
  }
  const n = parseInt(hex.slice(0, 8), 16) % 10000;
  return `#${String(n).padStart(4, "0")}`;
}

/**
 * @param {string} adId
 * @param {Record<string, unknown> | undefined} adData
 */
function topUpAdAccountDisplayName(adId) {
  if (!adId) return "—";
  const n =
    (parseInt(adId.replace(/[^a-f0-9]/gi, "").slice(0, 8), 16) % 998) + 1;
  return `Ad-Account-${n}`;
}

/**
 * @param {{
 *   subscriptionDocs: import("firebase-admin/firestore").QueryDocumentSnapshot[],
 *   adAccountDocs: import("firebase-admin/firestore").QueryDocumentSnapshot[],
 *   topUpDocs: import("firebase-admin/firestore").QueryDocumentSnapshot[],
 * }} params
 */
export function buildUserInvoiceList(params) {
  const { subscriptionDocs, adAccountDocs, topUpDocs } = params;
  /** @type {Array<{
   *   kind: string,
   *   firestoreId: string,
   *   invoiceId: string,
   *   typeLabel: string,
   *   description: string,
   *   platform: string,
   *   amount: string,
   *   status: string,
   *   statusLabel: string,
   *   dateIso: string | null,
 *   accountRef: string | null,
 *   subscriptionLine: string | null,
 *   topUpAccountIdDisplay: string | null,
 *   topUpAccountName: string | null,
 *   topUpDateCreatedIso: string | null,
 *   userId: string,
 * }>} */
  const items = [];

  const adAccountById = new Map();
  for (const d of adAccountDocs) {
    adAccountById.set(d.id, d.data());
  }

  for (const d of subscriptionDocs) {
    const data = d.data();
    if (!hasCheckout(data.checkout)) continue;
    const payMs = timestampMs(data.paymentSubmittedAt);
    const creMs = timestampMs(data.createdAt);
    const sortMs = payMs > 0 ? payMs : creMs;
    const co = /** @type {Record<string, unknown>} */ (data.checkout);
    const flow =
      data.flow && typeof data.flow === "object"
        ? /** @type {Record<string, unknown>} */ (data.flow)
        : undefined;
    items.push({
      kind: "subscription",
      userId: typeof data.userId === "string" ? data.userId : "",
      firestoreId: d.id,
      invoiceId: `#${d.id.slice(0, 8)}`,
      typeLabel: "Subscription",
      description:
        String(co.subscriptionName ?? "").trim() || "Platform subscription",
      platform: flowPlatform(flow),
      amount: String(co.amount ?? "—").trim() || "—",
      status: String(data.status ?? ""),
      statusLabel: invoiceStatusLabel(
        typeof data.status === "string" ? data.status : undefined
      ),
      dateIso:
        timestampToIso(data.paymentSubmittedAt) ??
        timestampToIso(data.createdAt),
      accountRef: null,
      subscriptionLine: subscriptionLineForInvoice(
        /** @type {Record<string, unknown>} */ (co),
        flow
      ),
      topUpAccountIdDisplay: null,
      topUpAccountName: null,
      topUpDateCreatedIso: null,
      sortMs,
    });
  }

  for (const d of adAccountDocs) {
    const data = d.data();
    if (!hasCheckout(data.checkout)) continue;
    const payMs = timestampMs(data.paymentSubmittedAt);
    const creMs = timestampMs(data.createdAt);
    const sortMs = payMs > 0 ? payMs : creMs;
    const co = /** @type {Record<string, unknown>} */ (data.checkout);
    const flow =
      data.flow && typeof data.flow === "object"
        ? /** @type {Record<string, unknown>} */ (data.flow)
        : undefined;
    items.push({
      kind: "ad_account",
      userId: typeof data.userId === "string" ? data.userId : "",
      firestoreId: d.id,
      invoiceId: `#${d.id.slice(0, 8)}`,
      typeLabel: "Ad account",
      description:
        String(co.subscriptionName ?? "").trim() || "Ad account request",
      platform: flowPlatform(flow),
      amount: String(co.amount ?? "—").trim() || "—",
      status: String(data.status ?? ""),
      statusLabel: invoiceStatusLabel(
        typeof data.status === "string" ? data.status : undefined
      ),
      dateIso:
        timestampToIso(data.paymentSubmittedAt) ??
        timestampToIso(data.createdAt),
      accountRef: null,
      subscriptionLine: null,
      topUpAccountIdDisplay: null,
      topUpAccountName: null,
      topUpDateCreatedIso: null,
      sortMs,
    });
  }

  for (const d of topUpDocs) {
    const data = d.data();
    if (!hasCheckout(data.checkout)) continue;
    const payMs = timestampMs(data.paymentSubmittedAt);
    const creMs = timestampMs(data.createdAt);
    const sortMs = payMs > 0 ? payMs : creMs;
    const co = /** @type {Record<string, unknown>} */ (data.checkout);
    const flow =
      data.flow && typeof data.flow === "object"
        ? /** @type {Record<string, unknown>} */ (data.flow)
        : undefined;
    const adId =
      typeof data.adAccountId === "string" ? data.adAccountId : "";
    const adData = adId ? adAccountById.get(adId) : undefined;
    const flowForPlatform =
      flow && typeof flow === "object"
        ? flow
        : adData && typeof adData === "object" && adData.flow
          ? /** @type {Record<string, unknown>} */ (adData.flow)
          : undefined;
    const dateCreatedRaw = timestampToIso(data.createdAt);
    items.push({
      kind: "top_up",
      userId: typeof data.userId === "string" ? data.userId : "",
      firestoreId: d.id,
      invoiceId: `#${d.id.slice(0, 8)}`,
      typeLabel: "Top-up",
      description:
        String(co.subscriptionName ?? "").trim() || "Ad account top-up",
      platform: flowPlatform(flowForPlatform),
      amount: String(co.amount ?? "—").trim() || "—",
      status: String(data.status ?? ""),
      statusLabel: invoiceStatusLabel(
        typeof data.status === "string" ? data.status : undefined
      ),
      dateIso:
        timestampToIso(data.paymentSubmittedAt) ??
        timestampToIso(data.createdAt),
      accountRef: adId ? `#${adId.slice(0, 8)}` : null,
      subscriptionLine: null,
      topUpAccountIdDisplay: adId ? shortDisplayAccountId(adId) : "—",
      topUpAccountName: topUpAdAccountDisplayName(adId),
      topUpDateCreatedIso: dateCreatedRaw,
      sortMs,
    });
  }

  items.sort((a, b) => b.sortMs - a.sortMs);
  return items.map(({ sortMs, ...rest }) => rest);
}
