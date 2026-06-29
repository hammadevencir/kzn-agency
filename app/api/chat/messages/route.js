import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user-session";
import { ROLE } from "@/lib/auth/constants";
import {
  getChatMessages,
  resolveConversationUserId,
  sendChatMessage,
} from "@/lib/chat/server-chat";

export async function GET(request) {
  const session = await getSessionUser();
  if (!session || (session.role !== ROLE.ADMIN && session.role !== ROLE.USER)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationUserId = resolveConversationUserId(
    session,
    searchParams.get("userId")
  );

  if (!conversationUserId) {
    return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
  }

  try {
    const messages = await getChatMessages(conversationUserId);
    return NextResponse.json({ messages, conversationUserId });
  } catch (err) {
    console.error("[chat/messages GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

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

  try {
    const result = await sendChatMessage(conversationUserId, session, {
      text: body?.text,
      attachment: body?.attachment,
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 }
      );
    }

    return NextResponse.json({ id: result.id, conversationUserId });
  } catch (err) {
    console.error("[chat/messages POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
