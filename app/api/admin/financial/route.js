import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSection } from "@/lib/auth/require-user-session";
import { ADMIN_SECTION } from "@/lib/auth/admin-permissions";
import { isIsoDay } from "@/lib/financial/constants";
import { buildFinancialReport } from "@/lib/financial/server-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/financial?from=YYYY-MM-DD&to=YYYY-MM-DD&tz=<minutes>
 *   - from/to: inclusive local days. Default: last 30 days. `all=1` ⇒ all time.
 *   - tz: browser `Date#getTimezoneOffset()` so days bucket in the admin's
 *     local time (default 0 = UTC).
 * Managers only (customer-service logins get 403).
 */
export async function GET(request) {
  const gate = await requireAdminSection(ADMIN_SECTION.FINANCIAL);
  if (gate.error) return gate.error;

  const { searchParams } = new URL(request.url);
  const tzRaw = Number.parseInt(searchParams.get("tz") || "0", 10);
  const tzOffsetMin = Number.isFinite(tzRaw) && Math.abs(tzRaw) <= 14 * 60 ? tzRaw : 0;

  let from = searchParams.get("from") || "";
  let to = searchParams.get("to") || "";
  const allTime = searchParams.get("all") === "1";
  if ((from && !isIsoDay(from)) || (to && !isIsoDay(to))) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
  if (!allTime && !from && !to) {
    const today = new Date(Date.now() - tzOffsetMin * 60000);
    to = today.toISOString().slice(0, 10);
    from = new Date(today.getTime() - 29 * 86400000).toISOString().slice(0, 10);
  }
  if (from && to && from > to) [from, to] = [to, from];

  try {
    const report = await buildFinancialReport(getAdminDb(), {
      from: from || null,
      to: to || null,
      tzOffsetMin,
    });
    return NextResponse.json(report);
  } catch (e) {
    console.error("[financial] report failed", e);
    return NextResponse.json({ error: "report_failed" }, { status: 500 });
  }
}
