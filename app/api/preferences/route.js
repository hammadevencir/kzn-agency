import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/require-user-session";

/** GET — the signed-in customer's or admin's UI preferences (the colour theme). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const snap = await getAdminDb().collection("users").doc(user.uid).get();
  const theme = snap.exists && snap.data()?.uiTheme === "light" ? "light" : "dark";
  return NextResponse.json({ theme });
}

/** PUT { theme: 'dark' | 'light' } */
export async function PUT(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body?.theme !== "dark" && body?.theme !== "light") {
    return NextResponse.json({ error: "invalid_theme" }, { status: 400 });
  }
  await getAdminDb()
    .collection("users")
    .doc(user.uid)
    .set({ uiTheme: body.theme, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return NextResponse.json({ ok: true, theme: body.theme });
}
