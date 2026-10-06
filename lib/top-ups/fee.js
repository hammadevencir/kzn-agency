import {
  parseAmountToNumber,
  topUpFeeLabelOrDefault,
  topUpFeePctFromLabel,
} from "@/lib/ad-accounts/platform-request-config";
import { resolveTopUpFeeLabel } from "@/lib/meta/meta-plan-catalog";
import { planGroupLabel, readPlanScope } from "@/lib/user/plan-scope";
import { currencyForRegion } from "@/lib/ad-accounts/regions";

/** @param {number} n */
const round2 = (n) => Math.round(n * 100) / 100;

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
  const pricing =
    f.pricingSnapshot && typeof f.pricingSnapshot === "object"
      ? /** @type {Record<string, unknown>} */ (f.pricingSnapshot)
      : {};
  const feeLabel = topUpFeeLabelOrDefault(resolveTopUpFeeLabel(f, pricing.topUpFee));
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
