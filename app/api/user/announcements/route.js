import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import { listActiveAnnouncementsForUser } from "@/lib/announcements/server-announcements";

export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const announcements = await listActiveAnnouncementsForUser(
      getAdminDb(),
      user.uid
    );
    return NextResponse.json({ announcements });
  } catch (err) {
    console.error("[user/announcements GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
