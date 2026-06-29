export const CHAT_CONVERSATIONS_COLLECTION = "chat-conversations";
export const CHAT_MESSAGES_SUBCOLLECTION = "messages";

export const CHAT_SENDER_ROLE = {
  ADMIN: "admin",
  USER: "user",
};

export const CHAT_ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]);

export const CHAT_MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
export const CHAT_MAX_TEXT_LENGTH = 4000;
