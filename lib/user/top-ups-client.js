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
