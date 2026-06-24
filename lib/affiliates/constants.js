export const AFFILIATE_PROFILES_COLLECTION = "affiliate-profiles";
export const REFERRAL_CODES_COLLECTION = "referral-codes";

/** Percent off the payable amount for the referred customer. */
export const REFEREE_DISCOUNT_PERCENT = 10;

/** @deprecated Kept for backwards compat; subscription uses REFERRER_SUBSCRIPTION_COMMISSION_PERCENT. */
export const REFERRER_COMMISSION_PERCENT = 5;

/** Percent of the referred customer’s subscription payment (payable checkout amount) credited to the referrer. */
export const REFERRER_SUBSCRIPTION_COMMISSION_PERCENT = 20;

/** Flat commission in cents credited to referrer per approved ad-account purchase. */
export const COMMISSION_CENTS_AD_ACCOUNT = 250;

/** Minimum affiliate balance (USD, in cents) before a user can submit a reward claim. */
export const AFFILIATE_MIN_CLAIM_BALANCE_CENTS = 100_00;

export const REFERRAL_CODE_PREFIX = "KZN";
