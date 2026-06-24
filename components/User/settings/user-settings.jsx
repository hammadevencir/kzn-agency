"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import toast from "react-hot-toast";
import { PasswordField } from "@/components/ui/password-field";
import { auth, storage } from "@/lib/firebase/client";
import { establishSession } from "@/lib/auth/establish-session";
import { ROLE } from "@/lib/auth/constants";
import { emitAuthProfileUpdated } from "@/lib/auth/emit-auth-profile-updated";

const AVATAR_STORAGE_PATH = "avatar";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/** @param {string} name @param {string} email */
function getProfileInitialLetter(name, email) {
  const n = (name || "").trim();
  if (n.length > 0) return n.charAt(0).toUpperCase();
  const local = (email || "").split("@")[0]?.trim() || "";
  if (local.length > 0) return local.charAt(0).toUpperCase();
  return "?";
}

/** @param {{ photoURL: string | null, name: string, email: string, sizeClass?: string }} props */
function ProfileAvatar({ photoURL, name, email, sizeClass = "w-20 h-20" }) {
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
  }, [photoURL]);

  const trimmed = photoURL && String(photoURL).trim();
  const showImage = Boolean(trimmed) && !loadError;
  const letter = getProfileInitialLetter(name, email);

  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden bg-[#2A3540] flex items-center justify-center ${sizeClass}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={trimmed}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setLoadError(true)}
        />
      ) : (
        <span className="text-[28px] font-semibold text-white select-none">
          {letter}
        </span>
      )}
    </div>
  );
}

function mapAuthError(err) {
  const code = err?.code;
  const msg = err?.message;
  if (msg && !String(msg).includes("Firebase")) return msg;
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Current password is incorrect.";
    case "auth/email-already-in-use":
      return "That email is already used by another account.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/requires-recent-login":
      return "Please sign out and sign in again, then try updating your email or password.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "storage/unauthorized":
      return "Upload was blocked. Deploy Storage rules (see storage.rules) or sign in again.";
    case "storage/canceled":
      return "Upload was canceled.";
    default:
      return "Could not save settings. Please try again.";
  }
}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`${label}_timeout`));
    }, ms);
    Promise.resolve(promise).then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

async function syncProfileToServer(user) {
  await withTimeout(user.getIdToken(true), 15000, "token_refresh");
  await withTimeout(establishSession(user, ROLE.USER), 15000, "session");
  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), 15000);
  try {
    const syncRes = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: ctrl.signal,
      body: JSON.stringify({
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL ?? null,
      }),
    });
    if (!syncRes.ok) {
      const errData = await syncRes.json().catch(() => ({}));
      throw new Error(errData.error || "sync_failed");
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

export default function UserSettings() {
  const router = useRouter();
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */(null));
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasPasswordProvider, setHasPasswordProvider] = useState(false);
  const [photoURL, setPhotoURL] = useState(/** @type {string | null} */(null));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/profile", {
          credentials: "include",
        });
        if (cancelled) return;
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await res.json().catch(() => ({}));

        if (typeof auth.authStateReady === "function") {
          try {
            await auth.authStateReady();
          } catch {
            /* ignore */
          }
        }
        if (cancelled) return;
        const u = auth.currentUser;

        if (res.ok) {
          setDisplayName(
            typeof data.displayName === "string"
              ? data.displayName
              : u?.displayName || ""
          );
          setEmail(
            typeof data.email === "string" ? data.email : u?.email || ""
          );
          setPhotoURL(data.photoURL || u?.photoURL || null);
          setHasPasswordProvider(Boolean(data.hasPasswordProvider));
        } else {
          setDisplayName(u?.displayName || "");
          setEmail(u?.email || "");
          setPhotoURL(u?.photoURL || null);
          setHasPasswordProvider(
            Boolean(u?.providerData?.some((p) => p.providerId === "password"))
          );
        }
      } catch {
        /* leave defaults */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    const unsub = onAuthStateChanged(auth, (u) => {
      if (cancelled) return;
      if (!u) return;
      setDisplayName((prev) => prev || u.displayName || "");
      setEmail((prev) => prev || u.email || "");
      setPhotoURL((prev) => prev || u.photoURL || null);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const u = auth.currentUser;
    if (!u || saving) return;

    const nameTrim = displayName.trim();
    const emailTrim = email.trim().toLowerCase();
    const curPwd = currentPassword;
    const newPwd = newPassword.trim();
    const confirmPwd = confirmPassword.trim();

    if (newPwd || confirmPwd) {
      if (newPwd !== confirmPwd) {
        toast.error("New password and confirmation do not match.");
        return;
      }
      if (!hasPasswordProvider) {
        toast.error("Password sign-in is not enabled for this account.");
        return;
      }
      if (!curPwd) {
        toast.error("Enter your current password to set a new password.");
        return;
      }
    }

    const emailChanged =
      hasPasswordProvider && emailTrim !== (u.email || "").toLowerCase();
    if (emailChanged && !curPwd) {
      toast.error("Enter your current password to change your email.");
      return;
    }

    const willUpdateName = nameTrim !== (u.displayName || "");
    const willUpdatePassword = newPwd.length > 0;

    setSaving(true);
    try {
      if (nameTrim !== (u.displayName || "")) {
        await updateProfile(u, { displayName: nameTrim });
      }

      const needsReauth =
        hasPasswordProvider &&
        curPwd.length > 0 &&
        (emailChanged || newPwd.length > 0);

      let active = auth.currentUser;
      if (!active) {
        toast.error("Session expired. Please sign in again.");
        return;
      }

      if (needsReauth) {
        const cred = EmailAuthProvider.credential(active.email, curPwd);
        await reauthenticateWithCredential(active, cred);
        active = auth.currentUser;
        if (!active) {
          toast.error("Session expired. Please sign in again.");
          return;
        }
      }

      if (emailChanged) {
        await updateEmail(active, emailTrim);
        active = auth.currentUser;
        if (!active) {
          toast.error("Session expired. Please sign in again.");
          return;
        }
      }

      if (newPwd.length > 0) {
        await updatePassword(active, newPwd);
        active = auth.currentUser;
      }

      const fresh = active || auth.currentUser;
      if (!fresh) {
        toast.error("Session expired. Please sign in again.");
        return;
      }

      await syncProfileToServer(fresh);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPhotoURL(fresh.photoURL || null);
      emitAuthProfileUpdated(fresh);
      if (willUpdatePassword && (willUpdateName || emailChanged)) {
        toast.success("Settings saved. Your password has been updated.");
      } else if (willUpdatePassword) {
        toast.success("Your password has been updated.");
      } else {
        toast.success("Settings saved.");
      }
    } catch (err) {
      toast.error(mapAuthError(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const okTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!okTypes.includes(file.type)) {
      toast.error("Please choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }

    const u = auth.currentUser;
    if (!u || uploadingAvatar) return;

    setUploadingAvatar(true);
    const watchdog = setTimeout(() => {
      setUploadingAvatar(false);
    }, 45000);
    try {
      const path = `profile-photos/${u.uid}/${AVATAR_STORAGE_PATH}`;
      const avatarStorageRef = storageRef(storage, path);
      await withTimeout(
        uploadBytes(avatarStorageRef, file, { contentType: file.type }),
        30000,
        "upload"
      );
      const url = await withTimeout(
        getDownloadURL(avatarStorageRef),
        15000,
        "url"
      );
      await withTimeout(updateProfile(u, { photoURL: url }), 10000, "profile");
      await withTimeout(u.reload(), 10000, "reload");
      const fresh = auth.currentUser;
      if (!fresh) {
        toast.error("Session expired. Please sign in again.");
        return;
      }
      setPhotoURL(fresh.photoURL || url);
      await syncProfileToServer(fresh);
      emitAuthProfileUpdated(fresh);
      toast.success("Profile photo updated.");
    } catch (err) {
      console.error(err);
      toast.error(mapAuthError(err));
    } finally {
      clearTimeout(watchdog);
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    const u = auth.currentUser;
    if (!u || uploadingAvatar) return;
    const hasRemote =
      photoURL && String(photoURL).trim().length > 0;
    if (!hasRemote) return;

    setUploadingAvatar(true);
    const watchdog = setTimeout(() => {
      setUploadingAvatar(false);
    }, 45000);
    try {
      try {
        const path = `profile-photos/${u.uid}/${AVATAR_STORAGE_PATH}`;
        await deleteObject(storageRef(storage, path));
      } catch (delErr) {
        /** @type {{ code?: string }} */
        const c = delErr;
        if (c?.code !== "storage/object-not-found") {
          console.warn("remove avatar storage:", delErr);
        }
      }
      await updateProfile(u, { photoURL: null });
      await u.reload();
      const fresh = auth.currentUser;
      if (!fresh) {
        toast.error("Session expired. Please sign in again.");
        return;
      }
      setPhotoURL(fresh.photoURL || null);
      await syncProfileToServer(fresh);
      emitAuthProfileUpdated(fresh);
      toast.success("Profile photo removed.");
    } catch (err) {
      console.error(err);
      toast.error(mapAuthError(err));
    } finally {
      clearTimeout(watchdog);
      setUploadingAvatar(false);
    }
  };

  const showRemovePhoto =
    Boolean(photoURL && String(photoURL).trim().length > 0);

  return (
    <div className="flex-1 p-4 md:p-6 rounded-2xl overflow-y-auto w-full max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white px-5 pt-5 tracking-tight">
          Settings
        </h1>
      </div>

      <div className="bg-[#11191F] border border-white/5 rounded-2xl ml-5 p-3 md:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-[18px] md:text-[21px] font-bold text-white mb-2">
            User Profile
          </h2>
          <p className="text-quaternary text-[11px] md:text-[12px]">
            Change your profile settings here
          </p>
        </div>

        {!ready ? (
          <p className="text-sm text-quaternary">Loading…</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-8">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                aria-hidden
                onChange={handleAvatarFileChange}
              />
              <ProfileAvatar
                photoURL={photoURL}
                name={displayName}
                email={email}
              />
              <div className="flex flex-col gap-3 min-w-0">
                <div className="flex flex-wrap items-center justify-center gap-2 h-full min-h-20">
                  <button
                    type="button"
                    onClick={handlePickAvatarClick}
                    disabled={uploadingAvatar}
                    className="px-6 py-2 border border-primary text-primary rounded-lg text-[12px] font-medium hover:bg-primary hover:text-black transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? "Working…" : "Change"}
                  </button>
                  {showRemovePhoto ? (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      className="px-6 py-2 border border-white/20 text-quaternary rounded-lg text-[12px] font-medium hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Remove photo
                    </button>
                  ) : null}
                </div>
                {!hasPasswordProvider && (
                  <div className="pt-1 text-[12px] text-quaternary max-w-md border-t border-white/5">
                    <p>
                      Signed in with Google. You can update your display name;
                      email is managed by your Google account.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-[400px] space-y-4">
              <div>
                <label className="block text-quaternary text-[12px] font-medium mb-2">
                  Your name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="w-full px-4 py-3 bg-secondary rounded-lg text-white placeholder:text-quaternary placeholder:text-[12px] focus:outline-none focus:ring-1 focus:ring-quaternary transition-colors"
                />
              </div>

              <div>
                <label className="block text-quaternary text-[12px] font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={!hasPasswordProvider}
                  className="w-full px-4 py-3 bg-secondary rounded-lg text-white placeholder:text-quaternary placeholder:text-[12px] focus:outline-none focus:ring-1 focus:ring-quaternary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {hasPasswordProvider ? (
                <>
                  <div className="">
                    <p className="text-[12px] text-quaternary mb-3">
                      Current password (required to change email or password)
                    </p>
                    <PasswordField
                      name="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                      autoComplete="current-password"
                    />
                  </div>

                  <div>
                    <label className="block text-quaternary text-[12px] font-medium mb-2">
                      New password
                    </label>
                    <PasswordField
                      name="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      autoComplete="new-password"
                    />
                  </div>

                  <div>
                    <label className="block text-quaternary text-[12px] font-medium mb-2">
                      Confirm new password
                    </label>
                    <PasswordField
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                    />
                  </div>
                </>
              ) : null}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving || uploadingAvatar}
                  className="w-full sm:w-auto lg:w-[400px] px-6 sm:px-8 py-3 bg-primary text-black rounded-2xl text-[12px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
