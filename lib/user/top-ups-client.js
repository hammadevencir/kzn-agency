"use client";

export async function submitBalanceCreditRequest({ adAccountId }) {
  const res = await fetch("/api/top-ups", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      adAccountId,
      freeBalanceRequest: true,
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

export async function createTopUpRequest({
  adAccountId,
  amount,
  subscriptionName = "Ad account top-up",
  finalize = true,
  paymentNote = null,
  paymentProof = null,
  paymentReference = null,
  paymentCurrency = null,
  expectedAmountToSend = null,
}) {
  const res = await fetch("/api/top-ups", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      adAccountId,
      checkoutPreview: {
        subscriptionName,
        amount,
      },
      finalize,
      paymentNote,
      paymentProof,
      paymentReference,
      paymentCurrency: paymentCurrency || undefined,
      expectedAmountToSend:
        typeof expectedAmountToSend === "number" ? expectedAmountToSend : undefined,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      typeof data.error === "string" ? data.error : `request_failed_${res.status}`
    );
    // fx_rate_changed carries the new amount to confirm.
    /** @type {any} */ (err).details = data;
    throw err;
  }
  if (!data.id || typeof data.id !== "string") {
    throw new Error("invalid_response");
  }
  return { id: data.id };
}
