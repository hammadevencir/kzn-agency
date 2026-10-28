import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import { getMarketEurUsd } from "@/lib/payments/fx-server";
import { appliedRate } from "@/lib/payments/fx";

/**
 * GET — current rates for a cross-currency top-up quote. Returns only the
 * rates the customer gets (margin already applied), never the margin itself.
 */
export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const market = await getMarketEurUsd(getAdminDb());
  if (!market) {
    return NextResponse.json({ available: false });
  }
  return NextResponse.json({
    available: true,
    rates: {
      payEur: appliedRate("EUR", market.eurUsd),
      payUsd: appliedRate("USD", market.eurUsd),
    },
    fetchedAtMs: market.fetchedAtMs,
  });
}
