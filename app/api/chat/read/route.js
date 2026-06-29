import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user-session";
import { ROLE } from "@/lib/auth/constants";
import {
  markChatConversationRead,
  resolveConversationUserId,
} from "@/lib/chat/server-chat";
import { CHAT_SENDER_ROLE } from "@/lib/chat/constants";

export async function POST(request) {
  const session = await getSessionUser();
  if (!session || (session.role !== ROLE.ADMIN && session.role !== ROLE.USER)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const conversationUserId = resolveConversationUserId(
    session,
    body?.conversationUserId ?? body?.userId
  );

  if (!conversationUserId) {
    return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
  }

  const readerRole =
    session.role === ROLE.ADMIN ? CHAT_SENDER_ROLE.ADMIN : CHAT_SENDER_ROLE.USER;

  try {
    await markChatConversationRead(conversationUserId, readerRole);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[chat/read]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
