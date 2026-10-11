/**
 * Feature switches for sections that exist in code but aren't ready to show.
 */

/**
 * Help Center (customer PDFs/articles). Hidden until the client has written
 * the guides, so customers don't find an empty section. While off, the
 * sidebar item is hidden and /user/help redirects to the dashboard.
 * Admins can still prepare articles under "Create KZN article".
 */
export const HELP_CENTER_ENABLED = false;
