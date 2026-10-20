import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import { SHOP_DISCOUNT_FIELD, readShopDiscount } from "@/lib/shop/discount";

export const runtime = "nodejs";

/** GET — the signed-in customer's unused shop discount (or null), for checkout. */
export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const snap = await getAdminDb().collection("users").doc(user.uid).get();
  const d = readShopDiscount(snap.data()?.[SHOP_DISCOUNT_FIELD]);
  return NextResponse.json({
    discount: d
      ? {
          percent: d.percent,
          note: d.note,
          expiresAt: d.expiresAtMs ? new Date(d.expiresAtMs).toISOString() : null,
        }
      : null,
  });
}
