"use client";

import {
  IMAGE_TOO_LARGE_MESSAGE,
  PDF_TOO_LARGE_MESSAGE,
  UPLOAD_MAX_FILE_BYTES,
  compressImageFile,
  guessFileType,
  isPdfFile,
} from "@/lib/uploads/compress-image";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]);

/** Must match MAX_SIZE_BYTES in app/api/payments/upload-proof/route.js. */
const MAX_SIZE_BYTES = UPLOAD_MAX_FILE_BYTES; // 4 MB (Vercel body limit is ~4.5 MB)

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
 * Error codes thrown by `uploadPaymentProof` keep their historic values
 * (`file_too_large`, `unsupported_file_type`, …) so existing callers keep
 * working; `err.userMessage` carries a specific, ready-to-show message.
 * @param {string} code
 * @param {string} [userMessage]
 */
function uploadError(code, userMessage) {
  const err = new Error(code);
  if (userMessage) /** @type {any} */ (err).userMessage = userMessage;
  return err;
}

const ERROR_MESSAGES = {
  missing_file: "Please choose a file to upload.",
  unauthenticated: "Your session expired. Please sign in again.",
  unsupported_file_type: "Unsupported file type. Please upload a PNG, JPEG, WEBP, or PDF.",
  file_too_large: "File is too large — max 4 MB. Please upload a smaller screenshot.",
  storage_unavailable: "File storage is unavailable. Please try again later.",
  network_error: "Network error while uploading. Please check your connection and try again.",
};

/**
 * Friendly message for any error thrown by `uploadPaymentProof`.
 * @param {unknown} err
 * @param {string} [fallback]
 */
export function humanizePaymentProofError(
  err,
  fallback = "Could not upload your payment screenshot. Please try again."
) {
  const anyErr = /** @type {any} */ (err);
  if (anyErr && typeof anyErr.userMessage === "string" && anyErr.userMessage) {
    return anyErr.userMessage;
  }
  const code = err instanceof Error ? err.message : "";
  return ERROR_MESSAGES[code] || fallback;
}

/**
 * Upload a payment-proof screenshot / PDF for the currently signed-in user.
 *
 * The file is streamed to our own API route (which uses the Firebase Admin
 * SDK to store it). This sidesteps client-side Firebase Storage rules and
 * the CORS preflight denials that occur when the bucket isn't configured
 * to accept requests from the browser origin.
 *
 * Images are downscaled / re-encoded as JPEG in the browser first so the
 * request stays under the serverless body limit; PDFs over 4 MB are rejected.
 *
 * @param {File} file
 * @param {{ kind?: 'subscription' | 'top-up' | 'ad-account' | 'order' | 'misc' }} [opts]
 * @returns {Promise<PaymentProofMeta>}
 */
export async function uploadPaymentProof(file, opts = {}) {
  if (!file) {
    throw uploadError("missing_file");
  }

  if (isPdfFile(file)) {
    if (file.size > MAX_SIZE_BYTES) {
      throw uploadError("file_too_large", PDF_TOO_LARGE_MESSAGE);
    }
  } else {
    // Also turns decodable HEIC/HEIF (Safari) into JPEG.
    file = await compressImageFile(file);
  }

  const type = guessFileType(file);
  if (!ALLOWED_TYPES.has(type)) {
    throw uploadError("unsupported_file_type");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw uploadError(
      "file_too_large",
      type === "application/pdf" ? PDF_TOO_LARGE_MESSAGE : IMAGE_TOO_LARGE_MESSAGE
    );
  }

  // Send an explicit, normalised content type (some browsers leave it empty).
  const body =
    file.type === type ? file : new File([file], file.name || "proof", { type });

  const form = new FormData();
  form.append("file", body, body.name || "proof");
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
    throw uploadError("network_error");
  }

  if (!res.ok) {
    if (res.status === 401) throw uploadError("unauthenticated");
    // Vercel rejects oversized bodies with a plain-text 413 before our route runs.
    if (res.status === 413) {
      throw uploadError(
        "file_too_large",
        type === "application/pdf" ? PDF_TOO_LARGE_MESSAGE : IMAGE_TOO_LARGE_MESSAGE
      );
    }
    let errorCode = "upload_failed";
    try {
      const data = await res.json();
      if (data && typeof data.error === "string") errorCode = data.error;
    } catch {
      // ignore JSON parse errors
    }
    if (errorCode === "file_too_large" && type === "application/pdf") {
      throw uploadError(errorCode, PDF_TOO_LARGE_MESSAGE);
    }
    throw uploadError(errorCode);
  }

  const data = await res.json();
  if (!data || typeof data.url !== "string") {
    throw uploadError("upload_failed");
  }
  return /** @type {PaymentProofMeta} */ (data);
}
