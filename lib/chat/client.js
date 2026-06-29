"use client";

/**
 * @param {string | null | undefined} conversationUserId
 * @param {{ text?: string, attachment?: object }} payload
 */
export async function sendChatMessageClient(conversationUserId, payload) {
  const res = await fetch("/api/chat/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      conversationUserId,
      text: payload.text,
      attachment: payload.attachment,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "send_failed");
  }

  return res.json();
}

/**
 * @param {string | null | undefined} conversationUserId
 */
export async function markChatReadClient(conversationUserId) {
  if (!conversationUserId) return;
  await fetch("/api/chat/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ conversationUserId }),
  });
}

/**
 * @param {File} file
 * @param {string} conversationUserId
 */
export async function uploadChatAttachmentClient(file, conversationUserId) {
  const form = new FormData();
  form.append("file", file);
  form.append("conversationUserId", conversationUserId);

  const res = await fetch("/api/chat/upload", {
    method: "POST",
    credentials: "include",
    body: form,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "upload_failed");
  }

  return res.json();
}

/**
 * @param {import('firebase/firestore').Timestamp | { seconds?: number, _seconds?: number } | string | null | undefined} ts
 */
export function formatChatTimestamp(ts) {
  if (!ts) return "";
  let date;
  if (typeof ts === "string") {
    date = new Date(ts);
  } else if (typeof ts === "object" && ts !== null) {
    const seconds = "seconds" in ts ? ts.seconds : ts._seconds;
    if (typeof seconds === "number") {
      date = new Date(seconds * 1000);
    } else if (typeof ts.toDate === "function") {
      date = ts.toDate();
    } else {
      return "";
    }
  } else {
    return "";
  }

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * @param {string | null | undefined} text
 * @param {boolean | undefined} hasAttachment
 */
export function getChatPreviewText(text, hasAttachment) {
  const t = (text || "").trim();
  if (t) return t.length > 60 ? `${t.slice(0, 60)}…` : t;
  if (hasAttachment) return "Attachment";
  return "No messages yet";
}
