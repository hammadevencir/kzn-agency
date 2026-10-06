export const BANK_DETAILS_TITLE = "Bank Details KAZAN Solutions";
export const BANK_DETAILS_CURRENCY_NOTE = "(ONLY USD)";

export const BANK_DETAILS_HELPER_TEXT =
  "Add funds via USD wire transfer only. Upload a PDF for verification, and we'll credit your account.";

export const BANK_DETAILS_COMPACT_HELPER_TEXT =
  "Send USD via wire transfer. Use the reference details if your bank requires them.";

/** @type {ReadonlyArray<{ label: string, value: string }>} */
export const BANK_DETAILS_FIELDS = [
  { label: "Beneficiary Name:", value: "KZ Digital Media Group LLC" },
  { label: "Account Number:", value: "681853881872955" },
  { label: "Routing Number:", value: "121145307" },
  { label: "SWIFT Code:", value: "CLNOUS66XXX" },
  {
    label: "Beneficiary Address:",
    value: "30 N Gould St Ste R Sheridan, WY 82801-6317, US",
  },
  { label: "Bank Name:", value: "Column N.A., Member FDIC" },
  {
    label: "Bank Address:",
    value: "1 Letterman Drive, Suite A4-700 San Francisco, CA 94129, US",
  },
];

/** Shown under every set of bank details (USD and, later, EUR). */
export const PAYMENT_REFERENCE_NOTE =
  "Please do not include words like \u201cfb\u201d, \u201cad\u201d, \u201ctop-up\u201d, \u201corder\u201d, or your name in the payment reference, this may cause issues with the bank and we can't process your top-up. You can simply write your Dashboard Account ID.";

export const PAYMENT_REFERENCE_PLACEHOLDER = "ENTER YOUR DASHBOARD ACCOUNT ID";

/* ------------------------------------------------------------------ */
/* Payment currency: customers pay the monthly fee in EUR (Wise) or    */
/* USD (Slash). Ad-account top-ups follow the account's region.        */
/* ------------------------------------------------------------------ */

export const PAYMENT_CURRENCY = { EUR: "EUR", USD: "USD" };

/** Fixed rate the client set: €1 = $1.22. */
export const EUR_TO_USD_RATE = 1.22;

/** @param {number} eur @returns {number} whole dollars, rounded */
export function eurToUsd(eur) {
  return Math.round(eur * EUR_TO_USD_RATE);
}

/**
 * Convert a stored price label ("€499/mo", "€199/month", "€0") to the chosen
 * currency. USD labels pass through; EUR → USD uses EUR_TO_USD_RATE.
 * @param {string | null | undefined} label
 * @param {'EUR' | 'USD'} currency
 * @returns {string}
 */
export function priceLabelInCurrency(label, currency) {
  const s = String(label ?? "").trim();
  if (!s || s === "—") return s || "—";
  const isEur = s.includes("€");
  if (currency === PAYMENT_CURRENCY.EUR || !isEur) return s;
  return s.replace(/€\s*([\d.,]+)/, (_m, num) => {
    const n = Number.parseFloat(String(num).replace(/,/g, ""));
    return Number.isFinite(n) ? `$${eurToUsd(n).toLocaleString("en-US")}` : _m;
  });
}

/** Which bank account receives a payment in this currency. */
export const PAYMENT_ACCOUNT_BY_CURRENCY = { EUR: "wise", USD: "slash" };

/** USD → Slash (the existing USD wire account above, held at Column N.A.). */
export const SLASH_USD_FIELDS = BANK_DETAILS_FIELDS;

/** EUR → Wise. Option 1: bank transfer. */
export const WISE_EUR_FIELDS = [
  { label: "Beneficiary Name:", value: "KZ Digital Media Group LLC" },
  { label: "IBAN:", value: "BE27 9059 1606 4973" },
  { label: "Routing Number:", value: "121145307" },
  { label: "SWIFT / BIC:", value: "TRWIBEB1XXX (when sending from outside SEPA)" },
  {
    label: "Beneficiary Address:",
    value: "30 N Gould St Ste R Sheridan, WY 82801-6317, US",
  },
  {
    label: "Bank Name & Address:",
    value: "Wise, Rue du Trône 100, 3rd floor, Brussels, 1050, Belgium",
  },
];

/** EUR → Wise. Option 2: Wise to Wise (preferred). */
export const WISE_TO_WISE = {
  accountName: "KZ Digital Media Group LLC",
  tag: "@kzdigitalmediagroupllc",
  paymentLink: "https://wise.com/pay/business/kzdigitalmediagroupllc",
  qrImage: "/payments/wise-qr.png",
};
