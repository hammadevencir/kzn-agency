/**
 * Time-zone names for the ad-account request forms: IANA ids shown as plain
 * words ("America/Argentina/Buenos Aires"), no GMT offsets — the client's ask.
 */

/** Used when the browser can't list zones (Intl.supportedValuesOf is missing). */
const FALLBACK_ZONES = [
  "Africa/Cairo", "Africa/Casablanca", "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi",
  "America/Argentina/Buenos_Aires", "America/Bogota", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Mexico_City", "America/New_York", "America/Sao_Paulo",
  "America/Toronto", "Asia/Bangkok", "Asia/Dubai", "Asia/Hong_Kong", "Asia/Jakarta",
  "Asia/Karachi", "Asia/Kolkata", "Asia/Manila", "Asia/Riyadh", "Asia/Seoul", "Asia/Shanghai",
  "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "Europe/Amsterdam", "Europe/Berlin",
  "Europe/Brussels", "Europe/Istanbul", "Europe/London", "Europe/Madrid", "Europe/Moscow",
  "Europe/Paris", "Europe/Rome", "Pacific/Auckland", "UTC",
];

/** @param {string} zone */
export function timezoneLabel(zone) {
  return String(zone || "").replace(/_/g, " ");
}

/** @returns {Array<{ value: string, label: string }>} */
export function timezoneOptions() {
  let zones = FALLBACK_ZONES;
  try {
    if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
      const list = Intl.supportedValuesOf("timeZone");
      if (Array.isArray(list) && list.length > 0) zones = list;
    }
  } catch {
    /* keep fallback */
  }
  return [...new Set(zones)]
    .sort((a, b) => a.localeCompare(b))
    .map((z) => ({ value: z, label: timezoneLabel(z) }));
}

