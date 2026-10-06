import { PAYMENT_ACCOUNT_BY_CURRENCY, PAYMENT_CURRENCY } from "@/lib/payments/bank-details";

/**
 * Which currency / account the customer said they paid the monthly fee with
 * (EUR → Wise, USD → Slash), so admins know where to look for the money.
 * Defaults to USD/Slash — the only option before currency choice existed.
 *
 * @param {unknown} raw — `{ currency, amountLabel }` from the pay-now modal
 * @returns {{ paymentCurrency: 'EUR' | 'USD', paymentAccount: string, paymentAmountLabel: string | null }}
 */
export function sanitizePaymentMeta(raw) {
  const m = raw && typeof raw === "object" ? /** @type {Record<string, unknown>} */ (raw) : {};
  const currency =
    m.currency === PAYMENT_CURRENCY.EUR ? PAYMENT_CURRENCY.EUR : PAYMENT_CURRENCY.USD;
  const amountLabel =
    typeof m.amountLabel === "string" && m.amountLabel.trim()
      ? m.amountLabel.trim().slice(0, 64)
      : null;
  return {
    paymentCurrency: currency,
    paymentAccount: PAYMENT_ACCOUNT_BY_CURRENCY[currency],
    paymentAmountLabel: amountLabel,
  };
}
