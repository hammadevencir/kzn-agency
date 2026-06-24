import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import { SUBSCRIPTIONS_COLLECTION } from "@/lib/subscriptions/constants";
import { AD_ACCOUNTS_COLLECTION } from "@/lib/ad-accounts/constants";
import { TOP_UPS_COLLECTION } from "@/lib/top-ups/constants";
import { buildUserInvoiceList } from "@/lib/user/build-user-invoice-list";

/**
 * All payment records for the signed-in user: platform subscriptions,
 * ad account requests, and ad account top-ups (wire transfer checkout flow).
 */
export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const [subscriptionsSnap, adAccountsSnap, topUpsSnap] = await Promise.all([
    db.collection(SUBSCRIPTIONS_COLLECTION).where("userId", "==", user.uid).get(),
    db.collection(AD_ACCOUNTS_COLLECTION).where("userId", "==", user.uid).get(),
    db.collection(TOP_UPS_COLLECTION).where("userId", "==", user.uid).get(),
  ]);

  const items = buildUserInvoiceList({
    subscriptionDocs: subscriptionsSnap.docs,
    adAccountDocs: adAccountsSnap.docs,
    topUpDocs: topUpsSnap.docs,
  });

  /** @type {{ displayName: string, photoURL: string | null, email: string | null }} */
  let viewer = { displayName: "", photoURL: null, email: user.email };
  try {
    const auth = getAdminAuth();
    const rec = await auth.getUser(user.uid);
    const snap = await db.collection("users").doc(user.uid).get();
    const fs = snap.exists ? snap.data() : {};
    viewer = {
      displayName: String(rec.displayName ?? fs?.displayName ?? "").trim(),
      photoURL: rec.photoURL ?? fs?.photoURL ?? null,
      email: rec.email ?? user.email ?? null,
    };
  } catch {
    /* keep defaults */
  }

  return NextResponse.json({ items, viewer });
}
