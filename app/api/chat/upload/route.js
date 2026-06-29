import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/require-user-session";
import { ROLE } from "@/lib/auth/constants";
import { getAdminBucket } from "@/lib/firebase/admin";
import {
  getEndUserProfile,
  resolveConversationUserId,
} from "@/lib/chat/server-chat";
import {
  CHAT_ALLOWED_ATTACHMENT_TYPES,
  CHAT_MAX_ATTACHMENT_BYTES,
} from "@/lib/chat/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

function sanitizeName(name) {
  const base = (name || "attachment").replace(/[^a-zA-Z0-9._-]+/g, "_");
  return base.slice(0, 120) || "attachment";
}

export async function POST(request) {
  const session = await getSessionUser();
  if (!session || (session.role !== ROLE.ADMIN && session.role !== ROLE.USER)) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  const conversationUserId = resolveConversationUserId(
    session,
    form.get("conversationUserId") ?? form.get("userId")
  );

  if (!conversationUserId) {
    return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
  }

  const profile = await getEndUserProfile(conversationUserId);
  if (!profile) {
    return NextResponse.json({ error: "invalid_user" }, { status: 400 });
  }

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const contentType = file.type || "application/octet-stream";
  if (!CHAT_ALLOWED_ATTACHMENT_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "unsupported_file_type" },
      { status: 400 }
    );
  }

  const size = typeof file.size === "number" ? file.size : 0;
  if (!size || size > CHAT_MAX_ATTACHMENT_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  let buffer;
  try {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch {
    return NextResponse.json({ error: "read_failed" }, { status: 400 });
  }

  const safeName = sanitizeName(file.name);
  const path = `chat-attachments/${conversationUserId}/${randomUUID()}-${safeName}`;

  let bucket;
  try {
    bucket = getAdminBucket();
  } catch (err) {
    console.error("[chat/upload] admin bucket init failed", err);
    return NextResponse.json(
      { error: "storage_unavailable" },
      { status: 500 }
    );
  }

  const object = bucket.file(path);
  const downloadToken = randomUUID();

  try {
    await object.save(buffer, {
      contentType,
      resumable: false,
      metadata: {
        contentType,
        metadata: {
          uploadedBy: session.uid,
          conversationUserId,
          originalName: file.name || safeName,
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const bucketName = bucket.name;
    const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(
      bucketName
    )}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;

    return NextResponse.json({
      url,
      path,
      name: file.name || safeName,
      contentType,
      size,
      uploadedAt: new Date().toISOString(),
      conversationUserId,
    });
  } catch (err) {
    console.error("[chat/upload] upload failed", err);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
