import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { requireEndUserSession } from "@/lib/auth/require-user-session";
import { getAdminBucket } from "@/lib/firebase/admin";
import {
  CREATIVE_ALLOWED_TYPES,
  CREATIVE_MAX_SIZE_BYTES,
  CREATIVES_STORAGE_PREFIX,
  creativeContentTypeFromName,
} from "@/lib/ad-accounts/request-creatives";

export const runtime = "nodejs";
export const maxDuration = 60;

function sanitizeName(name) {
  const base = (name || "creative").replace(/[^a-zA-Z0-9._-]+/g, "_");
  return base.slice(0, 120) || "creative";
}

/**
 * Upload one creative image attached to an ad-account request form.
 * Stored via the Admin SDK under `request-creatives/{uid}/…` (bypasses client
 * Storage rules / bucket CORS, same as `/api/payments/upload-proof`).
 */
export async function POST(request) {
  const user = await requireEndUserSession();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  // Some mobile browsers send an empty MIME type — fall back to the extension.
  const contentType =
    (file.type && file.type.toLowerCase()) ||
    creativeContentTypeFromName(file.name) ||
    "application/octet-stream";
  if (!CREATIVE_ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "unsupported_file_type" },
      { status: 400 }
    );
  }

  const size = typeof file.size === "number" ? file.size : 0;
  if (!size || size > CREATIVE_MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  let buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "read_failed" }, { status: 400 });
  }

  const safeName = sanitizeName(file.name);
  const path = `${CREATIVES_STORAGE_PREFIX}/${user.uid}/${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;

  let bucket;
  try {
    bucket = getAdminBucket();
  } catch (err) {
    console.error("[upload-creatives] admin bucket init failed", err);
    return NextResponse.json({ error: "storage_unavailable" }, { status: 500 });
  }

  const downloadToken = randomUUID();
  try {
    await bucket.file(path).save(buffer, {
      contentType,
      resumable: false,
      metadata: {
        contentType,
        metadata: {
          uploadedBy: user.uid,
          kind: "request-creative",
          originalName: file.name || safeName,
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(
      bucket.name
    )}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;

    return NextResponse.json({
      url,
      path,
      name: file.name || safeName,
      contentType,
      size,
      uploadedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[upload-creatives] upload failed", err);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
