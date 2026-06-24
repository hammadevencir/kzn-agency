'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { NotificationIcon, EuroIcon } from '@/components/icons';
import { X } from 'lucide-react';
import { auth } from '@/lib/firebase/client';
import { AUTH_PROFILE_UPDATED_EVENT } from '@/lib/auth/constants';

/** Match settings.jsx: name first, then email local-part, else "?". */
function getProfileInitialLetter(name, email) {
  const n = (name || '').trim();
  if (n.length > 0) return n.charAt(0).toUpperCase();
  const local = (email || '').split('@')[0]?.trim() || '';
  if (local.length > 0) return local.charAt(0).toUpperCase();
  return '?';
}

function getInitial(name) {
  const s = (name || '').trim();
  return s.length > 0 ? s.charAt(0).toUpperCase() : '?';
}

function detectNotificationsEndpoint(pathname) {
  if (!pathname) return '/api/notifications';
  if (pathname.startsWith('/admin') || pathname.startsWith('/manager')) {
    return '/api/admin/notifications';
  }
  return '/api/notifications';
}

function detectMarkReadEndpoint(pathname) {
  if (!pathname) return '/api/notifications/read';
  if (pathname.startsWith('/admin') || pathname.startsWith('/manager')) {
    return '/api/admin/notifications/read';
  }
  return '/api/notifications/read';
}

const Header = ({
  userName: userNameProp = '',
  avatarUrl: avatarUrlProp = '',
  showEuroButton = false,
}) => {
  const pathname = usePathname();
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhotoURL, setAuthPhotoURL] = useState(/** @type {string | null} */(null));
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const userName = authDisplayName || userNameProp;
  const emailForInitial = authEmail;
  const trimmedPhoto =
    (authPhotoURL && String(authPhotoURL).trim()) ||
    (avatarUrlProp && String(avatarUrlProp).trim()) ||
    '';
  const showAvatarImage =
    Boolean(trimmedPhoto) &&
    trimmedPhoto !== '/avatar.jpg' &&
    !avatarLoadError;

  useEffect(() => {
    setAvatarLoadError(false);
  }, [trimmedPhoto]);

  const applyUser = useCallback((u) => {
    if (!u) {
      setAuthDisplayName('');
      setAuthEmail('');
      setAuthPhotoURL(null);
      return;
    }
    setAuthDisplayName(u.displayName || '');
    setAuthEmail(u.email || '');
    setAuthPhotoURL(u.photoURL ?? null);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, applyUser);
    return () => unsub();
  }, [applyUser]);

  /** `onAuthStateChanged` often does not run after `updateProfile`; settings dispatches detail from the updated user. */
  useEffect(() => {
    /** @param {Event} ev */
    const onProfileUpdated = (ev) => {
      const e = /** @type {CustomEvent<{ displayName?: string, email?: string, photoURL?: string | null } | null>} */ (
        ev
      );
      const d = e.detail;
      if (d && typeof d === 'object') {
        setAuthDisplayName(d.displayName ?? '');
        setAuthEmail(d.email ?? '');
        setAuthPhotoURL(d.photoURL ?? null);
        return;
      }
      const u = auth.currentUser;
      if (u) applyUser(u);
    };
    window.addEventListener(AUTH_PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () => window.removeEventListener(AUTH_PROFILE_UPDATED_EVENT, onProfileUpdated);
  }, [applyUser]);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(
    /** @type {{ id: string, title: string, desc: string, time: string, kind?: string, read?: boolean }[]} */ ([])
  );
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const dropdownRef = useRef(null);

  const endpoint = detectNotificationsEndpoint(pathname);
  const markReadEndpoint = detectMarkReadEndpoint(pathname);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.items)) {
        setNotifications(data.items);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [endpoint]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    const next = !isNotificationsOpen;
    setIsNotificationsOpen(next);
    if (next) void loadNotifications();
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0 || markingRead) return;
    setMarkingRead(true);
    try {
      const res = await fetch(markReadEndpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: unreadIds }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            unreadIds.includes(n.id) ? { ...n, read: true } : n
          )
        );
        toast.success(
          unreadIds.length === 1
            ? 'Notification marked as read.'
            : `${unreadIds.length} notifications marked as read.`
        );
      } else {
        toast.error('Could not mark notifications as read.');
      }
    } catch {
      toast.error('Could not mark notifications as read.');
    } finally {
      setMarkingRead(false);
    }
  };

  const unreadCount = loaded
    ? notifications.filter((n) => !n.read).length
    : 0;

  return (
    <header className="bg-[#11191F] border-b border-white/5 px-4 md:px-8 py-4 md:py-6 flex justify-between items-center z-40 relative">
      {/* Left side / Spacer */}
      <div className="flex-1"></div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Euro button */}
        {showEuroButton && (
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#CBAF69] text-[#11191F] rounded-full font-bold hover:bg-[#D4BB7D] transition-colors shadow-lg shadow-[#CBAF69]/10">
            <EuroIcon width={20} height={20} />
            <span className="text-[14px]">EURO</span>
          </button>
        )}

        {/* Notification Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggle}
            className={`relative p-2 transition-colors rounded-full ${isNotificationsOpen ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <NotificationIcon className="text-current" width={24} height={24} />
            {unreadCount > 0 ? (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-[#CBAF69] text-[#11191F] text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute top-[calc(100%+12px)] right-0 w-[380px] md:w-[440px] bg-[#161D26] border border-white/5 rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

              {/* Header */}
              <div className="flex items-center justify-between gap-3 p-6 pb-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-white text-[18px] font-semibold tracking-tight shrink-0">
                    Notifications
                  </span>
                  {!loading && notifications.some((n) => !n.read) ? (
                    <button
                      type="button"
                      onClick={() => void handleMarkAllRead()}
                      disabled={markingRead}
                      className="text-[#C5A964] text-[13px] font-semibold hover:text-[#D4BB7D] transition-colors disabled:opacity-50 disabled:pointer-events-none truncate"
                    >
                      {markingRead ? 'Saving…' : 'Mark as Read'}
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-gray-500 hover:text-white transition-colors p-1 shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* List */}
              <div className="flex flex-col overflow-y-auto max-h-[500px] custom-scrollbar p-2">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <p className="text-[#8B9197] text-[14px] font-medium">Loading…</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#1C242C] flex items-center justify-center mb-3">
                      <NotificationIcon className="text-[#8B9197]" width={20} height={20} />
                    </div>
                    <p className="text-[#8B9197] text-[14px] font-medium">No notifications yet</p>
                    <p className="text-[#8B9197]/60 text-[12px] mt-1">You&apos;re all caught up!</p>
                  </div>
                ) : notifications.map((msg) => {
                  const initial = getInitial(msg.title);
                  const isRead = Boolean(msg.read);
                  const dot =
                    msg.kind === 'success'
                      ? 'bg-[#39CB7F]'
                      : msg.kind === 'danger'
                        ? 'bg-[#FF4D59]'
                        : 'bg-[#C5A964]';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-4 p-4 hover:bg-white/[0.02] rounded-[16px] transition-colors cursor-default ${isRead ? 'opacity-[0.58]' : ''}`}
                    >
                      <div className="relative w-[46px] h-[46px] shrink-0">
                        <div className="w-[46px] h-[46px] rounded-full bg-[#1C242C] text-white text-[15px] font-bold flex items-center justify-center shadow-inner">
                          {initial}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#161D26] ${isRead ? 'bg-[#4B5563]' : dot}`}
                        />
                      </div>

                      <div className="flex-1 flex flex-col gap-1 pr-2 min-w-0">
                        <h4
                          className={`text-[14px] font-medium leading-snug ${isRead ? 'text-[#9CA3AF]' : 'text-white'}`}
                        >
                          {msg.title}
                        </h4>
                        <p className="text-[#8B9197] text-[12.5px] leading-relaxed line-clamp-2">
                          {msg.desc}
                        </p>
                      </div>

                      <div className="shrink-0 text-[#8B9197] text-[11.5px] font-medium pt-1 whitespace-nowrap">
                        {msg.time}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Avatar — synced from Firebase (same as settings) */}
        <button
          type="button"
          className="w-[36px] h-[36px] rounded-full overflow-hidden bg-[#2A3540] flex items-center justify-center border border-white/10 ml-2 hover:opacity-80 transition-opacity"
          aria-label={userName ? `Profile: ${userName}` : 'Profile'}
        >
          {showAvatarImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={trimmedPhoto}
              src={trimmedPhoto}
              alt=""
              className="object-cover w-full h-full"
              onError={() => setAvatarLoadError(true)}
            />
          ) : (
            <span className="text-[14px] font-semibold text-white select-none">
              {getProfileInitialLetter(userName, emailForInitial)}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
