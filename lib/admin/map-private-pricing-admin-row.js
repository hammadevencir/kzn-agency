import { isoFromFirestoreTimestamp } from "@/lib/admin/serialize-firestore";
import { PRIVATE_PRICING_STATUS } from "@/lib/private-pricing/constants";

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

const s = (v) => (v ? String(v) : "");

/**
 * @param {string} id
 * @param {Record<string, any>} data
 */
export function mapPrivatePricingAdminRow(id, data) {
  const created = isoFromFirestoreTimestamp(data.createdAt);
  const files = Array.isArray(data.files)
    ? data.files
        .filter((f) => f && typeof f === "object" && typeof f.url === "string")
        .map((f) => ({
          name: s(f.name) || "file",
          url: f.url,
          contentType: s(f.contentType),
          size: typeof f.size === "number" ? f.size : 0,
        }))
    : [];

  return {
    firestoreId: id,
    id: id.length > 12 ? `${id.slice(0, 8)}…` : id,
    name: s(data.fullName) || "—",
    email: s(data.email),
    phone: s(data.phone) || "—",
    company: s(data.company) || "—",
    website: s(data.website),
    niche: s(data.niche) || "—",
    currentSpend: s(data.currentSpend) || "—",
    expectedSpend: s(data.expectedSpend) || "—",
    message: s(data.message),
    files,
    fileCount: files.length,
    createdAt: created,
    dateCreated: formatDate(created),
    status: s(data.status) || PRIVATE_PRICING_STATUS.NEW,
  };
}
