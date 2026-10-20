import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { requireAdminSession } from "@/lib/auth/require-user-session";
import { getAdminBucket, getAdminDb } from "@/lib/firebase/admin";
import {
  MAX_DELIVERY_FILES,
  ORDERS_COLLECTION,
  ORDER_STATUS,
} from "@/lib/orders/constants";
import { serializeOrder } from "@/lib/orders/server-orders";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "text/csv",
]);
// Vercel serverless rejects bodies over ~4.5 MB (same cap as payment proofs).
const MAX_SIZE_BYTES = 4 * 1024 * 1024;

function sanitizeName(name) {
  const base = (name || "file").replace(/[^a-zA-Z0-9._-]+/g, "_");
  return base.slice(0, 120) || "file";
}

/**
 * POST — admin attaches one delivery file (PDF, image, zip…) to an order.
 * The customer sees the files with a download button once the order is
 * delivered. Stored with the Admin SDK (no client Storage access) and opened via
 * the token download URL, like payment proofs.
 */
export async function POST(request, context) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const id = typeof params?.id === "string" ? params.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const db = getAdminDb();
  const ref = db.collection(ORDERS_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (snap.data()?.status === ORDER_STATUS.CANCELLED) {
    return NextResponse.json({ error: "order_cancelled" }, { status: 409 });
  }
  const existing = Array.isArray(snap.data()?.deliveryFiles) ? snap.data().deliveryFiles : [];
  if (existing.length >= MAX_DELIVERY_FILES) {
    return NextResponse.json({ error: "too_many_files" }, { status: 409 });
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

  const rawType = (file.type || "application/octet-stream").toLowerCase();
  const contentType = rawType === "image/jpg" ? "image/jpeg" : rawType;
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json({ error: "unsupported_file_type" }, { status: 400 });
  }
  const size = typeof file.size === "number" ? file.size : 0;
  if (!size || size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: size ? "file_too_large" : "missing_file" },
      { status: size ? 413 : 400 }
    );
  }

  const safeName = sanitizeName(file.name);
  const path = `order-deliveries/${id}/${Date.now()}-${safeName}`;
  const downloadToken = randomUUID();

  try {
    const bucket = getAdminBucket();
    await bucket.file(path).save(Buffer.from(await file.arrayBuffer()), {
      contentType,
      resumable: false,
      metadata: {
        contentType,
        // Download with the original name.
        contentDisposition: `attachment; filename="${safeName}"`,
        metadata: {
          uploadedBy: admin.uid,
          orderId: id,
          originalName: file.name || safeName,
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(
      bucket.name
    )}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;

    await ref.update({
      deliveryFiles: FieldValue.arrayUnion({
        url,
        path,
        name: file.name || safeName,
        contentType,
        size,
      }),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("[admin/orders/files] upload failed", err);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const updated = await ref.get();
  return NextResponse.json({ item: serializeOrder(updated, { admin: true }) });
}
