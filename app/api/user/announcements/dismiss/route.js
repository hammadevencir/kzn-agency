import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import { dismissAnnouncementForUser } from "@/lib/announcements/server-announcements";
import { markNotificationIdsRead } from "@/lib/notifications/read-state";

export async function POST(request) {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const announcementId =
    typeof body?.announcementId === "string" ? body.announcementId.trim() : "";
  if (!announcementId) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const db = getAdminDb();
  const result = await dismissAnnouncementForUser(db, user.uid, announcementId);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 }
    );
  }

  await markNotificationIdsRead(db, user.uid, [`announcement-${announcementId}`]);

  return NextResponse.json({ ok: true });
}
