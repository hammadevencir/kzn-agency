/**
 * Shape expected by TopUpUploadModal `data` prop.
 * @param {Record<string, unknown>} row — output of mapAdAccountPortalRow (or compatible top-ups row)
 */
export function portalRowToTopUpModalData(row) {
  const bal = row.balance;
  const balance =
    bal != null && String(bal).trim() !== "" ? String(bal) : "—";

  return {
    firestoreId: String(row.firestoreId),
    accountId: String(row.id),
    platform: String(row.platform || "—"),
    platformKey: String(row.platformKey || ""),
    planLabel:
      typeof row.planLabel === "string" && row.planLabel.trim()
        ? row.planLabel.trim()
        : null,
    topUpFee: String(row.topUpFee || ""),
    lastTopup: String(row.lastTopup || "—"),
    dateCreated: String(row.dateCreated || "—"),
    balance,
    status: String(row.status || ""),
    topUpInReview: row.topUpInReview === true,
    topUpCurrency: row.topUpCurrency === "EUR" ? "EUR" : "USD",
    region: typeof row.region === "string" ? row.region : null,
  };
}
