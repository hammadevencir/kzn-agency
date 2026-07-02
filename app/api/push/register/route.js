import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/require-user-session";
import { ROLE } from "@/lib/auth/constants";
import { getAdminDb } from "@/lib/firebase/admin";
import { removeFcmToken, saveFcmToken } from "@/lib/push/server-push";

export async function POST(request) {
  const session = await getSessionUser();
  if (
    !session ||
    (session.role !== ROLE.ADMIN &&
      session.role !== ROLE.USER &&
      session.role !== ROLE.MANAGER)
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const action = body?.action === "unregister" ? "unregister" : "register";

  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const db = getAdminDb();
  const userAgent = request.headers.get("user-agent");

  try {
    if (action === "unregister") {
      await removeFcmToken(db, session.uid, token);
      return NextResponse.json({ ok: true });
    }

    const result = await saveFcmToken(db, session.uid, token, { userAgent });
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/register POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
