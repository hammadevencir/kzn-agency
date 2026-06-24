import {
  REFEREE_DISCOUNT_PERCENT,
  REFERRER_COMMISSION_PERCENT,
} from "@/lib/affiliates/constants";

/**
 * Extract leading currency + numeric part from strings like "€199/mo", "$1,299".
 * @param {string} amountStr
 * @returns {{ symbol: string, numeric: number, suffix: string } | null}
 */
function parseMoneyParts(amountStr) {
  const s = String(amountStr ?? "").trim();
  if (!s) return null;
  const m = s.match(/^([€$£])\s*([\d][\d.,]*)(.*)$/);
  if (!m) return null;
  const num = parseFloat(m[2].replace(/,/g, ""));
  if (Number.isNaN(num)) return null;
  return { symbol: m[1], numeric: num, suffix: m[3] || "" };
}

/**
 * @param {string} amountStr
 * @returns {number | null} amount in cents (integer), from first money token in the string
 */
export function parseMoneyToCents(amountStr) {
  const p = parseMoneyParts(amountStr);
  if (!p) return null;
  return Math.round(p.numeric * 100);
}

/**
 * @param {string} amountStr
 * @param {number} percent 0-100
 */
function applyPercentDiscountToAmountString(amountStr, percent) {
  const p = parseMoneyParts(amountStr);
  if (!p) return { next: amountStr, changed: false };
  const factor = 1 - percent / 100;
  const nextNum = Math.round(p.numeric * factor * 100) / 100;
  const decimals = Number.isInteger(nextNum) ? 0 : 2;
  const next =
    `${p.symbol}${nextNum.toFixed(decimals)}${p.suffix}`;
  return { next, changed: true };
}

/**
 * Apply referee discount to checkout preview (client + server).
 * @param {Record<string, unknown>} preview
 * @param {number} discountPercent
 * @param {string} [referralMessage]
 */
export function applyRefereeDiscountToCheckoutPreview(
  preview,
  discountPercent = REFEREE_DISCOUNT_PERCENT,
  referralMessage
) {
  const amount = String(preview.amount ?? "").trim();
  if (!amount) return preview;
  const applied = applyPercentDiscountToAmountString(amount, discountPercent);
  if (!applied.changed) return preview;
  const prevOriginal = preview.originalAmount
    ? String(preview.originalAmount)
    : null;
  const messages = [referralMessage, preview.discountMessage]
    .filter((x) => x && String(x).trim())
    .map(String);
  return {
    ...preview,
    amount: applied.next,
    originalAmount: prevOriginal || amount,
    discountMessage: messages.length ? messages.join(" ") : null,
  };
}

/**
 * Commission in cents from payable amount string.
 * @param {string} payableAmountStr
 * @param {number} [commissionPercent]
 */
export function commissionCentsFromPayable(
  payableAmountStr,
  commissionPercent = REFERRER_COMMISSION_PERCENT
) {
  const cents = parseMoneyToCents(payableAmountStr);
  if (cents == null || cents <= 0) return 0;
  return Math.round((cents * commissionPercent) / 100);
}

export { REFEREE_DISCOUNT_PERCENT, REFERRER_COMMISSION_PERCENT };
