import { FieldValue } from "firebase-admin/firestore";

/**
 * Live EUR/USD market rate for cross-currency top-ups (server only).
 * Source: ECB reference rates via frankfurter.app (free, no API key).
 * Cached for an hour in memory and in Firestore (`config/fx_eur_usd`), so a
 * source outage falls back to the last known rate.
 */

const SOURCE_URL = "https://api.frankfurter.app/latest?from=EUR&to=USD";
const CACHE_MS = 60 * 60 * 1000;
/** Older than this, a stored rate is too stale to quote. */
const MAX_FALLBACK_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const FX_DOC = { collection: "config", id: "fx_eur_usd" };

/** @type {{ eurUsd: number, fetchedAtMs: number } | null} */
let memo = null;

async function fetchFromSource() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(SOURCE_URL, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const rate = Number(data?.rates?.USD);
    return Number.isFinite(rate) && rate > 0.5 && rate < 2 ? rate : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @returns {Promise<{ eurUsd: number, fetchedAtMs: number, stale: boolean } | null>}
 *   null when no rate is available at all.
 */
export async function getMarketEurUsd(db) {
  const now = Date.now();
  if (memo && now - memo.fetchedAtMs < CACHE_MS) {
    return { ...memo, stale: false };
  }

  const ref = db.collection(FX_DOC.collection).doc(FX_DOC.id);
  /** @type {{ eurUsd: number, fetchedAtMs: number } | null} */
  let stored = null;
  try {
    const snap = await ref.get();
    const d = snap.exists ? snap.data() : null;
    if (d && Number.isFinite(d.eurUsd) && Number.isFinite(d.fetchedAtMs)) {
      stored = { eurUsd: Number(d.eurUsd), fetchedAtMs: Number(d.fetchedAtMs) };
    }
  } catch {
    /* ignore — try the source */
  }
  if (stored && now - stored.fetchedAtMs < CACHE_MS) {
    memo = stored;
    return { ...stored, stale: false };
  }

  const fresh = await fetchFromSource();
  if (fresh) {
    memo = { eurUsd: fresh, fetchedAtMs: now };
    try {
      await ref.set(
        { eurUsd: fresh, fetchedAtMs: now, source: "frankfurter.app (ECB)", updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    } catch {
      /* cache write is best-effort */
    }
    return { ...memo, stale: false };
  }

  if (stored && now - stored.fetchedAtMs < MAX_FALLBACK_AGE_MS) {
    memo = stored;
    return { ...stored, stale: true };
  }
  return null;
}
