import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import {
  AD_ACCOUNTS_COLLECTION,
  AD_ACCOUNT_STATUS,
} from "@/lib/ad-accounts/constants";

/** @param {unknown} ts */
function tsToIso(ts) {
  if (!ts) return null;
  try {
    if (typeof /** @type {any} */ (ts).toDate === "function") {
      return /** @type {any} */ (ts).toDate().toISOString();
    }
  } catch {
    /* noop */
  }
  return null;
}

/**
 * An approval stops being news after this long, or once the account has had a
 * top-up (the banner asks the customer to top up within 72 hours) — otherwise an
 * unacknowledged approval from weeks ago stays pinned to the top.
 */
const APPROVAL_BANNER_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** @param {Record<string, unknown>} data */
function isFreshApproval(data) {
  if (data.approvalAcknowledgedAt) return false;
  if (data.lastTopUpAt) return false;
  const reviewed = /** @type {any} */ (data.reviewedAt);
  const ms = reviewed && typeof reviewed.toMillis === "function" ? reviewed.toMillis() : 0;
  return ms > 0 && Date.now() - ms <= APPROVAL_BANNER_MAX_AGE_MS;
}

/**
 * GET — recent approved ad accounts the user has not yet acknowledged.
 * These drive the post-approval banners on the dashboard and Ad Accounts page.
 */
export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snap = await db
      .collection(AD_ACCOUNTS_COLLECTION)
      .where("userId", "==", user.uid)
      .where("status", "==", AD_ACCOUNT_STATUS.APPROVED)
      .get();

    const items = snap.docs
      .filter((d) => isFreshApproval(d.data() || {}))
      .map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          platformName:
            (typeof data.flow?.platformName === "string" &&
              data.flow.platformName) ||
            (typeof data.flow?.platformKey === "string" &&
              data.flow.platformKey) ||
            "",
          accountName:
            (typeof data.flow?.planName === "string" && data.flow.planName) ||
            (typeof data.checkout?.subscriptionName === "string" &&
              data.checkout.subscriptionName) ||
            "",
          reviewedAt: tsToIso(data.reviewedAt),
        };
      })
      .sort((a, b) => {
        const ta = a.reviewedAt ? Date.parse(a.reviewedAt) : 0;
        const tb = b.reviewedAt ? Date.parse(b.reviewedAt) : 0;
        return tb - ta;
      });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[ad-account-approvals GET] failed:", err);
    return NextResponse.json(
      { error: "approvals_fetch_failed" },
      { status: 500 }
    );
  }
}

/**
 * POST — mark one or more approvals as acknowledged so the banner stops
 * showing. If `ids` is omitted, every currently-unacknowledged approved
 * ad account for the user is acknowledged.
 */
export async function POST(request) {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  /** @type {string[] | undefined} */
  let ids;
  try {
    const body = await request.json().catch(() => ({}));
    if (Array.isArray(body?.ids)) {
      ids = body.ids.filter((x) => typeof x === "string" && x.trim());
    }
  } catch {
    /* body is optional */
  }

  try {
    const db = getAdminDb();
    const snap = await db
      .collection(AD_ACCOUNTS_COLLECTION)
      .where("userId", "==", user.uid)
      .where("status", "==", AD_ACCOUNT_STATUS.APPROVED)
      .get();

    const targets = snap.docs.filter((d) => {
      if (d.data()?.approvalAcknowledgedAt) return false;
      if (ids && ids.length > 0) return ids.includes(d.id);
      return true;
    });

    if (targets.length === 0) {
      return NextResponse.json({ ok: true, updated: 0 });
    }

    const batch = db.batch();
    for (const doc of targets) {
      batch.set(
        doc.ref,
        {
          approvalAcknowledgedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
    await batch.commit();

    return NextResponse.json({ ok: true, updated: targets.length });
  } catch (err) {
    console.error("[ad-account-approvals POST] failed:", err);
    return NextResponse.json(
      { error: "acknowledge_failed" },
      { status: 500 }
    );
  }
}
