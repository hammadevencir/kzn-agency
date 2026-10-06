import {
  PRIVATE_PRICING_SPEND_OPTIONS,
  PRIVATE_PRICING_MAX_FILES,
  PRIVATE_PRICING_MAX_FILE_BYTES,
  PRIVATE_PRICING_MAX_TOTAL_BYTES,
  PRIVATE_PRICING_ALLOWED_TYPES,
  resolvePrivatePricingContentType,
} from "./constants.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-.\s\d]{6,40}$/;

const FIELD_LIMITS = {
  fullName: 120,
  email: 160,
  phone: 40,
  company: 160,
  website: 300,
  niche: 160,
  currentSpend: 40,
  expectedSpend: 120,
  message: 3000,
};

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Accept "example.com" by prefixing https://; reject anything that isn't http(s). */
function normalizeWebsite(raw) {
  if (!raw) return { ok: true, value: null };
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) {
      return { ok: false };
    }
    return { ok: true, value: u.toString() };
  } catch {
    return { ok: false };
  }
}

/**
 * Validate the text fields of a private-pricing application.
 * @param {Record<string, unknown>} body plain object of form fields
 * @returns {{ ok: true, data: object } | { ok: false, error: string, field: string, message: string }}
 */
export function validatePrivatePricingFields(body) {
  const fail = (error, field, message) => ({ ok: false, error, field, message });

  for (const [field, max] of Object.entries(FIELD_LIMITS)) {
    const v = body?.[field];
    if (typeof v === "string" && v.trim().length > max) {
      return fail("too_long", field, `Please keep this under ${max} characters.`);
    }
  }

  const fullName = str(body?.fullName, FIELD_LIMITS.fullName);
  const email = str(body?.email, FIELD_LIMITS.email).toLowerCase();
  const phone = str(body?.phone, FIELD_LIMITS.phone);
  const company = str(body?.company, FIELD_LIMITS.company);
  const websiteRaw = str(body?.website, FIELD_LIMITS.website);
  const niche = str(body?.niche, FIELD_LIMITS.niche);
  const currentSpendRaw = str(body?.currentSpend, FIELD_LIMITS.currentSpend);
  const expectedSpend = str(body?.expectedSpend, FIELD_LIMITS.expectedSpend);
  const message = str(body?.message, FIELD_LIMITS.message);

  if (!fullName) return fail("missing_full_name", "fullName", "Please enter your full name.");
  if (!email) return fail("missing_email", "email", "Please enter your business email.");
  if (!EMAIL_RE.test(email)) {
    return fail("invalid_email", "email", "Please enter a valid email address.");
  }
  if (!phone) return fail("missing_phone", "phone", "Please enter your phone / WhatsApp.");
  if (!PHONE_RE.test(phone) || phone.replace(/\D/g, "").length < 6) {
    return fail("invalid_phone", "phone", "Please enter a valid phone number.");
  }
  if (!company) return fail("missing_company", "company", "Please enter your company or brand.");
  const website = normalizeWebsite(websiteRaw);
  if (!website.ok) {
    return fail("invalid_website", "website", "Please enter a valid website URL.");
  }
  if (!niche) return fail("missing_niche", "niche", "Please tell us your niche.");
  const currentSpend = PRIVATE_PRICING_SPEND_OPTIONS.find((o) => o === currentSpendRaw) ?? "";
  if (!currentSpend) {
    return fail("invalid_current_spend", "currentSpend", "Please select your current spend.");
  }
  if (!expectedSpend) {
    return fail(
      "missing_expected_spend",
      "expectedSpend",
      "Please enter your expected monthly spend."
    );
  }

  return {
    ok: true,
    data: {
      fullName,
      email,
      phone,
      company,
      website: website.value,
      niche,
      currentSpend,
      expectedSpend,
      message: message || null,
    },
  };
}

/**
 * Validate uploaded File entries (from `formData.getAll("files")`).
 * @param {unknown[]} entries
 * @returns {{ ok: true, files: { file: File, contentType: string }[] } | { ok: false, error: string, field: string, message: string }}
 */
export function validatePrivatePricingFiles(entries) {
  const fail = (error, message) => ({ ok: false, error, field: "files", message });
  const files = (Array.isArray(entries) ? entries : []).filter(
    (f) =>
      f &&
      typeof f === "object" &&
      typeof (/** @type {any} */ (f).arrayBuffer) === "function" &&
      /** @type {any} */ (f).size > 0
  );

  if (files.length === 0) {
    return fail("missing_files", "Please upload at least one screenshot or report.");
  }
  if (files.length > PRIVATE_PRICING_MAX_FILES) {
    return fail("too_many_files", `Please upload at most ${PRIVATE_PRICING_MAX_FILES} files.`);
  }

  let total = 0;
  const out = [];
  for (const file of /** @type {File[]} */ (files)) {
    const name = typeof file.name === "string" && file.name ? file.name : "file";
    const contentType = resolvePrivatePricingContentType(file.type, name);
    if (!contentType || !PRIVATE_PRICING_ALLOWED_TYPES.has(contentType)) {
      return fail(
        "unsupported_file_type",
        `"${name}" is not a supported file. Use PNG, JPG, WEBP, PDF, CSV or XLSX.`
      );
    }
    if (file.size > PRIVATE_PRICING_MAX_FILE_BYTES) {
      return fail("file_too_large", `"${name}" is larger than 10 MB.`);
    }
    total += file.size;
    out.push({ file, contentType });
  }
  if (total > PRIVATE_PRICING_MAX_TOTAL_BYTES) {
    return fail("payload_too_large", "Your files are too large in total (max 30 MB).");
  }
  return { ok: true, files: out };
}
