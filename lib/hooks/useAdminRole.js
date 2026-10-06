'use client';

import { useEffect, useState } from 'react';
import { normalizeAdminRole } from '@/lib/auth/admin-permissions';

/**
 * Current admin's sub-role ("manager" | "support"), read from the session via
 * GET /api/admin/profile. Returns `null` while loading (callers should treat
 * that as "restricted" so support never sees a flash of manager-only items).
 * Server-side enforcement lives in proxy.js and requireAdminSection().
 *
 * @param {{ enabled?: boolean }} [opts]
 * @returns {'manager' | 'support' | null}
 */
export function useAdminRole({ enabled = true } = {}) {
  const [adminRole, setAdminRole] = useState(/** @type {'manager' | 'support' | null} */ (null));

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/profile', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setAdminRole(normalizeAdminRole(data?.adminRole));
      } catch {
        /* network hiccup — keep restricted view */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return adminRole;
}
