"use client";

import { getToken, isSupported, onMessage } from "firebase/messaging";
import { firebaseApp } from "@/lib/firebase/client";

const SW_PATH = "/firebase-messaging-sw.js";
const TOKEN_STORAGE_KEY = "kzn-fcm-token";

/** @type {import("firebase/messaging").Messaging | null} */
let messagingInstance = null;

async function getMessagingInstance() {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;
  if (messagingInstance) return messagingInstance;

  const { getMessaging } = await import("firebase/messaging");
  messagingInstance = getMessaging(firebaseApp);
  return messagingInstance;
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) return null;

  const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (existing) return existing;

  return navigator.serviceWorker.register(SW_PATH, { scope: "/" });
}

/**
 * @param {string} token
 * @param {'register' | 'unregister'} action
 */
async function syncTokenWithServer(token, action) {
  await fetch("/api/push/register", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, action }),
  });
}

function storeLocalToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

function readLocalToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function showForegroundNotification(payload) {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "KZN Agency";
  const body = notification.body || data.body || "";
  const link = data.link || null;

  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }

  const n = new Notification(title, {
    body,
    icon: "/avatar.svg",
    badge: "/avatar.svg",
    tag: data.tag || "kzn-notification",
    data: { link },
  });

  n.onclick = () => {
    window.focus();
    if (link) {
      const path = link.startsWith("http")
        ? new URL(link).pathname + new URL(link).search
        : link;
      window.location.assign(path);
    }
    n.close();
  };
}

/**
 * Request permission, register the FCM token, and listen for foreground messages.
 */
export async function enableWebPushNotifications() {
  if (typeof window === "undefined") return { ok: false, reason: "server" };
  if (!(await isSupported())) return { ok: false, reason: "unsupported" };

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("[push] Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY");
    return { ok: false, reason: "missing_vapid" };
  }

  if (Notification.permission === "denied") {
    return { ok: false, reason: "denied" };
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: "denied" };
    }
  }

  const messaging = await getMessagingInstance();
  if (!messaging) return { ok: false, reason: "unsupported" };

  const registration = await getServiceWorkerRegistration();
  if (!registration) return { ok: false, reason: "no_sw" };

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) return { ok: false, reason: "no_token" };

  const previous = readLocalToken();
  if (previous && previous !== token) {
    await syncTokenWithServer(previous, "unregister").catch(() => {});
  }

  await syncTokenWithServer(token, "register");
  storeLocalToken(token);

  onMessage(messaging, (payload) => {
    showForegroundNotification(payload);
  });

  return { ok: true, token };
}

export async function disableWebPushNotifications() {
  const token = readLocalToken();
  if (token) {
    await syncTokenWithServer(token, "unregister").catch(() => {});
  }
  storeLocalToken("");
}
