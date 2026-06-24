/**
 * @param {import("firebase-admin/firestore").Timestamp | undefined | null} ts
 * @returns {string | null}
 */
export function isoFromFirestoreTimestamp(ts) {
  if (!ts || typeof ts.toDate !== "function") return null;
  try {
    return ts.toDate().toISOString();
  } catch {
    return null;
  }
}
