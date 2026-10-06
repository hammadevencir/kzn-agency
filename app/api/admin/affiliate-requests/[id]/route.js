import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSection } from "@/lib/auth/require-user-session";
import {
  AFFILIATE_REQUESTS_COLLECTION,
  AFFILIATE_REQUEST_STATUS,
} from "@/lib/affiliate-requests/constants";

export async function PATCH(request, context) {
  // Customer-service (support) admins cannot access this section.
  const gate = await requireAdminSection("affiliate-requests");
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
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const status = typeof body?.status === "string" ? body.status : "";
  if (!Object.values(AFFILIATE_REQUEST_STATUS).includes(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection(AFFILIATE_REQUESTS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await ref.set(
    {
      status,
      reviewedBy: admin.uid,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
