"use client";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * @typedef {{
 *   url: string,
 *   path: string,
 *   name: string,
 *   contentType: string,
 *   size: number,
 *   uploadedAt: string,
 * }} PaymentProofMeta
 */

/**
 * Upload a payment-proof screenshot / PDF for the currently signed-in user.
 *
 * The file is streamed to our own API route (which uses the Firebase Admin
 * SDK to store it). This sidesteps client-side Firebase Storage rules and
 * the CORS preflight denials that occur when the bucket isn't configured
 * to accept requests from the browser origin.
 *
 * @param {File} file
 * @param {{ kind?: 'subscription' | 'top-up' | 'ad-account' | 'misc' }} [opts]
 * @returns {Promise<PaymentProofMeta>}
 */
export async function uploadPaymentProof(file, opts = {}) {
  if (!file) {
    throw new Error("missing_file");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("unsupported_file_type");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("file_too_large");
  }

  const form = new FormData();
  form.append("file", file, file.name || "proof");
  if (opts.kind) {
    form.append("kind", String(opts.kind));
  }

  let res;
  try {
    res = await fetch("/api/payments/upload-proof", {
      method: "POST",
      body: form,
      credentials: "include",
    });
  } catch {
    throw new Error("network_error");
  }

  if (!res.ok) {
    let errorCode = "upload_failed";
    try {
      const data = await res.json();
      if (data && typeof data.error === "string") errorCode = data.error;
    } catch {
      // ignore JSON parse errors
    }
    if (res.status === 401) throw new Error("unauthenticated");
    throw new Error(errorCode);
  }

  const data = await res.json();
  if (!data || typeof data.url !== "string") {
    throw new Error("upload_failed");
  }
  return /** @type {PaymentProofMeta} */ (data);
}
