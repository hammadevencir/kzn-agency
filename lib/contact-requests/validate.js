import {
  CONTACT_REQUEST_TYPE,
  CONTACT_REQUEST_TYPE_OPTIONS,
  CONTACT_AD_ACCOUNT_PLATFORM_OPTIONS,
  CONTACT_GENDER_OPTIONS,
} from "./constants.js";
import { COUNTRIES } from "../countries.js";

const REQUEST_TYPE_VALUES = new Set(CONTACT_REQUEST_TYPE_OPTIONS.map((o) => o.value));
const PLATFORM_VALUES = new Set(CONTACT_AD_ACCOUNT_PLATFORM_OPTIONS.map((o) => o.value));
const GENDER_VALUES = new Set(CONTACT_GENDER_OPTIONS.map((o) => o.value));
const COUNTRY_VALUES = new Set(COUNTRIES);

/** Accept either the option value or its label (tolerates older/cached clients). */
function resolveOption(raw, options) {
  if (!raw) return "";
  const lower = raw.toLowerCase();
  const hit = options.find(
    (o) => o.value.toLowerCase() === lower || o.label.toLowerCase() === lower
  );
  return hit ? hit.value : "";
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Validate a public contact form payload.
 * @param {any} body
 * @returns {{ ok: true, data: object } | { ok: false, error: string, field: string, message: string }}
 */
export function validateContactRequest(body) {
  const firstName = str(body?.firstName, 60);
  const lastName = str(body?.lastName, 60);
  const phone = str(body?.phone, 40);
  const countryRaw = str(body?.country, 80);
  const discordOrTelegram = str(body?.discordOrTelegram, 80);
  const message = str(body?.message, 2000);

  const gender = resolveOption(str(body?.gender, 40), CONTACT_GENDER_OPTIONS);
  const requestType = resolveOption(str(body?.requestType, 60), CONTACT_REQUEST_TYPE_OPTIONS);
  const platformRaw = resolveOption(str(body?.platform, 40), CONTACT_AD_ACCOUNT_PLATFORM_OPTIONS);

  const country =
    COUNTRIES.find((c) => c.toLowerCase() === countryRaw.toLowerCase()) ?? "";

  const fail = (error, field, msg) => ({ ok: false, error, field, message: msg });

  if (!firstName) return fail("missing_first_name", "firstName", "First name is required.");
  if (!lastName) return fail("missing_last_name", "lastName", "Last name is required.");
  if (!phone) return fail("missing_phone", "phone", "Phone number is required.");
  if (!country || !COUNTRY_VALUES.has(country)) {
    return fail("invalid_country", "country", "Please select a valid country.");
  }
  if (!gender || !GENDER_VALUES.has(gender)) {
    return fail("invalid_gender", "gender", "Please select a gender.");
  }
  if (!requestType || !REQUEST_TYPE_VALUES.has(requestType)) {
    return fail("invalid_request_type", "requestType", "Please select a request type.");
  }
  const isAgency = requestType === CONTACT_REQUEST_TYPE.AGENCY_AD_ACCOUNTS;
  if (isAgency && !PLATFORM_VALUES.has(platformRaw)) {
    return fail("invalid_platform", "platform", "Please select a platform.");
  }
  if (requestType === CONTACT_REQUEST_TYPE.OTHER && !message) {
    return fail("missing_message", "message", "Tell us a bit about what you need.");
  }

  return {
    ok: true,
    data: {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      phone,
      country,
      gender,
      discordOrTelegram: discordOrTelegram || null,
      requestType,
      platform: isAgency ? platformRaw : null,
      message: message || null,
    },
  };
}
