'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PasswordField } from '@/components/ui/password-field';
import {
  ADMIN_ROLE,
  ADMIN_ROLES,
  ADMIN_ROLE_LABEL,
} from '@/lib/auth/admin-permissions';

const inputClass =
  'w-full px-4 py-3 bg-secondary rounded-lg text-white placeholder:text-quaternary placeholder:text-[12px] focus:outline-none focus:ring-1 focus:ring-quaternary transition-colors';

const EMPTY_FORM = { displayName: '', email: '', password: '', adminRole: ADMIN_ROLE.SUPPORT };

async function readError(res, fallback) {
  const data = await res.json().catch(() => ({}));
  return data.message || data.error || fallback;
}

/**
 * Manager-only "Team" section on /admin/settings: list admin logins, create a
 * new one (Manager / Customer Service), change role, disable or remove.
 * Renders nothing for non-managers (the API returns 403).
 */
export default function TeamSettings() {
  const [status, setStatus] = useState(/** @type {'loading' | 'ready' | 'hidden' | 'error'} */ ('loading'));
  const [items, setItems] = useState(/** @type {any[]} */ ([]));
  const [currentUid, setCurrentUid] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [busyUid, setBusyUid] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/team', { credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        setStatus('hidden');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setCurrentUid(data.currentUid || '');
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast.error(await readError(res, 'Could not create the login.'));
        return;
      }
      toast.success('Login created. Share the email and temporary password with them.');
      setForm(EMPTY_FORM);
      await load();
    } finally {
      setCreating(false);
    }
  };

  const patchMember = async (uid, patch, successMsg) => {
    setBusyUid(uid);
    try {
      const res = await fetch(`/api/admin/team/${encodeURIComponent(uid)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        toast.error(await readError(res, 'Could not update this login.'));
        return;
      }
      if (uid === currentUid) {
        // Own role changed — our session was revoked; sign in again.
        window.location.assign('/login');
        return;
      }
      toast.success(successMsg);
      await load();
    } finally {
      setBusyUid('');
    }
  };

  const removeMember = async (member) => {
    if (!window.confirm(`Remove the admin login ${member.email}? This deletes the account.`)) return;
    setBusyUid(member.uid);
    try {
      const res = await fetch(`/api/admin/team/${encodeURIComponent(member.uid)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        toast.error(await readError(res, 'Could not remove this login.'));
        return;
      }
      toast.success('Login removed.');
      await load();
    } finally {
      setBusyUid('');
    }
  };

  const resetPassword = async (member) => {
    const pwd = window.prompt(`New temporary password for ${member.email} (min 8 characters):`);
    if (!pwd) return;
    await patchMember(member.uid, { password: pwd }, 'Password updated. They have been signed out.');
  };

  if (status === 'hidden') return null;

  const me = items.find((m) => m.uid === currentUid);

  return (
    <div className="px-4 md:px-6 pb-6 w-full max-w-[1400px]">
      <div className="bg-[#11191F] border border-white/5 rounded-2xl ml-5 p-3 md:p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[18px] md:text-[21px] font-bold text-white mb-2">Team</h2>
            <p className="text-quaternary text-[11px] md:text-[12px]">
              Admin logins. Managers see everything; Customer Service can&apos;t see Settings,
              Affiliate Requests, Contact Requests or Financial.
            </p>
          </div>
          {me ? (
            <span className="text-[12px] text-quaternary">
              Your role: <span className="text-white">{ADMIN_ROLE_LABEL[me.adminRole]}</span>
            </span>
          ) : null}
        </div>

        {status === 'loading' ? (
          <p className="text-sm text-quaternary">Loading…</p>
        ) : status === 'error' ? (
          <p className="text-sm text-quaternary">Could not load the team. Refresh to try again.</p>
        ) : (
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-quaternary border-b border-white/5">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => {
                  const busy = busyUid === m.uid;
                  const isMe = m.uid === currentUid;
                  return (
                    <tr key={m.uid} className="border-b border-white/5 text-white">
                      <td className="py-3 pr-4">
                        {m.displayName || '—'}
                        {isMe ? <span className="text-quaternary"> (you)</span> : null}
                      </td>
                      <td className="py-3 pr-4 break-all">{m.email}</td>
                      <td className="py-3 pr-4">
                        <select
                          value={m.adminRole}
                          disabled={busy}
                          onChange={(e) => {
                            const next = e.target.value;
                            if (
                              isMe &&
                              !window.confirm('Change your own role? You will be signed out.')
                            ) {
                              return;
                            }
                            void patchMember(
                              m.uid,
                              { adminRole: next },
                              'Role updated. They have been signed out to apply it.'
                            );
                          }}
                          className="bg-secondary rounded-lg px-3 py-2 text-white focus:outline-none"
                        >
                          {ADMIN_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ADMIN_ROLE_LABEL[r]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={m.disabled ? 'text-[#FA3C67]' : 'text-quaternary'}>
                          {m.disabled ? 'Disabled' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void resetPassword(m)}
                            className="px-3 py-1.5 border border-white/20 text-quaternary rounded-lg text-[12px] hover:text-white disabled:opacity-50"
                          >
                            Reset password
                          </button>
                          {!isMe ? (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void patchMember(
                                    m.uid,
                                    { disabled: !m.disabled },
                                    m.disabled ? 'Login enabled.' : 'Login disabled.'
                                  )
                                }
                                className="px-3 py-1.5 border border-white/20 text-quaternary rounded-lg text-[12px] hover:text-white disabled:opacity-50"
                              >
                                {m.disabled ? 'Enable' : 'Disable'}
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void removeMember(m)}
                                className="px-3 py-1.5 border border-[#FA3C67]/40 text-[#FA3C67] rounded-lg text-[12px] hover:bg-[#FA3C67]/10 disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <h3 className="text-[15px] font-semibold text-white mb-4">Add a login</h3>
        <form onSubmit={handleCreate} className="max-w-[400px] space-y-4">
          <div>
            <label className="block text-quaternary text-[12px] font-medium mb-2">Name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="Full name"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-quaternary text-[12px] font-medium mb-2">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="name@company.com"
              autoComplete="off"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-quaternary text-[12px] font-medium mb-2">
              Temporary password (min 8 characters)
            </label>
            <PasswordField
              name="teamPassword"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Temporary password"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-quaternary text-[12px] font-medium mb-2">Role</label>
            <select
              value={form.adminRole}
              onChange={(e) => setForm((f) => ({ ...f, adminRole: e.target.value }))}
              className={inputClass}
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ADMIN_ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={creating}
              className="w-full sm:w-auto lg:w-[400px] px-6 sm:px-8 py-3 bg-primary text-black rounded-2xl text-[12px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
