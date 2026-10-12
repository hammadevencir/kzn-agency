import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/require-user-session";
import { getAdminBucket } from "@/lib/firebase/admin";

export const runtime = "nodejs";
// Avoid body-size limits on the default edge runtime.
export const maxDuration = 60;

const ALLOWED_KINDS = new Set(["subscription", "ad-account", "top-up", "order", "misc"]);
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]);
// Vercel serverless rejects bodies over ~4.5 MB; the client compresses images
// below this and rejects bigger PDFs (lib/user/upload-payment-proof.js).
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

function sanitizeName(name) {
  const base = (name || "proof").replace(/[^a-zA-Z0-9._-]+/g, "_");
  return base.slice(0, 120) || "proof";
}

export async function POST(request) {
  const user = await getSessionUser();
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
  const kindRaw = String(form.get("kind") || "misc").toLowerCase();
  const kind = ALLOWED_KINDS.has(kindRaw) ? kindRaw : "misc";

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const rawType = (file.type || "application/octet-stream").toLowerCase();
  const contentType = rawType === "image/jpg" ? "image/jpeg" : rawType;
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "unsupported_file_type" },
      { status: 400 }
    );
  }

  const size = typeof file.size === "number" ? file.size : 0;
  if (!size || size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: size ? "file_too_large" : "missing_file",
        message: size ? "File is too large — max 4 MB." : "The file is empty.",
      },
      { status: size ? 413 : 400 }
    );
  }

  let buffer;
  try {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch {
    return NextResponse.json({ error: "read_failed" }, { status: 400 });
  }

  const safeName = sanitizeName(file.name);
  const path = `payment-proofs/${user.uid}/${kind}-${Date.now()}-${safeName}`;

  let bucket;
  try {
    bucket = getAdminBucket();
  } catch (err) {
    console.error("[upload-proof] admin bucket init failed", err);
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
          uploadedBy: user.uid,
          kind,
          originalName: file.name || safeName,
          // The presence of this token is what makes the `?token=…` download
          // URL work; it mirrors what the client SDK's `getDownloadURL` does.
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
    });
  } catch (err) {
    console.error("[upload-proof] upload failed", err);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
