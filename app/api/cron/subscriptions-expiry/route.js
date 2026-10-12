import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { sweepSubscriptionExpiries } from "@/lib/subscriptions/expiry-worker";

/**
 * Scheduled expiry sweep.
 *
 * Auth: expects `Authorization: Bearer <CRON_SECRET>` (env var `CRON_SECRET`).
 * In local dev the endpoint accepts unauthenticated calls when CRON_SECRET is
 * not set so you can trigger it manually from Postman or a browser tab. In
 * production a missing CRON_SECRET fails closed (anyone could otherwise run
 * the sweep that expires subscriptions and pauses ad accounts).
 */
async function runSweep(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    console.error("[cron/subscriptions-expiry] CRON_SECRET is not set — refusing to run.");
    return NextResponse.json({ error: "cron_secret_not_configured" }, { status: 500 });
  }
  if (secret) {
    const header =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const db = getAdminDb();
    const result = await sweepSubscriptionExpiries(db);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/subscriptions-expiry] failed:", err);
    return NextResponse.json({ error: "sweep_failed" }, { status: 500 });
  }
}

export async function GET(request) {
  return runSweep(request);
}

export async function POST(request) {
  return runSweep(request);
}
