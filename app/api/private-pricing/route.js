import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminBucket, getAdminDb } from "@/lib/firebase/admin";
import {
  PRIVATE_PRICING_COLLECTION,
  PRIVATE_PRICING_HONEYPOT_FIELD,
  PRIVATE_PRICING_MAX_REQUEST_BYTES,
  PRIVATE_PRICING_STATUS,
  PRIVATE_PRICING_STORAGE_PREFIX,
} from "@/lib/private-pricing/constants";
import {
  validatePrivatePricingFields,
  validatePrivatePricingFiles,
} from "@/lib/private-pricing/validate";
import {
  clientIpFromRequest,
  consumePrivatePricingRateLimit,
  hashIp,
} from "@/lib/private-pricing/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const TEXT_FIELDS = [
  "fullName",
  "email",
  "phone",
  "company",
  "website",
  "niche",
  "currentSpend",
  "expectedSpend",
  "message",
];

function sanitizeName(name) {
  const base = String(name || "file").replace(/[^a-zA-Z0-9._-]+/g, "_");
  return base.slice(-120) || "file";
}

const GENERIC_FAIL_MESSAGE =
  "We couldn't send your application right now. Please try again, or reach us on WhatsApp or Telegram.";

/**
 * Public Legendary Package private-pricing application — no session required.
 * multipart/form-data: text fields + `files` (1–5). Files are stored with the
 * Admin SDK under `private-pricing/{requestId}/…`.
 * Validation failures return 400 `{ error, field, message }` so the form can show them.
 */
export async function POST(request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength && declaredLength > PRIVATE_PRICING_MAX_REQUEST_BYTES) {
    return NextResponse.json(
      {
        error: "payload_too_large",
        field: "files",
        message: "Your files are too large in total (max 30 MB).",
      },
      { status: 413 }
    );
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return NextResponse.json(
      { error: "invalid_form", message: "Invalid request. Please refresh the page and try again." },
      { status: 400 }
    );
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "invalid_form", message: "Invalid request. Please refresh the page and try again." },
      { status: 400 }
    );
  }

  // Honeypot: real users never see this field. Pretend success, store nothing.
  const honeypot = form.get(PRIVATE_PRICING_HONEYPOT_FIELD);
  if (typeof honeypot === "string" && honeypot.trim()) {
    return NextResponse.json({ ok: true });
  }

  /** @type {Record<string, unknown>} */
  const body = {};
  for (const key of TEXT_FIELDS) {
    const v = form.get(key);
    body[key] = typeof v === "string" ? v : "";
  }

  const fields = validatePrivatePricingFields(body);
  if (!fields.ok) {
    return NextResponse.json(
      { error: fields.error, field: fields.field, message: fields.message },
      { status: 400 }
    );
  }

  const files = validatePrivatePricingFiles(form.getAll("files"));
  if (!files.ok) {
    return NextResponse.json(
      { error: files.error, field: files.field, message: files.message },
      { status: 400 }
    );
  }

  let db;
  let bucket;
  try {
    db = getAdminDb();
    bucket = getAdminBucket();
  } catch (e) {
    console.error("private-pricing: admin SDK init failed", e);
    return NextResponse.json({ error: "save_failed", message: GENERIC_FAIL_MESSAGE }, { status: 500 });
  }

  const ipHash = hashIp(clientIpFromRequest(request));
  const limit = await consumePrivatePricingRateLimit(db, ipHash);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message:
          "You've sent several applications recently. Please wait a while before trying again.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec ?? 3600) } }
    );
  }

  const docRef = db.collection(PRIVATE_PRICING_COLLECTION).doc();
  const requestId = docRef.id;

  /** @type {{ name: string, path: string, url: string, contentType: string, size: number }[]} */
  const stored = [];
  try {
    for (let i = 0; i < files.files.length; i++) {
      const { file, contentType: fileType } = files.files[i];
      const originalName = typeof file.name === "string" && file.name ? file.name : `file-${i + 1}`;
      const path = `${PRIVATE_PRICING_STORAGE_PREFIX}/${requestId}/${i + 1}-${sanitizeName(originalName)}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const downloadToken = randomUUID();
      await bucket.file(path).save(buffer, {
        contentType: fileType,
        resumable: false,
        metadata: {
          contentType: fileType,
          contentDisposition: fileType.startsWith("image/") || fileType === "application/pdf"
            ? "inline"
            : `attachment; filename="${sanitizeName(originalName)}"`,
          metadata: {
            kind: "private-pricing",
            requestId,
            originalName: originalName.slice(0, 200),
            firebaseStorageDownloadTokens: downloadToken,
          },
        },
      });
      stored.push({
        name: originalName.slice(0, 200),
        path,
        url: `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(
          bucket.name
        )}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`,
        contentType: fileType,
        size: buffer.length,
      });
    }

    await docRef.set({
      ...fields.data,
      files: stored,
      status: PRIVATE_PRICING_STATUS.NEW,
      ipHash,
      userAgent: (request.headers.get("user-agent") || "").slice(0, 300) || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, id: requestId });
  } catch (e) {
    console.error("private-pricing: failed to save request", e);
    // Don't leave orphaned uploads behind.
    await Promise.allSettled(stored.map((f) => bucket.file(f.path).delete()));
    return NextResponse.json({ error: "save_failed", message: GENERIC_FAIL_MESSAGE }, { status: 500 });
  }
}
