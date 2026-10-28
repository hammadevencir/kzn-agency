/**
 * Display formatting for stored checkout amounts.
 *
 * Amounts are persisted as display strings that already carry their own
 * currency — Meta plans are priced in euros ("€499/mo"), top-ups in dollars
 * ("$5,035"). Anywhere that blindly prefixed "$" turned a euro plan into
 * "$€499/mo", so prefix only when the string has no currency marker of its own.
 */

/**
 * @param {unknown} raw — e.g. "€499/mo", "$1,299", "499", "—"
 * @param {string} [fallback] — returned for empty / placeholder input
 * @returns {string}
 */
export function withDisplayCurrency(raw, fallback = "—") {
  const s = raw == null ? "" : String(raw).trim();
  if (!s || s === "—") return fallback;
  // Older subscriptions stored a double symbol ("$€499/mo") — show "€499/mo".
  const doubled = /^\$\s*([€£])/.exec(s);
  if (doubled) return s.slice(doubled[0].length - 1);
  // Starts with a digit or decimal separator → bare number, needs a symbol.
  // Anything else (€, $, £, "USD 499") already states its currency.
  if (!/^[\d.,]/.test(s)) return s;
  return `$${s}`;
}

/**
 * Ad-account balance in the account's own currency (EU accounts → €, HK and
 * older accounts → $). Balances are stored as bare numbers.
 * @param {unknown} raw — number or numeric string
 * @param {'EUR' | 'USD' | string} [currency]
 * @param {string | null} [fallback]
 * @returns {string | null}
 */
export function formatBalanceAmount(raw, currency = "USD", fallback = "—") {
  if (raw == null) return fallback;
  let num = NaN;
  if (typeof raw === "number") {
    num = raw;
  } else if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.\-]/g, "").trim();
    if (cleaned) num = Number.parseFloat(cleaned);
  }
  if (!Number.isFinite(num)) return fallback;
  return `${currencySymbol(currency)}${num.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** @param {'EUR' | 'USD' | string} [currency] */
export function currencySymbol(currency) {
  return currency === "EUR" ? "€" : "$";
}
