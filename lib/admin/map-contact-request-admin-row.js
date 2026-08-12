import { isoFromFirestoreTimestamp } from "@/lib/admin/serialize-firestore";
import {
  CONTACT_REQUEST_TYPE_OPTIONS,
  CONTACT_AD_ACCOUNT_PLATFORM_OPTIONS,
  CONTACT_GENDER_OPTIONS,
} from "@/lib/contact-requests/constants";

const labelFor = (options, value) => options.find((o) => o.value === value)?.label || "—";

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

  const requestType = data.requestType ? String(data.requestType) : "";
  const platform = data.platform ? String(data.platform) : "";
  const gender = data.gender ? String(data.gender) : "";

  return {
    firestoreId: id,
    id: id.length > 12 ? `${id.slice(0, 8)}…` : id,
    name: data.name ? String(data.name) : "—",
    email: data.email ? String(data.email) : "",
    phone: data.phone ? String(data.phone) : "—",
    country: data.country ? String(data.country) : "—",
    gender: gender ? labelFor(CONTACT_GENDER_OPTIONS, gender) : "—",
    discordOrTelegram: data.discordOrTelegram ? String(data.discordOrTelegram) : "—",
    requestType: requestType ? labelFor(CONTACT_REQUEST_TYPE_OPTIONS, requestType) : "—",
    platform: platform ? labelFor(CONTACT_AD_ACCOUNT_PLATFORM_OPTIONS, platform) : "—",
    message: data.message ? String(data.message) : "",
    dateCreated: formatDate(created),
    status: data.status ? String(data.status) : "new",
  };
}
