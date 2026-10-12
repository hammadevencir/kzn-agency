/**
 * Pure checks used by POST /api/orders (no Firebase imports — unit-testable).
 */

import { SUBSCRIPTION_STATUS } from "@/lib/subscriptions/constants";

/**
 * Same rule as `hasConfirmedSubscription` in lib/hooks/useUserSubscribedPlatforms.js
 * (the portal lock): a subscription payment was approved at some point — it is
 * active, approved (expired by date or not), or explicitly expired. Pending,
 * submitted and rejected subscriptions don't count.
 * @param {Record<string, unknown> | null | undefined} data — subscription doc
 */
export function isConfirmedSubscriptionDoc(data) {
  if (!data || typeof data !== "object") return false;
  const status = data.status;
  return (
    status === SUBSCRIPTION_STATUS.APPROVED ||
    status === SUBSCRIPTION_STATUS.EXPIRED ||
    status === "active" ||
    // Ever approved before: a lapsed plan whose renewal payment is under
    // review (payment_submitted) must not lock the customer out.
    data.isRenewal === true ||
    data.expiredAt != null ||
    data.lastRenewalApprovedAt != null
  );
}

/**
 * `FIREBASE_STORAGE_EMULATOR_HOST` ("127.0.0.1:9199") → hosts accepted for
 * emulator download URLs.
 * @param {string | undefined} emulatorHost
 */
function emulatorHosts(emulatorHost) {
  const raw = String(emulatorHost || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!raw) return new Set();
  const port = raw.includes(":") ? raw.split(":").pop() : "";
  const hosts = new Set([raw.toLowerCase()]);
  if (port) {
    hosts.add(`127.0.0.1:${port}`);
    hosts.add(`localhost:${port}`);
  }
  return hosts;
}

/**
 * Is `proof` a Firebase Storage download URL for an object inside the caller's
 * own `payment-proofs/{uid}/` folder, with `url` pointing at that same `path`?
 *
 * Production URLs must be `https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}`.
 * Emulator URLs (`http://127.0.0.1:9199/v0/b/…`) are accepted only when
 * `emulatorHost` (process.env.FIREBASE_STORAGE_EMULATOR_HOST) is set.
 *
 * @param {{ url?: unknown, path?: unknown } | null | undefined} proof
 * @param {string} uid
 * @param {{ emulatorHost?: string }} [opts]
 */
export function isOwnPaymentProof(proof, uid, opts = {}) {
  if (!proof || typeof proof !== "object" || !uid) return false;
  const url = typeof proof.url === "string" ? proof.url.trim() : "";
  const path = typeof proof.path === "string" ? proof.path.trim() : "";
  const prefix = `payment-proofs/${uid}/`;
  if (!url || !path || !path.startsWith(prefix) || path.length <= prefix.length) return false;
  if (path.includes("..") || path.includes("\\")) return false;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.username || parsed.password) return false;

  const host = parsed.host.toLowerCase();
  const isProd =
    parsed.protocol === "https:" && host === "firebasestorage.googleapis.com";
  const isEmulator =
    !isProd &&
    (parsed.protocol === "http:" || parsed.protocol === "https:") &&
    emulatorHosts(opts.emulatorHost).has(host);
  if (!isProd && !isEmulator) return false;

  const m = /^\/v0\/b\/[^/]+\/o\/([^/]+)$/.exec(parsed.pathname);
  if (!m) return false;
  let objectPath;
  try {
    objectPath = decodeURIComponent(m[1]);
  } catch {
    return false;
  }
  return objectPath === path;
}
