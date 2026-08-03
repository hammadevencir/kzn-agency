import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

import { getAdminBucket, getAdminDb } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/require-user-session";
import {
  createArticle,
  listArticlesForAdmin,
} from "@/lib/articles/server-articles";
import {
  ARTICLE_EXCERPT_LENGTH,
  ARTICLE_MAX_PDF_SIZE_BYTES,
  ARTICLE_MAX_TITLE_LENGTH,
} from "@/lib/articles/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

function sanitizeName(name) {
  const base = (name || "article").replace(/[^a-zA-Z0-9._-]+/g, "_");
  return base.slice(0, 120) || "article";
}

function buildExcerpt(text) {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= ARTICLE_EXCERPT_LENGTH) return collapsed;
  return `${collapsed.slice(0, ARTICLE_EXCERPT_LENGTH).trim()}…`;
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const articles = await listArticlesForAdmin(getAdminDb());
    return NextResponse.json({ articles });
  } catch (err) {
    console.error("[admin/articles GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const title = String(form.get("title") || "").trim().slice(0, ARTICLE_MAX_TITLE_LENGTH);
  const file = form.get("file");

  if (!title) {
    return NextResponse.json({ error: "missing_title" }, { status: 400 });
  }
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "unsupported_file_type" }, { status: 400 });
  }

  const size = typeof file.size === "number" ? file.size : 0;
  if (!size || size > ARTICLE_MAX_PDF_SIZE_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  let buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "read_failed" }, { status: 400 });
  }

  let extractedText = "";
  try {
    const parsed = await pdfParse(buffer);
    extractedText = String(parsed?.text || "").trim();
  } catch (err) {
    console.error("[admin/articles] pdf parse failed", err);
    return NextResponse.json({ error: "pdf_parse_failed" }, { status: 400 });
  }

  if (!extractedText) {
    return NextResponse.json({ error: "no_text_found" }, { status: 400 });
  }

  const db = getAdminDb();
  const safeName = sanitizeName(file.name);
  const path = `help-articles/${randomUUID()}/${safeName}`;

  let bucket;
  try {
    bucket = getAdminBucket();
  } catch (err) {
    console.error("[admin/articles] admin bucket init failed", err);
    return NextResponse.json({ error: "storage_unavailable" }, { status: 500 });
  }

  const downloadToken = randomUUID();
  try {
    await bucket.file(path).save(buffer, {
      contentType: "application/pdf",
      resumable: false,
      metadata: {
        contentType: "application/pdf",
        metadata: {
          uploadedBy: session.uid,
          originalName: file.name || safeName,
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });
  } catch (err) {
    console.error("[admin/articles] upload failed", err);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const pdfUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(
    bucket.name
  )}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;

  try {
    const result = await createArticle(db, {
      title,
      body: extractedText,
      excerpt: buildExcerpt(extractedText),
      pdfUrl,
      pdfPath: path,
      fileName: file.name || safeName,
      fileSize: size,
      adminUid: session.uid,
      adminEmail: session.email,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json({ id: result.id });
  } catch (err) {
    console.error("[admin/articles POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
