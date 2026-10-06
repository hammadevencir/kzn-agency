import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { SUBSCRIPTIONS_COLLECTION, SUBSCRIPTION_STATUS } from "@/lib/subscriptions/constants";
import { TOP_UPS_COLLECTION, TOP_UP_STATUS } from "@/lib/top-ups/constants";
import { ORDERS_COLLECTION, ORDER_STATUS, orderNumber } from "@/lib/orders/constants";
import { computeTopUpPricing } from "@/lib/top-ups/fee";
import {
  EUR_TO_USD_RATE,
  PAYMENT_ACCOUNT_BY_CURRENCY,
  eurToUsd,
} from "@/lib/payments/bank-details";
import {
  FINANCIAL_ACCOUNT,
  FINANCIAL_PAYOUTS_COLLECTION,
  FINANCIAL_TX_TYPE,
  isPassThroughPayoutCategory,
  payoutCategoryLabel,
} from "@/lib/financial/constants";

const REWARD_CLAIMS_COLLECTION = "reward-claims";
const DAY_MS = 24 * 60 * 60 * 1000;
/** Upper bound on daily rows (all-time ranges). */
const MAX_DAYS = 3660;
const MAX_RECENT = 500;

const round2 = (n) => Math.round(n * 100) / 100;

/** @param {number} amount @param {'EUR'|'USD'} currency */
function toUsd(amount, currency) {
  return currency === "EUR" ? round2(amount * EUR_TO_USD_RATE) : round2(amount);
}

/** @param {unknown} ts */
function tsMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") {
    try {
      return ts.toMillis();
    } catch {
      return 0;
    }
  }
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === "number") return ts;
  return 0;
}

/** @param {unknown} raw */
function parseNumber(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const m = raw.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number.parseFloat(m[0]);
  return Number.isFinite(n) ? n : null;
}

/**
 * `tzOffsetMin` follows `Date#getTimezoneOffset()` (UTC+2 ⇒ -120).
 * @param {number} ms @param {number} tzOffsetMin
 */
function localDay(ms, tzOffsetMin) {
  return new Date(ms - tzOffsetMin * 60000).toISOString().slice(0, 10);
}

/** @param {string} day @param {number} tzOffsetMin — local midnight → epoch ms */
function dayStartMs(day, tzOffsetMin) {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d) + tzOffsetMin * 60000;
}

/** @param {string} day @param {number} n */
function addDays(day, n) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Single-field range query (no composite index). Unbounded ⇒ full collection.
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} collection
 * @param {string} field
 * @param {number | null} minMs
 * @param {number | null} maxMs
 */
async function rangeDocs(db, collection, field, minMs, maxMs) {
  /** @type {import("firebase-admin/firestore").Query} */
  let q = db.collection(collection);
  if (minMs != null) q = q.where(field, ">=", Timestamp.fromMillis(minMs));
  if (maxMs != null) q = q.where(field, "<=", Timestamp.fromMillis(maxMs));
  try {
    const snap = await q.get();
    return snap.docs;
  } catch (e) {
    console.error(`[financial] ${collection} query failed`, e);
    return [];
  }
}

/**
 * Subscription payment for the current cycle, in the currency the customer
 * said they paid with.
 * @param {Record<string, any>} d
 * @returns {{ amount: number, currency: 'EUR'|'USD', account: string } | null}
 */
export function subscriptionPayment(d) {
  const paymentCurrency = d.paymentCurrency === "EUR" ? "EUR" : d.paymentCurrency === "USD" ? "USD" : null;
  const label =
    (typeof d.paymentAmountLabel === "string" && d.paymentAmountLabel.trim()) ||
    (typeof d.checkout?.amount === "string" ? d.checkout.amount : "") ||
    (typeof d.checkout?.amount === "number" ? String(d.checkout.amount) : "");
  const n = parseNumber(label);
  if (n == null || n <= 0) return null;
  const labelCurrency = label.includes("€") ? "EUR" : label.includes("$") ? "USD" : null;
  /** @type {'EUR'|'USD'} */
  let currency = labelCurrency || paymentCurrency || "USD";
  let amount = n;
  // Paid in USD against a EUR price label (no paymentAmountLabel stored).
  if (paymentCurrency === "USD" && currency === "EUR") {
    amount = eurToUsd(n);
    currency = "USD";
  }
  const account =
    d.paymentAccount === "wise" || d.paymentAccount === "slash"
      ? d.paymentAccount
      : PAYMENT_ACCOUNT_BY_CURRENCY[paymentCurrency || currency] || FINANCIAL_ACCOUNT.OTHER;
  return { amount: round2(amount), currency, account };
}

/** @param {Record<string, any>} c */
function rewardClaimAmountUsd(c) {
  if (typeof c.creditedAmountUsd === "number" && c.creditedAmountUsd > 0) return round2(c.creditedAmountUsd);
  if (typeof c.claimBalanceCents === "number" && c.claimBalanceCents > 0) {
    return round2(c.claimBalanceCents / 100);
  }
  const n = parseNumber(c.amount);
  return n != null && n > 0 ? round2(n) : 0;
}

/** @param {Record<string, any>} d */
function customerOf(d) {
  return (
    (typeof d.userName === "string" && d.userName.trim()) ||
    (typeof d.userEmail === "string" && d.userEmail.trim()) ||
    (typeof d.userId === "string" ? `#${d.userId.slice(0, 8)}` : "—")
  );
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{ from: string | null, to: string | null, tzOffsetMin: number }} opts
 *   `from`/`to` are inclusive local days; both null ⇒ all time.
 */
export async function buildFinancialReport(db, { from, to, tzOffsetMin }) {
  const minMs = from ? dayStartMs(from, tzOffsetMin) : null;
  const maxMs = to ? dayStartMs(to, tzOffsetMin) + DAY_MS - 1 : null;

  /** @type {Promise<FirebaseFirestore.QueryDocumentSnapshot[]>} */
  const payoutsP = (async () => {
    /** @type {import("firebase-admin/firestore").Query} */
    let q = db.collection(FINANCIAL_PAYOUTS_COLLECTION);
    if (from) q = q.where("date", ">=", from);
    if (to) q = q.where("date", "<=", to);
    try {
      return (await q.get()).docs;
    } catch (e) {
      console.error("[financial] payouts query failed", e);
      return [];
    }
  })();

  const [subDocs, topUpDocs, orderDocs, claimDocs, payoutDocs, pendingOrdersSnap] =
    await Promise.all([
      rangeDocs(db, SUBSCRIPTIONS_COLLECTION, "reviewedAt", minMs, maxMs),
      rangeDocs(db, TOP_UPS_COLLECTION, "reviewedAt", minMs, maxMs),
      rangeDocs(db, ORDERS_COLLECTION, "deliveredAt", minMs, maxMs),
      rangeDocs(db, REWARD_CLAIMS_COLLECTION, "reviewedAt", minMs, maxMs),
      payoutsP,
      db
        .collection(ORDERS_COLLECTION)
        .where("status", "==", ORDER_STATUS.PENDING)
        .get()
        .catch(() => null),
    ]);

  /** @type {Array<Record<string, any>>} */
  const tx = [];
  const topUpVolume = {
    count: 0,
    amountUsd: 0,
    byCurrency: { EUR: 0, USD: 0 },
    /** Amount + fee the customers sent in. */
    receivedUsd: 0,
  };

  for (const doc of subDocs) {
    const d = doc.data();
    if (d.status !== SUBSCRIPTION_STATUS.APPROVED && d.status !== SUBSCRIPTION_STATUS.EXPIRED) continue;
    const ms = tsMs(d.reviewedAt);
    const pay = subscriptionPayment(d);
    if (!ms || !pay) continue;
    const plan = d.checkout?.subscriptionName || d.flow?.displayPlatform || "Subscription";
    tx.push({
      id: `sub_${doc.id}`,
      sourceId: doc.id,
      ms,
      type: FINANCIAL_TX_TYPE.SUBSCRIPTION,
      direction: "in",
      customer: customerOf(d),
      description: `${plan}${d.isRenewal ? " · renewal" : ""}`,
      amount: pay.amount,
      currency: pay.currency,
      amountUsd: toUsd(pay.amount, pay.currency),
      account: pay.account,
    });
  }

  for (const doc of topUpDocs) {
    const d = doc.data();
    if (d.status !== TOP_UP_STATUS.APPROVED) continue;
    if (d.requestType === "balance_credit_request") continue;
    const ms = tsMs(d.reviewedAt);
    if (!ms) continue;
    const p =
      d.pricing && typeof d.pricing === "object" && d.pricing.amountUsd != null
        ? d.pricing
        : computeTopUpPricing(d.flow, String(d.checkout?.amount ?? ""));
    const currency = p.currency === "EUR" ? "EUR" : "USD";
    const amount = typeof p.amountUsd === "number" ? p.amountUsd : parseNumber(d.checkout?.amount) || 0;
    const fee = typeof p.feeAmountUsd === "number" ? p.feeAmountUsd : 0;
    const account = PAYMENT_ACCOUNT_BY_CURRENCY[currency];
    topUpVolume.count += 1;
    topUpVolume.amountUsd += toUsd(amount, currency);
    topUpVolume.byCurrency[currency] += amount;
    topUpVolume.receivedUsd += toUsd(amount + fee, currency);
    tx.push({
      id: `top_${doc.id}`,
      sourceId: doc.id,
      ms,
      type: FINANCIAL_TX_TYPE.TOP_UP_FEE,
      direction: "in",
      customer: customerOf(d),
      description: `${p.feeLabel || `${p.feePct ?? 0}%`} fee on ${currency === "EUR" ? "€" : "$"}${amount.toLocaleString("en-US")} top-up${p.planLabel ? ` · ${p.planLabel}` : ""}`,
      amount: fee,
      currency,
      amountUsd: toUsd(fee, currency),
      account,
      // Pass-through part — counted into the account's money-in, not revenue.
      passThroughAmount: amount,
      passThroughUsd: toUsd(amount, currency),
    });
  }

  for (const doc of orderDocs) {
    const d = doc.data();
    if (d.status !== ORDER_STATUS.DELIVERED) continue;
    const ms = tsMs(d.deliveredAt);
    const price = typeof d.priceUsd === "number" ? d.priceUsd : parseNumber(d.priceUsd);
    if (!ms || price == null || price <= 0) continue;
    tx.push({
      id: `ord_${doc.id}`,
      sourceId: doc.id,
      ms,
      type: FINANCIAL_TX_TYPE.ORDER,
      direction: "in",
      customer: customerOf(d),
      description: `${orderNumber(doc.id)} ${d.productName || "Shop order"}`,
      amount: round2(price),
      currency: "USD",
      amountUsd: round2(price),
      account: FINANCIAL_ACCOUNT.SLASH,
    });
  }

  for (const doc of claimDocs) {
    const c = doc.data();
    if (c.status !== "approved") continue;
    const ms = tsMs(c.reviewedAt);
    const amt = rewardClaimAmountUsd(c);
    if (!ms || amt <= 0) continue;
    const kind =
      c.claimType === "top-up" ? "credited to ad account" : c.claimType === "crypto" ? "crypto" : "cash-out";
    tx.push({
      id: `aff_${doc.id}`,
      sourceId: doc.id,
      ms,
      type: FINANCIAL_TX_TYPE.AFFILIATE_PAYOUT,
      direction: "out",
      customer: customerOf(c),
      description: `Affiliate reward (${kind})`,
      amount: amt,
      currency: "USD",
      amountUsd: amt,
      account: FINANCIAL_ACCOUNT.OTHER,
    });
  }

  /** @type {Array<Record<string, any>>} */
  const payouts = [];
  for (const doc of payoutDocs) {
    const p = doc.data();
    if (typeof p.date !== "string" || typeof p.amount !== "number") continue;
    const currency = p.currency === "EUR" ? "EUR" : "USD";
    const item = {
      id: doc.id,
      date: p.date,
      amount: p.amount,
      currency,
      amountUsd: toUsd(p.amount, currency),
      account: p.account || FINANCIAL_ACCOUNT.OTHER,
      category: p.category || "other",
      categoryLabel: payoutCategoryLabel(p.category),
      passThrough: isPassThroughPayoutCategory(p.category),
      description: p.description || "",
      note: p.note || "",
      createdByEmail: p.createdByEmail || null,
      createdAt: tsMs(p.createdAt) ? new Date(tsMs(p.createdAt)).toISOString() : null,
    };
    payouts.push(item);
    tx.push({
      id: `pay_${doc.id}`,
      sourceId: doc.id,
      // Midday local time so it lands on its own day in any view.
      ms: dayStartMs(p.date, tzOffsetMin) + DAY_MS / 2,
      day: p.date,
      type: FINANCIAL_TX_TYPE.PAYOUT,
      direction: "out",
      customer: "—",
      description: `${item.categoryLabel}${item.description ? ` · ${item.description}` : ""}`,
      amount: item.amount,
      currency,
      amountUsd: item.amountUsd,
      account: item.account,
      passThrough: item.passThrough,
    });
  }
  payouts.sort((a, b) => (a.date === b.date ? (b.createdAt || "").localeCompare(a.createdAt || "") : b.date.localeCompare(a.date)));

  for (const t of tx) t.day = t.day || localDay(t.ms, tzOffsetMin);

  // ---- Daily buckets ----------------------------------------------------
  const emptyDay = (date) => ({
    date,
    subscriptionRevenue: 0,
    topUpFees: 0,
    ordersRevenue: 0,
    income: 0,
    affiliatePayouts: 0,
    payouts: 0,
    payoutsPassThrough: 0,
    moneyOut: 0,
    net: 0,
    topUpVolume: 0,
  });
  /** @type {Map<string, ReturnType<typeof emptyDay>>} */
  const byDay = new Map();
  const startDay = from || tx.reduce((m, t) => (!m || t.day < m ? t.day : m), "") || localDay(Date.now(), tzOffsetMin);
  const endDay = to || localDay(Date.now(), tzOffsetMin);
  for (let day = startDay, i = 0; day <= endDay && i < MAX_DAYS; day = addDays(day, 1), i++) {
    byDay.set(day, emptyDay(day));
  }

  const totals = emptyDay(null);
  delete totals.date;
  const counts = { subscriptions: 0, topUps: 0, orders: 0, affiliatePayouts: 0, payouts: 0 };
  const subscriptionByCurrency = { EUR: 0, USD: 0 };
  const byAccount = {
    wise: { in: 0, out: 0, inByCurrency: { EUR: 0, USD: 0 }, outByCurrency: { EUR: 0, USD: 0 } },
    slash: { in: 0, out: 0, inByCurrency: { EUR: 0, USD: 0 }, outByCurrency: { EUR: 0, USD: 0 } },
    other: { in: 0, out: 0, inByCurrency: { EUR: 0, USD: 0 }, outByCurrency: { EUR: 0, USD: 0 } },
  };

  for (const t of tx) {
    let row = byDay.get(t.day);
    if (!row) {
      row = emptyDay(t.day);
      byDay.set(t.day, row);
    }
    const targets = [row, totals];
    const acct = byAccount[t.account] || byAccount.other;
    for (const r of targets) {
      if (t.type === FINANCIAL_TX_TYPE.SUBSCRIPTION) r.subscriptionRevenue += t.amountUsd;
      else if (t.type === FINANCIAL_TX_TYPE.TOP_UP_FEE) {
        r.topUpFees += t.amountUsd;
        r.topUpVolume += t.passThroughUsd || 0;
      } else if (t.type === FINANCIAL_TX_TYPE.ORDER) r.ordersRevenue += t.amountUsd;
      else if (t.type === FINANCIAL_TX_TYPE.AFFILIATE_PAYOUT) r.affiliatePayouts += t.amountUsd;
      else if (t.type === FINANCIAL_TX_TYPE.PAYOUT) {
        r.payouts += t.amountUsd;
        if (t.passThrough) r.payoutsPassThrough += t.amountUsd;
      }
    }
    if (t.type === FINANCIAL_TX_TYPE.SUBSCRIPTION) {
      counts.subscriptions += 1;
      subscriptionByCurrency[t.currency] += t.amount;
    } else if (t.type === FINANCIAL_TX_TYPE.TOP_UP_FEE) counts.topUps += 1;
    else if (t.type === FINANCIAL_TX_TYPE.ORDER) counts.orders += 1;
    else if (t.type === FINANCIAL_TX_TYPE.AFFILIATE_PAYOUT) counts.affiliatePayouts += 1;
    else counts.payouts += 1;

    const gross = t.amount + (t.passThroughAmount || 0);
    const grossUsd = t.amountUsd + (t.passThroughUsd || 0);
    if (t.direction === "in") {
      acct.in += grossUsd;
      acct.inByCurrency[t.currency] += gross;
    } else {
      acct.out += grossUsd;
      acct.outByCurrency[t.currency] += gross;
    }
  }

  /** @param {ReturnType<typeof emptyDay>} r */
  const finish = (r) => {
    r.income = r.subscriptionRevenue + r.topUpFees + r.ordersRevenue;
    r.moneyOut = r.payouts + r.affiliatePayouts;
    // Net = what KAZAN keeps: income minus every outflow that is not
    // pass-through ad-platform funding.
    r.net = r.income - r.affiliatePayouts - (r.payouts - r.payoutsPassThrough);
    for (const k of Object.keys(r)) if (typeof r[k] === "number") r[k] = round2(r[k]);
    return r;
  };

  const daily = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)).map(finish);
  finish(totals);
  for (const a of Object.values(byAccount)) {
    a.in = round2(a.in);
    a.out = round2(a.out);
    a.net = round2(a.in - a.out);
    for (const c of ["EUR", "USD"]) {
      a.inByCurrency[c] = round2(a.inByCurrency[c]);
      a.outByCurrency[c] = round2(a.outByCurrency[c]);
    }
  }
  topUpVolume.amountUsd = round2(topUpVolume.amountUsd);
  topUpVolume.receivedUsd = round2(topUpVolume.receivedUsd);
  topUpVolume.byCurrency.EUR = round2(topUpVolume.byCurrency.EUR);
  topUpVolume.byCurrency.USD = round2(topUpVolume.byCurrency.USD);
  topUpVolume.fundedToPlatformsUsd = totals.payoutsPassThrough;

  let ordersInProgress = { count: 0, amountUsd: 0 };
  if (pendingOrdersSnap) {
    for (const doc of pendingOrdersSnap.docs) {
      const price = parseNumber(doc.data().priceUsd);
      if (price != null && price > 0) {
        ordersInProgress.count += 1;
        ordersInProgress.amountUsd += price;
      }
    }
    ordersInProgress.amountUsd = round2(ordersInProgress.amountUsd);
  }

  tx.sort((a, b) => b.ms - a.ms);
  const recent = tx.slice(0, MAX_RECENT).map((t) => ({
    id: t.id,
    sourceId: t.sourceId,
    date: new Date(t.ms).toISOString(),
    day: t.day,
    type: t.type,
    direction: t.direction,
    customer: t.customer,
    description: t.description,
    amount: t.amount,
    currency: t.currency,
    amountUsd: t.amountUsd,
    account: t.account,
    passThrough: Boolean(t.passThrough),
  }));

  return {
    range: { from: from || startDay, to: endDay, allTime: !from && !to },
    eurToUsdRate: EUR_TO_USD_RATE,
    daily,
    totals: {
      ...totals,
      counts,
      subscriptionByCurrency: {
        EUR: round2(subscriptionByCurrency.EUR),
        USD: round2(subscriptionByCurrency.USD),
      },
    },
    byAccount,
    topUpVolume,
    ordersInProgress,
    payouts,
    recent,
    recentTruncated: tx.length > MAX_RECENT,
  };
}
