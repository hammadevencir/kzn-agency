import { isoFromFirestoreTimestamp } from "@/lib/admin/serialize-firestore";

const REQUEST_LABELS = {
  bmId: "BM ID where we can share the ad-account",
  timezone: "Your preferred Timezone",
  website: "Your Website link",
  confirmHat: "Offer type confirmation",
  advertiseDetails: "What you advertise",
  supplierName: "Supplier / fulfillment company",
  previousProvider: "Previous ad account provider",
};

function displayNameFromEmail(email) {
  if (!email || typeof email !== "string") return "User";
  return email.split("@")[0] || "User";
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

/**
 * Build Q&A list for admin ad-account request sheet.
 * @param {Record<string, string>} request
 */
export function requestFieldsToQuestions(request) {
  if (!request || typeof request !== "object") return [];
  /** @type {{ text: string, answer: string }[]} */
  const out = [];
  for (const [key, value] of Object.entries(request)) {
    if (value === undefined || value === null || String(value).trim() === "") continue;
    const text = REQUEST_LABELS[key] || key;
    out.push({ text, answer: String(value) });
  }
  return out;
}

function asString(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

/**
 * Wire / checkout deposit row for admin ad-account request detail sheet.
 * Falls back to flow/pricingSnapshot when older records don't store `checkout`.
 * @param {Record<string, unknown>} data — Firestore ad-account document
 * @param {string | null} createdIso — ISO createdAt
 * @returns {{ id: string, label: string, subscriptionName: string, amount: string, originalAmount: string, discountMessage: string, dateSubmitted: string, method: string, status: string, note: string }[]}
 */
export function adAccountDepositRowsForAdmin(data, createdIso) {
  const checkout =
    data.checkout && typeof data.checkout === "object"
      ? /** @type {Record<string, unknown>} */ (data.checkout)
      : {};
  const flow =
    data.flow && typeof data.flow === "object"
      ? /** @type {Record<string, unknown>} */ (data.flow)
      : {};
  const pricing =
    flow.pricingSnapshot && typeof flow.pricingSnapshot === "object"
      ? /** @type {Record<string, unknown>} */ (flow.pricingSnapshot)
      : {};

  const checkoutAmount = asString(checkout.amount);
  const pricingAmount = asString(pricing.monthlyFee);
  const amount = checkoutAmount || pricingAmount;

  const planLabel =
    asString(flow.planName) ||
    [asString(flow.requestTypeLabel), asString(flow.displayPlatform)]
      .filter(Boolean)
      .join(" ");

  const subscriptionName = asString(checkout.subscriptionName) || planLabel;
  const originalAmount = asString(checkout.originalAmount);
  const discountMessage = asString(checkout.discountMessage);

  if (!amount && !subscriptionName) {
    return [];
  }

  const paidIso = isoFromFirestoreTimestamp(
    /** @type {*} */ (data.paymentSubmittedAt)
  );
  const dateSubmitted =
    (paidIso && formatDate(paidIso)) ||
    (createdIso && formatDate(createdIso)) ||
    "—";

  const method = data.paymentMethod
    ? asString(data.paymentMethod).replace(/_/g, " ")
    : "Wire transfer (manual)";

  return [
    {
      id: "checkout-deposit",
      label: subscriptionName || "Deposit",
      subscriptionName: subscriptionName || "—",
      amount: amount || "—",
      originalAmount,
      discountMessage,
      dateSubmitted,
      method,
      status: data.status
        ? asString(data.status).replace(/_/g, " ")
        : "—",
      note: data.paymentNote ? asString(data.paymentNote) : "",
    },
  ];
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} data
 */
export function mapSubscriptionAdminRow(id, data) {
  const created = isoFromFirestoreTimestamp(/** @type {*} */ (data.createdAt));
  const email = data.userEmail ? String(data.userEmail) : "—";
  const topCheckout =
    data.checkout && typeof data.checkout === "object" ? data.checkout : {};
  const flow =
    data.flow && typeof data.flow === "object"
      ? /** @type {Record<string, unknown>} */ (data.flow)
      : {};
  const pendingUpgrade =
    data.pendingUpgrade && typeof data.pendingUpgrade === "object"
      ? /** @type {Record<string, unknown>} */ (data.pendingUpgrade)
      : null;
  const isUpgradeRequest =
    data.pendingUpgradeReview === true && pendingUpgrade != null;

  let checkout;
  if (isUpgradeRequest && pendingUpgrade != null) {
    checkout =
      pendingUpgrade.checkout &&
      typeof pendingUpgrade.checkout === "object"
        ? /** @type {Record<string, unknown>} */ (pendingUpgrade.checkout)
        : {};
  } else {
    checkout = /** @type {Record<string, unknown>} */ (topCheckout);
  }

  const puFlow =
    pendingUpgrade && typeof pendingUpgrade.flow === "object"
      ? /** @type {Record<string, unknown>} */ (pendingUpgrade.flow)
      : {};

  const subLine =
    String(checkout.subscriptionName || "") ||
    String(
      puFlow.displayPlatform ||
        flow.displayPlatform ||
        data.platformId ||
        "—"
    );

  const upgradeSubmitted = isoFromFirestoreTimestamp(
    /** @type {*} */ (pendingUpgrade?.paymentSubmittedAt)
  );
  const dateSubmitted =
    isUpgradeRequest && upgradeSubmitted
      ? formatDate(upgradeSubmitted)
      : formatDate(created);

  const proofSource = isUpgradeRequest ? pendingUpgrade : data;

  return {
    firestoreId: id,
    id: id.length > 12 ? `${id.slice(0, 8)}…` : id,
    userId: data.userId ? String(data.userId).slice(0, 10) : "—",
    userName: displayNameFromEmail(email),
    email,
    dateSubmitted,
    subscriptions: subLine,
    subscription: subLine,
    requestKind: isUpgradeRequest ? "upgrade" : "new",
    currentBalance: "—",
    amountPaid: checkout.amount ? String(checkout.amount) : "—",
    status: data.status ? String(data.status) : "—",
    rejectionReason: data.rejectionReason
      ? String(data.rejectionReason)
      : null,
    paymentProof: sanitizeProofForClient(proofSource?.paymentProof),
  };
}

/**
 * Normalize `paymentProof` persisted on a Firestore doc into the shape
 * consumed by admin/manager detail modals. Returns `null` for legacy records
 * that don't have a proof yet.
 * @param {unknown} raw
 */
export function sanitizeProofForClient(raw) {
  if (!raw || typeof raw !== "object") return null;
  const p = /** @type {Record<string, unknown>} */ (raw);
  const url = typeof p.url === "string" ? p.url : "";
  if (!url) return null;
  return {
    url,
    path: typeof p.path === "string" ? p.path : "",
    name: typeof p.name === "string" ? p.name : "proof",
    contentType:
      typeof p.contentType === "string"
        ? p.contentType
        : "application/octet-stream",
    size: typeof p.size === "number" ? p.size : 0,
    uploadedAt: typeof p.uploadedAt === "string" ? p.uploadedAt : null,
  };
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} data
 * @param {{
 *   existingAdByUser?: Map<string, number>,
 *   subsByUser?: Map<string, number>,
 * }} [counts]
 */
export function mapAdAccountNewRequestRow(id, data, counts) {
  const created = isoFromFirestoreTimestamp(/** @type {*} */ (data.createdAt));
  const email = data.userEmail ? String(data.userEmail) : "—";
  const flow = data.flow && typeof data.flow === "object" ? data.flow : {};
  const plan = [flow.planName, flow.planTier].filter(Boolean).join(" · ");
  const subscriptionLabel =
    plan ||
    `${flow.requestTypeLabel || ""} ${flow.displayPlatform || ""}`.trim() ||
    "—";
  const uid = data.userId ? String(data.userId) : "";
  const existingAd =
    uid && counts?.existingAdByUser
      ? counts.existingAdByUser.get(uid) ?? 0
      : 0;
  const totalSubs =
    uid && counts?.subsByUser ? counts.subsByUser.get(uid) ?? 0 : 0;
  return {
    firestoreId: id,
    id: id.length > 12 ? `${id.slice(0, 8)}…` : id,
    name: displayNameFromEmail(email),
    email,
    platform: String(flow.displayPlatform || flow.platformKey || "—"),
    subscription: subscriptionLabel,
    existingAdAccounts: String(existingAd).padStart(2, "0"),
    totalSubscriptions: String(totalSubs).padStart(2, "0"),
    dateRequested: formatDate(created),
    avatarUrl: "/avatar.jpg",
    status: data.status,
    adminDetail: {
      id,
      name: displayNameFromEmail(email),
      email,
      date: formatDate(created),
      subscription: subscriptionLabel,
      platforms: String(flow.displayPlatform || "—"),
      avatarUrl: "/avatar.jpg",
      questions: requestFieldsToQuestions(
        /** @type {Record<string, string>} */ (data.request || {})
      ),
      deposits: adAccountDepositRowsForAdmin(data, created),
      paymentProof: sanitizeProofForClient(data.paymentProof),
    },
  };
}

/**
 * Build a transaction-style deposit list for an approved ad account.
 * Includes the initial checkout deposit plus any approved top-ups.
 * @param {Record<string, unknown>} data — Firestore ad-account document
 * @param {string | null} createdIso — ISO createdAt of the ad-account
 * @param {import("firebase-admin/firestore").QueryDocumentSnapshot[]} [topUpDocs]
 */
export function adAccountApprovedDeposits(data, createdIso, topUpDocs = []) {
  /** @type {{ id: string, label: string, amount: string, dateSubmitted: string, method: string, status: string }[]} */
  const rows = [];

  const initial = adAccountDepositRowsForAdmin(data, createdIso);
  if (initial.length > 0) {
    rows.push({
      id: initial[0].id,
      label: initial[0].label,
      amount: initial[0].amount,
      dateSubmitted: initial[0].dateSubmitted,
      method: initial[0].method,
      status: initial[0].status,
    });
  }

  for (const doc of topUpDocs) {
    const td = doc.data();
    const status = asString(td.status);
    if (status !== "approved") continue;
    const checkout =
      td.checkout && typeof td.checkout === "object" ? td.checkout : {};
    const amount = asString(checkout.amount);
    const paidIso = isoFromFirestoreTimestamp(
      /** @type {*} */ (td.reviewedAt || td.paymentSubmittedAt || td.createdAt)
    );
    rows.push({
      id: `topup-${doc.id}`,
      label: "Top-up",
      amount: amount || "—",
      dateSubmitted: (paidIso && formatDate(paidIso)) || "—",
      method: td.paymentMethod
        ? asString(td.paymentMethod).replace(/_/g, " ")
        : "Wire transfer (manual)",
      status: status.replace(/_/g, " "),
    });
  }

  return rows;
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} data
 * @param {import("firebase-admin/firestore").QueryDocumentSnapshot[]} [topUpDocs]
 */
export function mapAdAccountApprovedRow(id, data, topUpDocs = []) {
  const email = data.userEmail ? String(data.userEmail) : "—";
  const flow = data.flow && typeof data.flow === "object" ? data.flow : {};
  const created = isoFromFirestoreTimestamp(/** @type {*} */ (data.createdAt));
  const updated = isoFromFirestoreTimestamp(
    /** @type {*} */ (data.lastTopUpAt || data.updatedAt)
  );
  const { numeric, display } = normalizeBalance(data.currentBalance);
  const adAccountName = String(
    flow.planName || checkoutPlanLabel(flow) || "Ad account"
  );
  const subscriptionLabel =
    [flow.requestTypeLabel, flow.planTier].filter(Boolean).join(" ") || "—";
  return {
    firestoreId: id,
    id,
    userName: displayNameFromEmail(email),
    email,
    adAccountName,
    accountId: `#${id.slice(0, 8)}`,
    adAccountId: `#${id.slice(0, 8)}`,
    currentBalance: display,
    currentBalanceNumeric: numeric,
    balanceLastUpdated: formatDate(updated),
    platform: String(flow.displayPlatform || "—"),
    subscription: subscriptionLabel,
    avatarUrl: typeof data.userPhotoURL === "string" ? data.userPhotoURL : null,
    deposits: adAccountApprovedDeposits(data, created, topUpDocs),
  };
}

/**
 * Normalize any stored balance value into a number + display string.
 * Accepts numbers, numeric strings, or legacy "$5000" style strings.
 * @param {unknown} value
 * @returns {{ numeric: number | null, display: string }}
 */
function normalizeBalance(value) {
  if (value == null) return { numeric: null, display: "—" };
  let num = NaN;
  if (typeof value === "number") {
    num = value;
  } else if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.\-]/g, "").trim();
    if (cleaned) num = Number.parseFloat(cleaned);
  }
  if (!Number.isFinite(num)) return { numeric: null, display: "—" };
  const display = `$${num.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
  return { numeric: num, display };
}

function checkoutPlanLabel(flow) {
  const c = flow?.pricingSnapshot;
  if (c && typeof c === "object" && c.monthlyFee) return String(c.monthlyFee);
  return "";
}
