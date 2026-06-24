export const REFERRAL_CODE_LS_KEY = "kzn_referral_code";

/** Read persisted referral code (if any) from localStorage. */
export function getSavedReferralCode() {
  try {
    const v = localStorage.getItem(REFERRAL_CODE_LS_KEY);
    return v && v.trim() ? v.trim() : "";
  } catch {
    return "";
  }
}

/** Clear persisted referral code (call after successful purchase, or on logout). */
export function clearSavedReferralCode() {
  try {
    localStorage.removeItem(REFERRAL_CODE_LS_KEY);
  } catch {
    /* noop */
  }
}
