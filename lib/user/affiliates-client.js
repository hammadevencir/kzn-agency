"use client";

/**
 * Validate a referral code for the current user (logged-in buyer).
 * @param {string} code
 * @returns {Promise<{
 *   valid: boolean,
 *   normalizedCode?: string,
 *   discountPercent?: number,
 *   discountMessage?: string,
 *   error?: string,
 * }>}
 */
export async function validateReferralCodeForCheckout(code) {
  const res = await fetch("/api/referral/validate", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      valid: false,
      error:
        typeof data.error === "string" ? data.error : "invalid_referral_code",
    };
  }
  return data;
}
