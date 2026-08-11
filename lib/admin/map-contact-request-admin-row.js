import { isoFromFirestoreTimestamp } from "@/lib/admin/serialize-firestore";

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
 * @param {string} id
 * @param {Record<string, unknown>} data
 */
export function mapContactRequestAdminRow(id, data) {
  const created = isoFromFirestoreTimestamp(/** @type {*} */ (data.createdAt));

  return {
    firestoreId: id,
    id: id.length > 12 ? `${id.slice(0, 8)}…` : id,
    name: data.name ? String(data.name) : "—",
    email: data.email ? String(data.email) : "—",
    phone: data.phone ? String(data.phone) : "—",
    message: data.message ? String(data.message) : "",
    dateCreated: formatDate(created),
    status: data.status ? String(data.status) : "new",
  };
}
