/**
 * Top-up currency conversion (client decision 2026-10-26): customers choose
 * to pay a top-up in EUR or USD. Paying in the ad account's own currency
 * (EUR → EU accounts, USD → HK accounts) has no currency fee. Paying in the
 * other currency uses the live market rate minus a margin of 0.10 per 1
 * USD/EUR. The margin is never shown as a separate line to the customer.
 *
 * Pure math, shared by the top-up modal and POST /api/top-ups.
 */

/** Margin per 1 unit of the paid currency (€0.10 / $0.10). */
export const FX_MARGIN_PER_UNIT = 0.1;

/** @param {number} n */
const round2 = (n) => Math.round(n * 100) / 100;
/** @param {number} n */
const round4 = (n) => Math.round(n * 10000) / 10000;

/**
 * Rate the customer gets: how much of the account currency one unit of the
 * paid currency buys, after the margin.
 * @param {'EUR' | 'USD'} payCurrency
 * @param {number} marketEurUsd — market rate, €1 = $X
 * @returns {number | null}
 */
export function appliedRate(payCurrency, marketEurUsd) {
  if (!Number.isFinite(marketEurUsd) || marketEurUsd <= 0) return null;
  const market = payCurrency === "EUR" ? marketEurUsd : 1 / marketEurUsd;
  const rate = round4(market - FX_MARGIN_PER_UNIT);
  return rate > 0 ? rate : null;
}

/**
 * What the customer must send for a top-up.
 * @param {{
 *   totalInAccountCurrency: number,   // top-up amount + fee, in the account's currency
 *   accountCurrency: 'EUR' | 'USD',
 *   payCurrency: 'EUR' | 'USD',
 *   marketEurUsd?: number | null,
 * }} input
 * @returns {{ amountToSend: number, rate: number | null, crossCurrency: boolean } | null}
 *   null when a cross-currency payment has no usable rate.
 */
export function amountToSendForTopUp({
  totalInAccountCurrency,
  accountCurrency,
  payCurrency,
  marketEurUsd = null,
}) {
  if (!Number.isFinite(totalInAccountCurrency) || totalInAccountCurrency <= 0) return null;
  if (payCurrency === accountCurrency) {
    return { amountToSend: round2(totalInAccountCurrency), rate: null, crossCurrency: false };
  }
  const rate = appliedRate(payCurrency, Number(marketEurUsd));
  if (!rate) return null;
  return { amountToSend: convertAtRate(totalInAccountCurrency, rate), rate, crossCurrency: true };
}

/**
 * Amount to send in the paid currency at an already-applied rate. Rounded up
 * to the cent so the transfer always covers the credited amount.
 * @param {number} totalInAccountCurrency
 * @param {number} rate — from appliedRate
 */
export function convertAtRate(totalInAccountCurrency, rate) {
  return Math.ceil((totalInAccountCurrency / rate) * 100) / 100;
}

/** @param {'EUR' | 'USD' | string} c */
export function symbolFor(c) {
  return c === "EUR" ? "€" : "$";
}

/**
 * "€1 = $1.06" — the rate line shown before confirming.
 * @param {'EUR' | 'USD'} payCurrency
 * @param {number} rate
 */
export function rateLabel(payCurrency, rate) {
  const other = payCurrency === "EUR" ? "USD" : "EUR";
  return `${symbolFor(payCurrency)}1 = ${symbolFor(other)}${rate.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

/**
 * @param {number} n
 * @param {'EUR' | 'USD' | string} currency
 */
export function moneyLabel(n, currency) {
  return `${symbolFor(currency)}${n.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
