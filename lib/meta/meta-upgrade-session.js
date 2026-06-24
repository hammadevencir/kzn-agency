/** Session marker: user explicitly left Meta plan / upgrade UI for dashboard. */

const KEY = "kzn_metaUpgradeExitedToDashboard";

/** How long the exit marker blocks the dashboard → subscribe deep-link redirect. */
const EXIT_MARK_TTL_MS = 20_000;

export function markMetaUpgradeExitToDashboard() {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ t: Date.now() })
    );
  } catch {
    /* private mode / disabled storage */
  }
}

/**
 * If the user just chose to return to the dashboard, skip auto-redirect to Meta subscribe.
 * @returns {boolean}
 */
export function consumeMetaUpgradeExitToDashboard() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return false;
    sessionStorage.removeItem(KEY);
    const o = JSON.parse(raw);
    if (!o || typeof o.t !== "number") return false;
    return Date.now() - o.t < EXIT_MARK_TTL_MS;
  } catch {
    return false;
  }
}
