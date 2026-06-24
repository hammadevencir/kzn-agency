import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import { markNotificationIdsRead } from "@/lib/notifications/read-state";

export async function POST(request) {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (!ids.length) {
    return NextResponse.json({ error: "ids_required" }, { status: 400 });
  }

  const db = getAdminDb();
  await markNotificationIdsRead(db, user.uid, ids);

  return NextResponse.json({ ok: true });
}
