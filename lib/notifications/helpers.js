export function tsMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") {
    try {
      return ts.toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

export function relativeTime(ms) {
  if (!ms) return "";
  const diff = Date.now() - ms;
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(ms).toLocaleDateString();
}

export function chatMessagePreview(text, hasAttachment) {
  const t = (text || "").trim();
  if (t) return t.length > 120 ? `${t.slice(0, 120)}…` : t;
  if (hasAttachment) return "Sent an attachment";
  return "New message";
}
