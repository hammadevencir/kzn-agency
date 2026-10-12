import {
  getPlatformRequestConfig,
  minTopUpUsdForPlatform,
  parseAmountToNumber,
  topUpFeeLabelOrDefault,
  topUpFeePctFromLabel,
} from "@/lib/ad-accounts/platform-request-config";
import { resolveTopUpFeeLabel } from "@/lib/meta/meta-plan-catalog";
import { planGroupLabel, readPlanScope } from "@/lib/user/plan-scope";
import { currencyForRegion } from "@/lib/ad-accounts/regions";
import { EUR_TO_USD_RATE } from "@/lib/payments/bank-details";

/** @param {number} n */
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * The authoritative top-up fee label for an ad account (or subscription) `flow`.
 *
 * - Non-Meta platforms (TikTok, Google, …) have a single fixed fee in
 *   PLATFORM_REQUEST_CONFIG. That config wins over anything stored on the doc,
 *   so a missing, stale or client-forged `pricingSnapshot` / `accountCategory`
 *   can never change the fee, and these accounts never resolve through the
 *   Meta plan catalog.
 * - Meta (and legacy docs with no platform key) resolve category+tier through
 *   the Meta catalog (incl. legacy tiers), falling back to the snapshot.
 *
 * Every place that shows or charges a top-up fee must go through here.
 *
 * @param {unknown} flowRaw
 * @returns {string} e.g. "2%"
 */
export function resolveAccountTopUpFeeLabel(flowRaw) {
  const flow =
    flowRaw && typeof flowRaw === "object"
      ? /** @type {Record<string, unknown>} */ (flowRaw)
      : {};
  const pricing =
    flow.pricingSnapshot && typeof flow.pricingSnapshot === "object"
      ? /** @type {Record<string, unknown>} */ (flow.pricingSnapshot)
      : {};
  const platformKey =
    typeof flow.platformKey === "string" ? flow.platformKey.trim().toLowerCase() : "";

  if (platformKey && platformKey !== "meta") {
    const cfg = getPlatformRequestConfig(platformKey);
    if (cfg?.topUpFee) return cfg.topUpFee;
    // Unknown non-Meta platform: never consult the Meta catalog.
    return topUpFeeLabelOrDefault(pricing.topUpFee);
  }
  return topUpFeeLabelOrDefault(resolveTopUpFeeLabel(flow, pricing.topUpFee));
}

/**
 * Minimum top-up for an account, in the currency its top-ups are paid in.
 * The client's price list sets the floor in USD ($350); EUR-region accounts
 * pay the EUR equivalent at the fixed rate, rounded up so the EUR minimum
 * always covers the USD floor (€287 = $350.14).
 *
 * @param {string} platformKey
 * @param {'EUR' | 'USD' | string} [currency]
 * @returns {{ minUsd: number, minAmount: number, currency: 'EUR' | 'USD', label: string } | null}
 */
export function minTopUpForAccount(platformKey, currency) {
  const minUsd = minTopUpUsdForPlatform(platformKey);
  if (typeof minUsd !== "number") return null;
  const cur = currency === "EUR" ? "EUR" : "USD";
  if (cur === "EUR") {
    const minAmount = Math.ceil(minUsd / EUR_TO_USD_RATE);
    return {
      minUsd,
      minAmount,
      currency: cur,
      label: `€${minAmount.toLocaleString("en-US")} ($${minUsd.toLocaleString("en-US")})`,
    };
  }
  return {
    minUsd,
    minAmount: minUsd,
    currency: cur,
    label: `$${minUsd.toLocaleString("en-US")}`,
  };
}

/**
 * Same rule on client and server: the amount (in the account's currency) is
 * converted to USD and compared with the USD floor.
 * @param {number} amount
 * @param {'EUR' | 'USD' | string} currency
 * @param {number} minUsd
 */
export function meetsMinTopUp(amount, currency, minUsd) {
  if (!Number.isFinite(amount)) return false;
  const usd = currency === "EUR" ? amount * EUR_TO_USD_RATE : amount;
  // Tolerate float noise (287 * 1.22 = 350.14…, 286.89 * 1.22 = 350.0058).
  return usd + 1e-9 >= minUsd;
}

/**
 * Server-side top-up pricing, derived from the ad account's plan — never from
 * the client. Same rules the top-up modal uses to show "You should send".
 *
 * @param {Record<string, unknown> | undefined} flow — ad account `flow`
 * @param {string} amountStr — credited top-up amount, e.g. "$500"
 * @returns {{
 *   planLabel: string,
 *   feeLabel: string,
 *   feePct: number,
 *   amountUsd: number | null,
 *   feeAmountUsd: number | null,
 *   totalToSendUsd: number | null,
 *   currency: 'EUR' | 'USD',
 * }}
 *   (`…Usd` fields hold amounts in `currency` — EUR for Europe-region accounts.)
 */
export function computeTopUpPricing(flow, amountStr) {
  const f = flow && typeof flow === "object" ? flow : {};
  const feeLabel = resolveAccountTopUpFeeLabel(f);
  const feePct = topUpFeePctFromLabel(feeLabel);
  const scope = readPlanScope(f);
  const platform = String(f.displayPlatform || scope.platformKey || "—");
  const amount = parseAmountToNumber(amountStr);
  const amountUsd = amount != null && amount > 0 ? round2(amount) : null;
  const feeAmountUsd = amountUsd != null ? round2(amountUsd * (feePct / 100)) : null;
  return {
    currency: currencyForRegion(f.region),
    planLabel: planGroupLabel(platform, scope),
    feeLabel,
    feePct,
    amountUsd,
    feeAmountUsd,
    totalToSendUsd:
      amountUsd != null && feeAmountUsd != null ? round2(amountUsd + feeAmountUsd) : null,
  };
}

/**
 * @param {number | null | undefined} n
 * @param {'EUR' | 'USD'} [currency]
 */
export function formatUsd(n, currency = "USD") {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${currency === "EUR" ? "€" : "$"}${n.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
