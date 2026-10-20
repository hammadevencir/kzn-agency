"use client";

async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(typeof data?.error === "string" ? data.error : "request_failed");
    // e.g. `retryAt` on a 429 "too_soon" (complaint / delivery update once a day).
    /** @type {any} */ (err).data = data;
    throw err;
  }
  return data;
}

export async function fetchMyOrders() {
  const res = await fetch("/api/orders", { credentials: "include", cache: "no-store" });
  const data = await parse(res);
  return Array.isArray(data.items) ? data.items : [];
}

/**
 * @param {{ productId: string, paymentProof: object, paymentReference: string }} payload
 */
export async function createOrder(payload) {
  const res = await fetch("/api/orders", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parse(res);
  return data.item;
}

/**
 * @param {string} orderId
 * @param {{ action: 'cancel' | 'confirm' | 'rate' | 'feedback' | 'complaint' | 'delivery_update', rating?: number, text?: string }} payload
 */
export async function updateMyOrder(orderId, payload) {
  const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parse(res);
  return data.item;
}
