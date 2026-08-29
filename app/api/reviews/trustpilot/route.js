import { NextResponse } from "next/server";
import {
  fetchTrustpilotReviews,
  TRUSTPILOT_PROFILE_URL,
  TRUSTPILOT_REVALIDATE_SECONDS,
} from "@/lib/reviews/trustpilot";

/**
 * Public endpoint — cached, so the marketing page costs one upstream call/hour.
 * Next requires a literal here; keep it in step with
 * TRUSTPILOT_REVALIDATE_SECONDS.
 */
export const revalidate = 3600;

export async function GET() {
  const reviews = await fetchTrustpilotReviews({ limit: 40 });

  return NextResponse.json(
    {
      profileUrl: TRUSTPILOT_PROFILE_URL,
      /** null when Trustpilot isn't configured — client keeps its static list. */
      reviews,
    },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${TRUSTPILOT_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
      },
    }
  );
}
