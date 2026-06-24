import { isSubscriptionActive } from "@/lib/subscriptions/expiry";

/** @param {Record<string, unknown>} d */
function isMetaDoc(d) {
  const top =
    typeof d.platformId === "string" ? d.platformId.toLowerCase() : "";
  if (top === "meta") return true;
  const flow = d.flow && typeof d.flow === "object" ? d.flow : {};
  return (
    typeof flow.platformKey === "string" &&
    flow.platformKey.toLowerCase() === "meta"
  );
}

/**
 * Category for the user's active Meta platform subscription (for routing / UX).
 * @param {Array<Record<string, unknown>>} subscriptionDocs
 * @returns {'vip' | 'white_hat' | null}
 */
export function getActiveMetaAccountCategory(subscriptionDocs) {
  const activeMeta = subscriptionDocs.find(
    (d) => isMetaDoc(d) && isSubscriptionActive(d)
  );
  if (!activeMeta) return null;
  const flow =
    activeMeta.flow && typeof activeMeta.flow === "object"
      ? activeMeta.flow
      : {};
  const cat = flow.accountCategory;
  if (cat === "vip" || cat === "white_hat") return cat;
  const rtl =
    typeof flow.requestTypeLabel === "string"
      ? flow.requestTypeLabel.trim()
      : "";
  if (rtl === "VIP") return "vip";
  if (rtl === "White Hat" || rtl === "White-hat") return "white_hat";
  return null;
}
