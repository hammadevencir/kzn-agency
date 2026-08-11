import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  CONTACT_REQUESTS_COLLECTION,
  CONTACT_REQUEST_STATUS,
} from "@/lib/contact-requests/constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public contact form submission — no session required.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 120) : "";
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 200) : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim().slice(0, 40) : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 2000) : "";

  if (!name) {
    return NextResponse.json({ error: "missing_name" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "missing_message" }, { status: 400 });
  }

  const db = getAdminDb();
  const docRef = db.collection(CONTACT_REQUESTS_COLLECTION).doc();
  await docRef.set({
    name,
    email,
    phone: phone || null,
    message,
    status: CONTACT_REQUEST_STATUS.NEW,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: docRef.id });
}
