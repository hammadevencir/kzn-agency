"use client";

export async function createPlatformSubscriptionRequest({
  platformId,
  flow,
  checkoutPreview,
  finalize = false,
  referralCode,
  meta,
  upgradeSubscriptionId,
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
  paymentProof = null
) {
  const res = await fetch(`/api/subscriptions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkout, paymentProof }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : `request_failed_${res.status}`
    );
  }
  return data;
}
