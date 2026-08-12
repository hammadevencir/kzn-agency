import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  CONTACT_REQUESTS_COLLECTION,
  CONTACT_REQUEST_STATUS,
  CONTACT_REQUEST_TYPE,
  CONTACT_REQUEST_TYPE_OPTIONS,
  CONTACT_AD_ACCOUNT_PLATFORM_OPTIONS,
  CONTACT_GENDER_OPTIONS,
} from "@/lib/contact-requests/constants";
import { COUNTRIES } from "@/lib/countries";

const REQUEST_TYPE_VALUES = new Set(CONTACT_REQUEST_TYPE_OPTIONS.map((o) => o.value));
const PLATFORM_VALUES = new Set(CONTACT_AD_ACCOUNT_PLATFORM_OPTIONS.map((o) => o.value));
const GENDER_VALUES = new Set(CONTACT_GENDER_OPTIONS.map((o) => o.value));
const COUNTRY_VALUES = new Set(COUNTRIES);

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

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

  const firstName = str(body?.firstName, 60);
  const lastName = str(body?.lastName, 60);
  const phone = str(body?.phone, 40);
  const country = str(body?.country, 60);
  const gender = str(body?.gender, 30);
  const discordOrTelegram = str(body?.discordOrTelegram, 80);
  const requestType = str(body?.requestType, 40);
  const platform = str(body?.platform, 30);
  const message = str(body?.message, 2000);

  if (!firstName) {
    return NextResponse.json({ error: "missing_first_name" }, { status: 400 });
  }
  if (!lastName) {
    return NextResponse.json({ error: "missing_last_name" }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "missing_phone" }, { status: 400 });
  }
  if (!country || !COUNTRY_VALUES.has(country)) {
    return NextResponse.json({ error: "invalid_country" }, { status: 400 });
  }
  if (!gender || !GENDER_VALUES.has(gender)) {
    return NextResponse.json({ error: "invalid_gender" }, { status: 400 });
  }
  if (!requestType || !REQUEST_TYPE_VALUES.has(requestType)) {
    return NextResponse.json({ error: "invalid_request_type" }, { status: 400 });
  }
  if (requestType === CONTACT_REQUEST_TYPE.AGENCY_AD_ACCOUNTS && !PLATFORM_VALUES.has(platform)) {
    return NextResponse.json({ error: "invalid_platform" }, { status: 400 });
  }
  if (requestType === CONTACT_REQUEST_TYPE.OTHER && !message) {
    return NextResponse.json({ error: "missing_message" }, { status: 400 });
  }

  const db = getAdminDb();
  const docRef = db.collection(CONTACT_REQUESTS_COLLECTION).doc();
  await docRef.set({
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    phone,
    country,
    gender,
    discordOrTelegram: discordOrTelegram || null,
    requestType,
    platform: requestType === CONTACT_REQUEST_TYPE.AGENCY_AD_ACCOUNTS ? platform : null,
    message: message || null,
    status: CONTACT_REQUEST_STATUS.NEW,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: docRef.id });
}
