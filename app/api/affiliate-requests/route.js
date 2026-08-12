import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  AFFILIATE_REQUESTS_COLLECTION,
  AFFILIATE_REQUEST_STATUS,
  AFFILIATE_GENDER_OPTIONS,
  COMMUNITY_FOCUS_OPTIONS,
  COMMUNITY_SIZE_OPTIONS,
  PROGRAM_PLATFORM_OPTIONS,
  EXPECTED_CLIENTS_OPTIONS,
} from "@/lib/affiliate-requests/constants";
import { COUNTRIES } from "@/lib/countries";

const GENDER_VALUES = new Set(AFFILIATE_GENDER_OPTIONS.map((o) => o.value));
const FOCUS_VALUES = new Set(COMMUNITY_FOCUS_OPTIONS.map((o) => o.value));
const SIZE_VALUES = new Set(COMMUNITY_SIZE_OPTIONS.map((o) => o.value));
const PLATFORM_VALUES = new Set(PROGRAM_PLATFORM_OPTIONS.map((o) => o.value));
const CLIENTS_VALUES = new Set(EXPECTED_CLIENTS_OPTIONS.map((o) => o.value));
const COUNTRY_VALUES = new Set(COUNTRIES);

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Public "Become an Affiliate" application submission — no session required.
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
  const communityFocus = str(body?.communityFocus, 40);
  const communityFocusOther = str(body?.communityFocusOther, 200);
  const communitySize = str(body?.communitySize, 20);
  const platformOther = str(body?.platformOther, 80);
  const expectedClients = str(body?.expectedClients, 20);

  const platforms = Array.isArray(body?.platforms)
    ? [...new Set(body.platforms.filter((p) => typeof p === "string"))].slice(0, 10)
    : [];

  if (!firstName) return NextResponse.json({ error: "missing_first_name" }, { status: 400 });
  if (!lastName) return NextResponse.json({ error: "missing_last_name" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "missing_phone" }, { status: 400 });
  if (!country || !COUNTRY_VALUES.has(country)) {
    return NextResponse.json({ error: "invalid_country" }, { status: 400 });
  }
  if (!gender || !GENDER_VALUES.has(gender)) {
    return NextResponse.json({ error: "invalid_gender" }, { status: 400 });
  }
  if (!communityFocus || !FOCUS_VALUES.has(communityFocus)) {
    return NextResponse.json({ error: "invalid_community_focus" }, { status: 400 });
  }
  if (communityFocus === "other" && !communityFocusOther) {
    return NextResponse.json({ error: "missing_community_focus_other" }, { status: 400 });
  }
  if (!communitySize || !SIZE_VALUES.has(communitySize)) {
    return NextResponse.json({ error: "invalid_community_size" }, { status: 400 });
  }
  if (platforms.length === 0 || !platforms.every((p) => PLATFORM_VALUES.has(p))) {
    return NextResponse.json({ error: "invalid_platforms" }, { status: 400 });
  }
  if (platforms.includes("other") && !platformOther) {
    return NextResponse.json({ error: "missing_platform_other" }, { status: 400 });
  }
  if (!expectedClients || !CLIENTS_VALUES.has(expectedClients)) {
    return NextResponse.json({ error: "invalid_expected_clients" }, { status: 400 });
  }

  const db = getAdminDb();
  const docRef = db.collection(AFFILIATE_REQUESTS_COLLECTION).doc();
  await docRef.set({
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    phone,
    country,
    gender,
    discordOrTelegram: discordOrTelegram || null,
    communityFocus,
    communityFocusOther: communityFocus === "other" ? communityFocusOther : null,
    communitySize,
    platforms,
    platformOther: platforms.includes("other") ? platformOther : null,
    expectedClients,
    status: AFFILIATE_REQUEST_STATUS.NEW,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: docRef.id });
}
