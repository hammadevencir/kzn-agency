"use client";

async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : "request_failed");
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
 * @param {{ action: 'cancel' | 'confirm' | 'rate' | 'complaint', rating?: number }} payload
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
