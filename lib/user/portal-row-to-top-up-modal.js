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
    lastTopup: String(row.lastTopup || "—"),
    dateCreated: String(row.dateCreated || "—"),
    balance,
    status: String(row.status || ""),
    topUpInReview: row.topUpInReview === true,
  };
}
