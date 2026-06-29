import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import { listChatConversations } from "@/lib/chat/server-chat";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await listChatConversations();
    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[chat/conversations]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
