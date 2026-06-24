import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  SUBSCRIPTIONS_COLLECTION,
  SUBSCRIPTION_STATUS,
  EXPIRY_WARNING_STAGE,
  SUBSCRIPTION_DURATION_DAYS,
} from "./constants";
import {
  expiryMsFromCreatedAt,
  tsToMillis,
  warningStageFromMsLeft,
} from "./expiry";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Ensure every approved subscription has an `expiresAt` stamped on the doc.
 * Uses createdAt + 30 days (matches business rule) with a safety fallback of
 * now + 30 days when createdAt is missing.
 *
 * Safe to run repeatedly (idempotent).
 *
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function backfillSubscriptionExpiries(db) {
  const snap = await db
    .collection(SUBSCRIPTIONS_COLLECTION)
    .where("status", "==", SUBSCRIPTION_STATUS.APPROVED)
    .get();

  const nowMs = Date.now();
  let updated = 0;
  let skipped = 0;
  let batch = db.batch();
  let pending = 0;

  for (const d of snap.docs) {
    const data = d.data();
    if (data.expiresAt) {
      skipped++;
      continue;
    }
    const createdMs = tsToMillis(data.createdAt);
    const fromCreation = createdMs ? expiryMsFromCreatedAt(createdMs) : 0;
    const expiresMs =
      fromCreation > 0 ? fromCreation : nowMs + SUBSCRIPTION_DURATION_DAYS * DAY_MS;

    batch.set(
      d.ref,
      {
        expiresAt: Timestamp.fromMillis(expiresMs),
        expiryBackfilledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    updated++;
    pending++;
    if (pending >= 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();

  return { updated, skipped, total: snap.size };
}

/**
 * Run the expiry sweep:
 *  - Flip `approved` → `expired` for docs whose expiresAt has passed.
 *  - Stamp the warning stage on docs nearing expiry (7d / 3d / 24h) so the
 *    user portal can surface the right dialog.
 *
 * Safe to run on any interval; uses `expiryWarningStage` memoization to avoid
 * repeated writes.
 *
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function sweepSubscriptionExpiries(db) {
  const snap = await db
    .collection(SUBSCRIPTIONS_COLLECTION)
    .where("status", "==", SUBSCRIPTION_STATUS.APPROVED)
    .get();

  const nowMs = Date.now();
  let expired = 0;
  let warned = 0;
  let touched = 0;
  let batch = db.batch();
  let pending = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const expiresMs = tsToMillis(data.expiresAt);
    if (!expiresMs) continue;

    const msLeft = expiresMs - nowMs;
    const nextStage = warningStageFromMsLeft(msLeft);
    const currentStage = data.expiryWarningStage || null;

    if (msLeft <= 0) {
      batch.set(
        d.ref,
        {
          status: SUBSCRIPTION_STATUS.EXPIRED,
          expiryWarningStage: EXPIRY_WARNING_STAGE.EXPIRED,
          expiryWarningStageAt: FieldValue.serverTimestamp(),
          expiredAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      expired++;
      touched++;
      pending++;
    } else if (nextStage && nextStage !== currentStage) {
      batch.set(
        d.ref,
        {
          expiryWarningStage: nextStage,
          expiryWarningStageAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      warned++;
      touched++;
      pending++;
    }

    if (pending >= 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();

  return { total: snap.size, expired, warned, touched };
}
