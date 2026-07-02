import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import {
  createAnnouncement,
  listAnnouncementsForAdmin,
} from "@/lib/announcements/server-announcements";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const announcements = await listAnnouncementsForAdmin(getAdminDb());
    return NextResponse.json({ announcements });
  } catch (err) {
    console.error("[admin/announcements GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const result = await createAnnouncement(getAdminDb(), {
      title: body?.title,
      body: body?.body,
      adminUid: session.uid,
      adminEmail: session.email,
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 }
      );
    }

    return NextResponse.json({ id: result.id });
  } catch (err) {
    console.error("[admin/announcements POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
