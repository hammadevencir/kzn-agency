import { isoFromFirestoreTimestamp } from "@/lib/admin/serialize-firestore";
import {
  AFFILIATE_GENDER_OPTIONS,
  COMMUNITY_FOCUS_OPTIONS,
  COMMUNITY_SIZE_OPTIONS,
  PROGRAM_PLATFORM_OPTIONS,
  EXPECTED_CLIENTS_OPTIONS,
} from "@/lib/affiliate-requests/constants";

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
export function mapAffiliateRequestAdminRow(id, data) {
  const created = isoFromFirestoreTimestamp(/** @type {*} */ (data.createdAt));

  const communityFocus = data.communityFocus ? String(data.communityFocus) : "";
  const communityFocusLabel =
    communityFocus === "other" && data.communityFocusOther
      ? String(data.communityFocusOther)
      : labelFor(COMMUNITY_FOCUS_OPTIONS, communityFocus);

  const platforms = Array.isArray(data.platforms) ? data.platforms.map(String) : [];
  const platformLabels = platforms.map((p) =>
    p === "other" && data.platformOther ? String(data.platformOther) : labelFor(PROGRAM_PLATFORM_OPTIONS, p)
  );

  return {
    firestoreId: id,
    id: id.length > 12 ? `${id.slice(0, 8)}…` : id,
    name: data.name ? String(data.name) : "—",
    phone: data.phone ? String(data.phone) : "—",
    country: data.country ? String(data.country) : "—",
    gender: data.gender ? labelFor(AFFILIATE_GENDER_OPTIONS, String(data.gender)) : "—",
    discordOrTelegram: data.discordOrTelegram ? String(data.discordOrTelegram) : "—",
    communityFocus: communityFocusLabel || "—",
    communitySize: data.communitySize ? labelFor(COMMUNITY_SIZE_OPTIONS, String(data.communitySize)) : "—",
    platforms: platformLabels.length > 0 ? platformLabels.join(", ") : "—",
    expectedClients: data.expectedClients ? labelFor(EXPECTED_CLIENTS_OPTIONS, String(data.expectedClients)) : "—",
    dateCreated: formatDate(created),
    status: data.status ? String(data.status) : "new",
  };
}
