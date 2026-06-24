/**
 * Cloud Functions for Firebase (KZN Agency).
 *
 * `subscriptionExpirySweep`:
 *   Runs every 12 hours. Marks approved subscriptions as expired when their
 *   `expiresAt` has passed and stamps the expiry-warning stage (7d / 3d / 24h)
 *   for subscriptions nearing expiry.
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

const {
  sweepSubscriptionExpiries,
  backfillSubscriptionExpiries,
} = require("./expiry-worker.cjs");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

exports.subscriptionExpirySweep = onSchedule(
  {
    schedule: "every 12 hours",
    timeZone: "Etc/UTC",
    retryCount: 2,
  },
  async () => {
    const result = await sweepSubscriptionExpiries(db);
    logger.info("subscription expiry sweep complete", result);
    return null;
  }
);

/**
 * Ad-hoc callable equivalents so you can trigger them manually from the
 * Firebase console or CLI (`firebase functions:shell`):
 *   subscriptionExpiryBackfill()
 *   subscriptionExpirySweepOnce()
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");

exports.subscriptionExpiryBackfill = onCall(async (req) => {
  const claims = req.auth?.token || {};
  if (claims.role !== "admin") {
    throw new HttpsError("permission-denied", "admin only");
  }
  return backfillSubscriptionExpiries(db);
});

exports.subscriptionExpirySweepOnce = onCall(async (req) => {
  const claims = req.auth?.token || {};
  if (claims.role !== "admin") {
    throw new HttpsError("permission-denied", "admin only");
  }
  return sweepSubscriptionExpiries(db);
});
