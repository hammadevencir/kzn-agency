import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";

/**
 * GET — profile fields from Firebase Auth + Firestore (admin settings UI).
 */
export async function GET() {
  const user = await requireAdminSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  let rec;
  try {
    rec = await auth.getUser(user.uid);
  } catch {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const snap = await db.collection("users").doc(user.uid).get();
  const fs = snap.exists ? snap.data() : {};

  const hasPasswordProvider = Array.isArray(rec.providerData)
    ? rec.providerData.some((p) => p.providerId === "password")
    : false;

  return NextResponse.json({
    displayName: rec.displayName ?? fs?.displayName ?? "",
    email: rec.email ?? user.email ?? "",
    photoURL: rec.photoURL ?? fs?.photoURL ?? null,
    hasPasswordProvider,
  });
}

/**
 * PATCH — mirror Auth profile into Firestore after client updates Firebase Auth.
 */
export async function PATCH(request) {
  const user = await requireAdminSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  /** @type {Record<string, unknown>} */
  const payload = {
    displayName: displayName || null,
    email: email || user.email || null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (Object.prototype.hasOwnProperty.call(body, "photoURL")) {
    if (body.photoURL === null || body.photoURL === "") {
      payload.photoURL = null;
    } else if (typeof body.photoURL === "string") {
      const t = body.photoURL.trim();
      payload.photoURL = t || null;
    }
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  const authUpdate = {};
  if (displayName) authUpdate.displayName = displayName;
  if (Object.prototype.hasOwnProperty.call(body, "photoURL")) {
    authUpdate.photoURL = payload.photoURL || null;
  }
  if (Object.keys(authUpdate).length > 0) {
    try {
      await auth.updateUser(user.uid, authUpdate);
    } catch {
      /* best-effort — client already updated Auth directly */
    }
  }

  await db.collection("users").doc(user.uid).set(payload, { merge: true });

  return NextResponse.json({ ok: true });
}
