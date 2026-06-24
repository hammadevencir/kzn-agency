/**
 * @param {unknown} raw
 * @param {string} fallback
 */
function formatBalance(raw, fallback) {
  if (raw == null) return fallback;
  let num = NaN;
  if (typeof raw === "number") {
    num = raw;
  } else if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.\-]/g, "").trim();
    if (cleaned) num = Number.parseFloat(cleaned);
  }
  if (!Number.isFinite(num)) return fallback;
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** @param {*} ts */
function formatFsDate(ts) {
  if (!ts) return "—";
  try {
    if (typeof ts === "string") {
      const ms = Date.parse(ts);
      if (Number.isNaN(ms)) return "—";
      return new Date(ms).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    const ms = typeof ts.toMillis === "function" ? ts.toMillis() : null;
    if (ms == null) return "—";
    return new Date(ms).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * @param {string} docId
 * @param {Record<string, unknown>} data
 * @param {boolean} hasPendingTopUp
 */
export function mapAdAccountForTopUpsTable(docId, data, hasPendingTopUp) {
  const flow =
    data.flow && typeof data.flow === "object"
      ? /** @type {Record<string, unknown>} */ (data.flow)
      : {};
  const platform =
    String(flow.displayPlatform || flow.platformKey || "—") || "—";
  const platformKey =
    typeof flow.platformKey === "string" ? flow.platformKey.toLowerCase() : "";

  const balance = formatBalance(data.currentBalance, "—");

  return {
    firestoreId: docId,
    accountId: `#${docId.slice(0, 8)}`,
    platform,
    platformKey,
    dateCreated: formatFsDate(data.createdAt),
    lastTopup: formatFsDate(data.lastTopUpAt),
    balance,
    status: hasPendingTopUp ? "Top-up pending" : "Active",
    topUpInReview: hasPendingTopUp,
    actions: "top-up",
  };
}
