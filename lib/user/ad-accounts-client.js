"use client";

/**
 * @param {object} params
 * @param {Record<string, unknown>} params.subscriptionForm
 * @param {Record<string, unknown>} [params.flow]
 * @param {Record<string, unknown>} params.checkoutPreview
 * @param {string} [params.referralCode]
 * @returns {Promise<{ id: string }>}
 */
export async function createAdAccountRequest({
  subscriptionForm,
  flow,
  checkoutPreview,
  finalize = false,
  referralCode,
}) {
  const res = await fetch("/api/ad-accounts", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscriptionForm,
      flow,
      checkoutPreview,
      finalize,
      referralCode: referralCode && String(referralCode).trim() !== ""
        ? String(referralCode).trim()
        : undefined,
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

/**
 * @param {string} id
 * @param {Record<string, unknown>} checkout
 * @param {Record<string, unknown> | null} [paymentProof]
 */
export async function submitAdAccountPayment(id, checkout, paymentProof = null) {
  const res = await fetch(`/api/ad-accounts/${encodeURIComponent(id)}`, {
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
