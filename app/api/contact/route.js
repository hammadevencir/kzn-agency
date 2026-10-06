import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  CONTACT_REQUESTS_COLLECTION,
  CONTACT_REQUEST_STATUS,
} from "@/lib/contact-requests/constants";
import { validateContactRequest } from "@/lib/contact-requests/validate";

/**
 * Public contact form submission — no session required.
 * Validation failures return 400 `{ error, field, message }` so the form can show them.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Invalid request. Please refresh the page and try again." },
      { status: 400 }
    );
  }

  const result = validateContactRequest(body);
  if (!result.ok) {
    console.warn("contact: validation failed", result.error, {
      country: body?.country,
      gender: body?.gender,
      requestType: body?.requestType,
    });
    return NextResponse.json(
      { error: result.error, field: result.field, message: result.message },
      { status: 400 }
    );
  }

  try {
    const db = getAdminDb();
    const docRef = db.collection(CONTACT_REQUESTS_COLLECTION).doc();
    await docRef.set({
      ...result.data,
      status: CONTACT_REQUEST_STATUS.NEW,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (e) {
    console.error("contact: failed to save request", e);
    return NextResponse.json(
      {
        error: "save_failed",
        message:
          "We couldn't send your request right now. Please try again, or reach us on WhatsApp or Telegram.",
      },
      { status: 500 }
    );
  }
}
