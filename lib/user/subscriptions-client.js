"use client";

/** Map a thrown subscription-request error to a user-facing message. */
export function describeSubscriptionRequestError(err) {
  const code = err instanceof Error ? err.message : "";
  if (code === "subscription_already_active") {
    return "You already have an active subscription for this platform.";
  }
  return "Could not confirm payment. Please try again.";
}

export async function createPlatformSubscriptionRequest({
  platformId,
  flow,
  checkoutPreview,
  finalize = false,
  referralCode,
  meta,
  upgradeSubscriptionId,
  paymentProof,
  paymentReference,
  paymentMeta,
}) {
  const trimmedUpgrade =
    typeof upgradeSubscriptionId === "string"
      ? upgradeSubscriptionId.trim()
      : "";
  const res = await fetch("/api/subscriptions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platformId,
      flow,
      checkoutPreview,
      finalize,
      referralCode: referralCode && String(referralCode).trim() !== ""
        ? String(referralCode).trim()
        : undefined,
      meta:
        meta && typeof meta === "object"
          ? meta
          : undefined,
      upgradeSubscriptionId:
        trimmedUpgrade !== "" ? trimmedUpgrade : undefined,
      paymentProof: paymentProof || undefined,
      paymentReference: paymentReference || undefined,
      paymentMeta: paymentMeta || undefined,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : `request_failed_${res.status}`
    );
  }
  if (!data.id || typeof data.id !== "string") {
    throw new Error("invalid_response");
  }
  return { id: data.id };
}

export async function submitPlatformSubscriptionPayment(
  id,
  checkout,
  paymentProof = null,
  paymentReference = null,
  /** @type {{ currency?: string, account?: string, amountLabel?: string } | null} */
  paymentMeta = null
) {
  const res = await fetch(`/api/subscriptions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkout, paymentProof, paymentReference, paymentMeta }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : `request_failed_${res.status}`
    );
  }
  return data;
}
