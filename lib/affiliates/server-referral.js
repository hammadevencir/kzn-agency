import { FieldValue } from "firebase-admin/firestore";
import {
  AFFILIATE_PROFILES_COLLECTION,
  REFERRAL_CODES_COLLECTION,
  REFERRAL_CODE_PREFIX,
  REFERRER_COMMISSION_PERCENT,
  REFERRER_SUBSCRIPTION_COMMISSION_PERCENT,
  COMMISSION_CENTS_AD_ACCOUNT,
} from "@/lib/affiliates/constants";
import { commissionCentsFromPayable } from "@/lib/affiliates/pricing";
import {
  getRefereeDiscountPercentForPurchase,
  hasUsedReferralFirstMonthDiscount,
} from "@/lib/affiliates/discount-eligibility";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_SEGMENT_LEN = 4;

export function normalizeReferralCode(input) {
  if (input == null) return "";
  return String(input)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function randomSegment(len) {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

/** @returns {string} e.g. KZN-A3F9K2M1 */
export function generateReferralCodeValue() {
  return `${REFERRAL_CODE_PREFIX}-${randomSegment(CODE_SEGMENT_LEN)}${randomSegment(CODE_SEGMENT_LEN)}`;
}

/**
 * Ensure the user has an affiliate profile and referral code (Admin SDK).
 *
 * Also self-heals the two-doc invariant: if the affiliate profile stores a
 * `referralCode` but the corresponding `referral-codes/<code>` reverse-lookup
 * doc is missing (or points to another user), we re-create it so that
 * `lookupReferrerUserId` returns a value during checkout validation.
 *
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} userId
 */
export async function ensureAffiliateProfile(db, userId) {
  const profRef = db.collection(AFFILIATE_PROFILES_COLLECTION).doc(userId);
  const existing = await profRef.get();
  if (existing.exists) {
    const d = existing.data();
    const rawCode =
      d && typeof d.referralCode === "string" ? d.referralCode : "";
    const code = normalizeReferralCode(rawCode);
    if (code) {
      const codeRef = db.collection(REFERRAL_CODES_COLLECTION).doc(code);
      const codeSnap = await codeRef.get();

      if (!codeSnap.exists) {
        await codeRef.set({
          userId,
          createdAt: FieldValue.serverTimestamp(),
          backfilled: true,
        });
      } else {
        const owner = codeSnap.data()?.userId;
        if (typeof owner === "string" && owner !== userId) {
          // Reverse-lookup doc belongs to someone else; regenerate a fresh
          // code for this user so the two stay consistent.
          return await regenerateAndReturn(db, profRef, userId);
        }
      }

      // If the stored code differs from the normalized form, rewrite profile.
      if (rawCode !== code) {
        await profRef.set(
          {
            referralCode: code,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      return {
        referralCode: code,
        commissionBalanceCents:
          typeof d?.commissionBalanceCents === "number"
            ? d.commissionBalanceCents
            : 0,
      };
    }
  }

  return await regenerateAndReturn(db, profRef, userId);
}

/**
 * Generate a fresh unique code and write both the profile + reverse-lookup
 * doc atomically. Factored out so orphan-repair and first-time creation share
 * the same logic.
 *
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {FirebaseFirestore.DocumentReference} profRef
 * @param {string} userId
 */
async function regenerateAndReturn(db, profRef, userId) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = generateReferralCodeValue();
    const codeRef = db.collection(REFERRAL_CODES_COLLECTION).doc(code);
    const codeSnap = await codeRef.get();
    if (codeSnap.exists) continue;

    const batch = db.batch();
    batch.set(codeRef, {
      userId,
      createdAt: FieldValue.serverTimestamp(),
    });
    batch.set(
      profRef,
      {
        userId,
        referralCode: code,
        commissionBalanceCents: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await batch.commit();
    return { referralCode: code, commissionBalanceCents: 0 };
  }

  throw new Error("referral_code_generation_failed");
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} normalizedCode
 * @returns {Promise<string | null>} referrer user id
 */
export async function lookupReferrerUserId(db, normalizedCode) {
  if (!normalizedCode) return null;
  const snap = await db
    .collection(REFERRAL_CODES_COLLECTION)
    .doc(normalizedCode)
    .get();
  if (!snap.exists) return null;
  const uid = snap.data()?.userId;
  return typeof uid === "string" ? uid : null;
}

/**
 * Validate referral and build metadata for a purchase.
 * Subscriptions: referrer earns a percent of the payable checkout amount; ad accounts: flat commission.
 *
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} buyerUid
 * @param {string | undefined} referralCodeRaw
 * @param {string} payableAmountStr — final `checkout.amount` string
 * @param {"subscription" | "ad_account"} [purchaseKind]
 */
export async function buildReferralAttachmentForPurchase(
  db,
  buyerUid,
  referralCodeRaw,
  payableAmountStr,
  purchaseKind
) {
  const normalized = normalizeReferralCode(
    typeof referralCodeRaw === "string" ? referralCodeRaw : ""
  );
  if (!normalized) {
    return { referral: null };
  }

  const referrerUserId = await lookupReferrerUserId(db, normalized);
  if (!referrerUserId || referrerUserId === buyerUid) {
    const err = new Error("invalid_referral_code");
    /** @type {any} */ (err).code = "invalid_referral_code";
    throw err;
  }

  const discountAlreadyUsed = await hasUsedReferralFirstMonthDiscount(db, buyerUid);
  const refereeDiscountPercent = getRefereeDiscountPercentForPurchase(
    purchaseKind,
    discountAlreadyUsed
  );

  let commissionEstimateCents;
  if (purchaseKind === "subscription") {
    commissionEstimateCents = commissionCentsFromPayable(
      String(payableAmountStr ?? ""),
      REFERRER_SUBSCRIPTION_COMMISSION_PERCENT
    );
  } else if (purchaseKind === "ad_account") {
    commissionEstimateCents = COMMISSION_CENTS_AD_ACCOUNT;
  } else {
    commissionEstimateCents = commissionCentsFromPayable(
      String(payableAmountStr ?? ""),
      REFERRER_COMMISSION_PERCENT
    );
  }

  const referrerCommissionPercentAttached =
    purchaseKind === "subscription"
      ? REFERRER_SUBSCRIPTION_COMMISSION_PERCENT
      : REFERRER_COMMISSION_PERCENT;

  return {
    referral: {
      code: normalized,
      referrerUserId,
      purchaseKind: purchaseKind || "unknown",
      refereeDiscountPercent,
      referrerCommissionPercent: referrerCommissionPercentAttached,
      commissionEstimateCents,
      commissionCredited: false,
    },
  };
}
