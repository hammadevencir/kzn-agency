import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireEndUserSession } from "@/lib/auth/require-user-session";
import { listArticlesForUser } from "@/lib/articles/server-articles";

export async function GET() {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const articles = await listArticlesForUser(getAdminDb());
    return NextResponse.json({ articles });
  } catch (err) {
    console.error("[user/articles GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
