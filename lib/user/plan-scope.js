/**
 * Plan scoping for ad accounts vs platform subscriptions.
 *
 * A user can hold more than one subscription for the same platform — e.g. Meta
 * White Hat SILVER *and* Meta VIP PLATINUM. Matching ad accounts to
 * subscriptions by `platformKey` alone made every Meta ad account show up under
 * every Meta subscription (2 accounts reported on a plan that only owns 1).
 *
 * A "plan scope" adds the plan identity (category + tier) to the platform key so
 * each ad account belongs to exactly one subscription.
 */

/**
 * @param {unknown} v
 * @returns {'vip' | 'white_hat' | null}
 */
export function normalizeAccountCategory(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "vip") return "vip";
  if (s === "white_hat" || s === "white hat" || s === "white-hat") {
    return "white_hat";
  }
  return null;
}

/** @param {'vip' | 'white_hat' | null} cat */
export function accountCategoryLabel(cat) {
  if (cat === "vip") return "VIP";
  if (cat === "white_hat") return "White Hat";
  return null;
}

/**
 * Read the plan identity out of a `flow` block (present on both ad-account and
 * subscription docs).
 * @param {unknown} flowRaw
 * @param {string} [platformIdFallback] — subscription docs also carry `platformId`
 */
export function readPlanScope(flowRaw, platformIdFallback) {
  const flow =
    flowRaw && typeof flowRaw === "object"
      ? /** @type {Record<string, unknown>} */ (flowRaw)
      : {};

  const platformKey =
    (typeof flow.platformKey === "string" && flow.platformKey
      ? flow.platformKey
      : typeof platformIdFallback === "string"
        ? platformIdFallback
        : ""
    ).toLowerCase();

  const category = normalizeAccountCategory(flow.accountCategory);
  const planTier =
    typeof flow.planTier === "string" && flow.planTier.trim()
      ? flow.planTier.trim().toUpperCase()
      : null;

  /** Scoped plans (currently Meta White Hat / VIP tiers) get an exact key. */
  const scopeKey =
    platformKey && category && planTier
      ? `${platformKey}|${category}|${planTier}`
      : null;

  const catLabel = accountCategoryLabel(category);
  const planLabel =
    catLabel && planTier ? `${catLabel} · ${planTier}` : planTier || null;

  return { platformKey, category, planTier, scopeKey, planLabel };
}

/**
 * Human label for a plan group, e.g. "Meta · VIP · PLATINUM".
 * @param {string} platformDisplay
 * @param {ReturnType<typeof readPlanScope>} scope
 */
export function planGroupLabel(platformDisplay, scope) {
  const platform = String(platformDisplay || scope.platformKey || "—") || "—";
  return scope.planLabel ? `${platform} · ${scope.planLabel}` : platform;
}

/**
 * Assign every ad account to at most one subscription.
 *
 * Exact plan-scope match wins. Ad accounts created before plan tiers were
 * stored (no category/tier on `flow`) fall back to the platform — but only when
 * the platform has a single subscription, so a legacy account can never be
 * double-counted across two plans of the same platform.
 *
 * @template {{ id: string, flow?: unknown }} A
 * @param {{ firestoreId?: string, id?: string, platformId?: string, flow?: unknown }[]} subscriptions
 * @param {A[]} adAccounts
 * @returns {{
 *   bySubscriptionId: Record<string, A[]>,
 *   unassigned: A[],
 * }}
 */
export function assignAdAccountsToSubscriptions(subscriptions, adAccounts) {
  /** @type {Record<string, A[]>} */
  const bySubscriptionId = {};
  /** Map scopeKey -> subscription id */
  const byScope = new Map();
  /** Map platformKey -> subscription ids */
  const byPlatform = new Map();

  for (const sub of subscriptions) {
    const subId = String(sub.firestoreId ?? sub.id ?? "");
    if (!subId) continue;
    bySubscriptionId[subId] = [];
    const scope = readPlanScope(sub.flow, sub.platformId);
    if (scope.scopeKey && !byScope.has(scope.scopeKey)) {
      byScope.set(scope.scopeKey, subId);
    }
    if (scope.platformKey) {
      const list = byPlatform.get(scope.platformKey) || [];
      list.push(subId);
      byPlatform.set(scope.platformKey, list);
    }
  }

  /** @type {A[]} */
  const unassigned = [];

  for (const ad of adAccounts) {
    const scope = readPlanScope(ad.flow);
    let subId = scope.scopeKey ? byScope.get(scope.scopeKey) : undefined;

    if (!subId && !scope.scopeKey && scope.platformKey) {
      const candidates = byPlatform.get(scope.platformKey) || [];
      if (candidates.length === 1) subId = candidates[0];
    }

    if (subId) bySubscriptionId[subId].push(ad);
    else unassigned.push(ad);
  }

  return { bySubscriptionId, unassigned };
}
