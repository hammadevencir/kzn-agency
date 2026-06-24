import { AD_ACCOUNT_STATUS } from "@/lib/ad-accounts/constants";

/**
 * @param {{ id: string, status?: string, flow?: { platformKey?: string, displayPlatform?: string } }[]} adDocs
 * @returns {Record<string, number>}
 */
export function countApprovedAdAccountsByPlatform(adDocs) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const d of adDocs) {
    if (!d || d.status !== AD_ACCOUNT_STATUS.APPROVED) continue;
    const flow = d.flow && typeof d.flow === "object" ? d.flow : {};
    const key =
      typeof flow.platformKey === "string" && flow.platformKey
        ? flow.platformKey
        : "";
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}
