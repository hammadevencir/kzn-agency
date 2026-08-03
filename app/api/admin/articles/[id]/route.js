import { NextResponse } from "next/server";
import { getAdminBucket, getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import { deleteArticle } from "@/lib/articles/server-articles";

export const runtime = "nodejs";

export async function DELETE(request, context) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const id = params?.id;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  try {
    const result = await deleteArticle(getAdminDb(), id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    if (result.pdfPath) {
      try {
        await getAdminBucket().file(result.pdfPath).delete();
      } catch (err) {
        console.error("[admin/articles DELETE] storage cleanup failed", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/articles DELETE]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
