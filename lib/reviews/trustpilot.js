/**
 * Trustpilot review feed.
 *
 * The website ships a hand-maintained list of reviews (see
 * `STATIC_TRUSTPILOT_REVIEWS` in the ClientReviews component). With the two env
 * vars below set, `/api/reviews/trustpilot` pulls the live feed instead, so new
 * Trustpilot reviews appear on the site without a code change.
 *
 * Required env:
 *   TRUSTPILOT_API_KEY            — Trustpilot Business "apikey" (Public API)
 *   TRUSTPILOT_BUSINESS_UNIT_ID   — the business unit id for our profile
 * Optional env:
 *   NEXT_PUBLIC_TRUSTPILOT_DOMAIN — review-profile domain (default below)
 */

/** Domain our Trustpilot profile lives under. */
export const TRUSTPILOT_DOMAIN =
  process.env.NEXT_PUBLIC_TRUSTPILOT_DOMAIN || "kazansolutions.com";

/** Public profile — where "read our reviews" sends visitors. */
export const TRUSTPILOT_PROFILE_URL = `https://www.trustpilot.com/review/${TRUSTPILOT_DOMAIN}`;

/** How long a fetched page of reviews is cached, in seconds. */
export const TRUSTPILOT_REVALIDATE_SECONDS = 3600;

/** Reviews below this star rating are not shown on the marketing site. */
const MIN_STARS = 4;

/** @param {unknown} v */
function str(v) {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Normalize one Trustpilot API review into the shape the carousel renders.
 * @param {Record<string, any>} r
 * @returns {{
 *   id: string, type: 'text', content: string, name: string, date: string,
 *   rating: number, verified: string, url: string
 * } | null}
 */
function normalizeReview(r) {
  const id = str(r?.id);
  const content = str(r?.text);
  const stars = Number(r?.stars);
  if (!id || !content || !Number.isFinite(stars) || stars < MIN_STARS) {
    return null;
  }

  const name = str(r?.consumer?.displayName) || "Consumer";

  let date = "";
  const createdAt = str(r?.createdAt);
  if (createdAt) {
    const ms = Date.parse(createdAt);
    if (!Number.isNaN(ms)) {
      date = new Date(ms).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }

  return {
    id: `tp-${id}`,
    type: "text",
    content,
    name,
    date,
    rating: Math.round(stars),
    verified: "Verified by Trust Pilot",
    url: `${TRUSTPILOT_PROFILE_URL}/reviews?reviewId=${encodeURIComponent(id)}`,
  };
}

/**
 * Fetch the latest public reviews for our business unit.
 * Returns `null` when Trustpilot is not configured or the call fails, so the
 * caller can fall back to the static list rather than render an empty section.
 *
 * @param {{ limit?: number }} [opts]
 */
export async function fetchTrustpilotReviews({ limit = 40 } = {}) {
  const apiKey = process.env.TRUSTPILOT_API_KEY;
  const businessUnitId = process.env.TRUSTPILOT_BUSINESS_UNIT_ID;
  if (!apiKey || !businessUnitId) return null;

  const url =
    `https://api.trustpilot.com/v1/business-units/${encodeURIComponent(businessUnitId)}/reviews` +
    `?perPage=${Math.min(Math.max(limit, 1), 100)}&orderBy=createdat.desc&language=en`;

  try {
    const res = await fetch(url, {
      headers: { apikey: apiKey },
      next: { revalidate: TRUSTPILOT_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const list = Array.isArray(data?.reviews) ? data.reviews : [];
    const reviews = list.map(normalizeReview).filter(Boolean);
    return reviews.length ? reviews : null;
  } catch {
    return null;
  }
}
