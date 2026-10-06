import "server-only";

import { createHash } from "node:crypto";
import {
  PRIVATE_PRICING_RATE_LIMIT,
  PRIVATE_PRICING_RATE_LIMIT_COLLECTION,
  PRIVATE_PRICING_RATE_WINDOW_MS,
} from "./constants.js";

/** Best-effort client IP from proxy headers (Vercel / Cloud Run / nginx). */
export function clientIpFromRequest(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Salted SHA-256 so raw IPs are never stored. */
export function hashIp(ip) {
  const salt =
    process.env.PRIVATE_PRICING_IP_SALT ||
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    "kzn-private-pricing";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * Rolling-window limiter stored in Firestore (`private-pricing-rate-limits/{ipHash}`),
 * so it holds across serverless instances. Records the hit when allowed.
 * Fails open if Firestore errors (the form must not break on limiter issues).
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} ipHash
 * @returns {Promise<{ allowed: boolean, retryAfterSec?: number }>}
 */
export async function consumePrivatePricingRateLimit(db, ipHash) {
  const ref = db.collection(PRIVATE_PRICING_RATE_LIMIT_COLLECTION).doc(ipHash);
  const now = Date.now();
  const windowStart = now - PRIVATE_PRICING_RATE_WINDOW_MS;
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const prev = Array.isArray(snap.data()?.hits) ? snap.data().hits : [];
      const hits = prev.filter((t) => typeof t === "number" && t > windowStart);
      if (hits.length >= PRIVATE_PRICING_RATE_LIMIT) {
        const oldest = Math.min(...hits);
        return {
          allowed: false,
          retryAfterSec: Math.max(
            60,
            Math.ceil((oldest + PRIVATE_PRICING_RATE_WINDOW_MS - now) / 1000)
          ),
        };
      }
      hits.push(now);
      tx.set(ref, { hits, updatedAt: new Date(now) });
      return { allowed: true };
    });
  } catch (e) {
    console.warn("private-pricing: rate limiter unavailable, allowing request", e);
    return { allowed: true };
  }
}
