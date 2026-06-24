import { AD_ACCOUNT_STATUS } from "@/lib/ad-accounts/constants";
import { SUBSCRIPTION_STATUS } from "@/lib/subscriptions/constants";

/** @param {unknown} ts */
export function formatJoinedDate(ts) {
  if (ts == null) return "—";
  try {
    const ms =
      typeof ts.toMillis === "function"
        ? ts.toMillis()
        : typeof ts === "string"
          ? Date.parse(ts)
          : 0;
    if (!ms) return "—";
    return new Date(ms).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

const PLATFORM_ICONS = {
  meta: "/platforms/meta.svg",
  facebook: "/platforms/meta.svg",
  tiktok: "/platforms/tiktok.svg",
  google: "/platforms/google.svg",
  taboola: "/platforms/taboola.svg",
  pinterest: "/platforms/pinterest.svg",
  snapchat: "/platforms/snapchat.svg",
  twitter: "/platforms/x.svg",
  x: "/platforms/x.svg",
};

const PLATFORM_LABELS = {
  meta: "Meta",
  facebook: "Meta",
  tiktok: "TikTok",
  google: "Google",
  taboola: "Taboola",
  pinterest: "Pinterest",
  snapchat: "Snapchat",
  twitter: "X",
  x: "X",
};

export function normalizePlatformKey(raw) {
  const s = String(raw || "")
    .trim()
    .toLowerCase();
  if (!s) return "unknown";
  if (PLATFORM_ICONS[s]) return s;
  const aliases = { facebook: "meta" };
  return aliases[s] || s.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

/** @param {string} key */
export function platformIconPath(key) {
  const k = normalizePlatformKey(key);
  return PLATFORM_ICONS[k] || "/platforms/meta.svg";
}

/** @param {string} key */
export function platformLabel(key) {
  const k = normalizePlatformKey(key);
  return PLATFORM_LABELS[k] || (key ? String(key) : "Platform");
}

/** @param {string | undefined} status */
export function adAccountStatusLabel(status) {
  switch (status) {
    case AD_ACCOUNT_STATUS.APPROVED:
      return "Active";
    case AD_ACCOUNT_STATUS.PENDING_PAYMENT:
      return "Pending payment";
    case AD_ACCOUNT_STATUS.PAYMENT_SUBMITTED:
      return "Pending review";
    case AD_ACCOUNT_STATUS.REJECTED:
      return "Rejected";
    default:
      return status ? String(status).replace(/_/g, " ") : "—";
  }
}

/**
 * @param {Record<string, unknown>} data
 * @returns {"active"|"pending"|"declined"|"expired"}
 */
export function subscriptionUiStatus(data) {
  const status = typeof data.status === "string" ? data.status : "";
  if (status === SUBSCRIPTION_STATUS.REJECTED) return "declined";
  if (
    status === SUBSCRIPTION_STATUS.PENDING_PAYMENT ||
    status === SUBSCRIPTION_STATUS.PAYMENT_SUBMITTED
  ) {
    return "pending";
  }
  const exp = data.expiresAt ?? data.subscriptionExpiresAt;
  if (exp != null && typeof exp.toMillis === "function") {
    try {
      if (exp.toMillis() < Date.now()) return "expired";
    } catch {
      /* ignore */
    }
  }
  if (status === SUBSCRIPTION_STATUS.APPROVED) return "active";
  return "pending";
}

export function subscriptionStatusDisplay(data) {
  const kind = subscriptionUiStatus(data);
  if (kind === "expired") return { kind, label: "Expired" };
  if (kind === "declined") return { kind, label: "Declined" };
  if (kind === "active") return { kind, label: "Active" };
  if (kind === "pending") {
    const s = typeof data.status === "string" ? data.status : "";
    if (s === SUBSCRIPTION_STATUS.PAYMENT_SUBMITTED) return { kind, label: "Pending review" };
    return { kind, label: "Awaiting payment" };
  }
  return { kind: "pending", label: "—" };
}
