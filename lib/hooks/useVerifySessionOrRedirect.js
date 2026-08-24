'use client';

import { useEffect } from 'react';

const RECHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Confirms the current role-scoped session is still valid by pinging that
 * role's own profile endpoint (already gated server-side to the matching
 * role). The Firebase session cookie can expire, get cleared, or belong to
 * the wrong role independently of the client-side Firebase auth state — when
 * that happens this redirects straight to login instead of leaving the user
 * parked in the panel while individual widgets quietly fail with an inline
 * "(unauthorized)" message.
 *
 * Deliberately checks a single role-specific endpoint rather than watching
 * every fetch for a 401: some panel widgets call admin-only endpoints from
 * a manager screen (an existing, separate permissions gap) and would 401
 * even with a perfectly valid manager session — reacting to those would
 * create a redirect loop for a user who is, in fact, signed in correctly.
 */
export function useVerifySessionOrRedirect({ endpoint, loginPath, enabled = true }) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    if (window.location.pathname.startsWith(loginPath)) return;

    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(endpoint, { credentials: 'include' });
        if (!cancelled && res.status === 401) {
          window.location.assign(loginPath);
        }
      } catch {
        // Network hiccup — don't force a logout over a transient failure.
      }
    };

    void check();
    const interval = setInterval(check, RECHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [endpoint, loginPath, enabled]);
}
