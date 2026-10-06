"use client";

import {
  CREATIVE_ALLOWED_TYPES,
  CREATIVE_MAX_SIZE_BYTES,
  creativeContentTypeFromName,
} from "@/lib/ad-accounts/request-creatives";

/**
 * @typedef {{
 *   url: string,
 *   path: string,
 *   name: string,
 *   contentType: string,
 *   size: number,
 *   uploadedAt: string,
 * }} RequestCreativeMeta
 */

/**
 * Client-side check before uploading. Returns an error message or null.
 * @param {File} file
 */
export function validateCreativeFile(file) {
  const type = (file.type || creativeContentTypeFromName(file.name)).toLowerCase();
  if (!CREATIVE_ALLOWED_TYPES.has(type)) {
    return `${file.name || "File"}: only PNG, JPEG or WEBP images are allowed.`;
  }
  if (!file.size) return `${file.name || "File"} is empty.`;
  if (file.size > CREATIVE_MAX_SIZE_BYTES) {
    return `${file.name || "File"} is larger than 10 MB.`;
  }
  return null;
}

const ERROR_MESSAGES = {
  unauthenticated: "Your session expired. Please sign in again.",
  unsupported_file_type: "Only PNG, JPEG or WEBP images are allowed.",
  file_too_large: "Each image must be 10 MB or smaller.",
  storage_unavailable: "File storage is unavailable. Please try again later.",
  network_error: "Network error while uploading. Please try again.",
};

/** @param {unknown} err */
export function humanizeCreativeUploadError(err) {
  const code = err instanceof Error ? err.message : "";
  return ERROR_MESSAGES[code] || "Upload failed. Please try again.";
}

/**
 * Upload one creative image through our API (Admin SDK on the server).
 * Uses XHR so upload progress can be reported.
 * @param {File} file
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<RequestCreativeMeta>}
 */
export function uploadRequestCreative(file, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file, file.name || "creative");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/requests/upload-creatives");
    xhr.withCredentials = true;
    xhr.responseType = "json";

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onerror = () => reject(new Error("network_error"));
    xhr.onload = () => {
      let data = xhr.response;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          data = null;
        }
      }
      if (xhr.status === 401) return reject(new Error("unauthenticated"));
      if (xhr.status < 200 || xhr.status >= 300) {
        return reject(
          new Error(data && typeof data.error === "string" ? data.error : "upload_failed")
        );
      }
      if (!data || typeof data.url !== "string") {
        return reject(new Error("upload_failed"));
      }
      resolve(/** @type {RequestCreativeMeta} */ (data));
    };
    xhr.send(form);
  });
}
