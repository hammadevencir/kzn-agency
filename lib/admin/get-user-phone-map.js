/**
 * Batch-fetch `phone` from the `users` collection for a list of user ids.
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {(string | null | undefined)[]} userIds
 * @returns {Promise<Map<string, string>>}
 */
export async function getUserPhoneMap(db, userIds) {
  const uniqueIds = Array.from(
    new Set(userIds.filter((id) => typeof id === "string" && id))
  );
  if (uniqueIds.length === 0) return new Map();

  const refs = uniqueIds.map((id) => db.collection("users").doc(id));
  const snaps = await db.getAll(...refs);

  const map = new Map();
  for (const snap of snaps) {
    if (!snap.exists) continue;
    const phone = snap.data()?.phone;
    if (typeof phone === "string" && phone) map.set(snap.id, phone);
  }
  return map;
}
