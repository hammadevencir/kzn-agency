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
  // Starts with a digit or decimal separator → bare number, needs a symbol.
  // Anything else (€, $, £, "USD 499") already states its currency.
  if (!/^[\d.,]/.test(s)) return s;
  return `$${s}`;
}
