import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSection } from "@/lib/auth/require-user-session";
import {
  PRIVATE_PRICING_COLLECTION,
  PRIVATE_PRICING_STATUS,
} from "@/lib/private-pricing/constants";

/** Body: `{ status: "new" | "contacted" | "quoted" | "closed" }` */
export async function PATCH(request, context) {
  const gate = await requireAdminSection("contact-requests");
  if (gate.error) return gate.error;
  const admin = gate.user;

  const params = await context.params;
  const rawParamId = params?.id;
  const id =
    typeof rawParamId === "string"
      ? decodeURIComponent(rawParamId)
      : Array.isArray(rawParamId) && typeof rawParamId[0] === "string"
        ? decodeURIComponent(rawParamId[0])
        : "";
  if (!id || id.includes("/")) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const status = typeof body?.status === "string" ? body.status : "";
  if (!Object.values(PRIVATE_PRICING_STATUS).includes(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection(PRIVATE_PRICING_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await ref.set(
    {
      status,
      reviewedBy: admin.uid,
      statusChangedAt: { [status]: FieldValue.serverTimestamp() },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
