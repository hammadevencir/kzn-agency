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
 * GET — list of approved ad accounts the user has not yet acknowledged.
 * These drive the post-approval banner on the dashboard.
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
      .filter((d) => !d.data()?.approvalAcknowledgedAt)
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
