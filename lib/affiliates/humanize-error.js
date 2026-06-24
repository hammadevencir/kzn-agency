/**
 * Map raw server/API referral error codes (or generic errors thrown from the
 * ad-account / subscription client helpers) into a user-friendly toast
 * message. Falls back to the raw message when the error isn't referral-
 * related so that unrelated failures still surface a helpful reason.
 *
 * @param {unknown} err
 * @returns {string}
 */
export function humanizeReferralError(err) {
  const raw =
    err instanceof Error && typeof err.message === "string"
      ? err.message
      : typeof err === "string"
        ? err
        : "";

  switch (raw) {
    case "invalid_referral_code":
      return "That referral code is not valid. Please double-check it and try again, or remove it to continue without a discount.";
    case "self_referral_not_allowed":
      return "You cannot use your own referral code.";
    case "subscription_expired":
      return "Your platform subscription has expired. Please renew it to continue.";
    case "weekly_ad_account_limit":
      return "You can request at most 10 ad accounts per week for each platform. Try again after your weekly window resets.";
    case "":
      return "Could not save your request. Please try again.";
    default:
      return raw;
  }
}
