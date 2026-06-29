"use client";

import React, { useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  sendChatMessageClient,
  uploadChatAttachmentClient,
} from "@/lib/chat/client";
import {
  CHAT_ALLOWED_ATTACHMENT_TYPES,
  CHAT_MAX_ATTACHMENT_BYTES,
  CHAT_MAX_TEXT_LENGTH,
} from "@/lib/chat/constants";

function mapSendError(code) {
  switch (code) {
    case "empty_message":
      return "Enter a message or attach a file.";
    case "unsupported_file_type":
      return "Only images and PDF files are allowed.";
    case "file_too_large":
      return "File must be 10 MB or smaller.";
    case "upload_failed":
      return "Could not upload file. Please try again.";
    default:
      return "Could not send message. Please try again.";
  }
}

/**
 * @param {{ conversationUserId: string, disabled?: boolean }} props
 */
export default function ChatComposer({ conversationUserId, disabled = false }) {
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState(/** @type {File | null} */ (null));
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!CHAT_ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
      toast.error("Only images and PDF files are allowed.");
      return;
    }
    if (file.size > CHAT_MAX_ATTACHMENT_BYTES) {
      toast.error("File must be 10 MB or smaller.");
      return;
    }
    setPendingFile(file);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !pendingFile) return;
    if (!conversationUserId || sending || disabled) return;

    setSending(true);
    try {
      /** @type {object | null} */
      let attachment = null;
      if (pendingFile) {
        attachment = await uploadChatAttachmentClient(
          pendingFile,
          conversationUserId
        );
      }

      await sendChatMessageClient(conversationUserId, {
        text: trimmed || undefined,
        attachment: attachment || undefined,
      });

      setText("");
      setPendingFile(null);
    } catch (err) {
      const code = err instanceof Error ? err.message : "send_failed";
      toast.error(mapSendError(code));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-tertiary p-4">
      {pendingFile ? (
        <div className="mb-2 flex items-center gap-2 text-sm text-quaternary bg-[#2A3540] rounded-lg px-3 py-2">
          <Paperclip className="size-4 shrink-0" />
          <span className="truncate flex-1">{pendingFile.name}</span>
          <button
            type="button"
            onClick={() => setPendingFile(null)}
            className="text-quaternary hover:text-white"
            aria-label="Remove attachment"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
          className="shrink-0 p-2 rounded-lg text-quaternary hover:text-white hover:bg-muted disabled:opacity-50"
          aria-label="Attach file"
        >
          <Paperclip className="size-5" />
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, CHAT_MAX_TEXT_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          disabled={disabled || sending}
          className="flex-1 min-h-[44px] max-h-32 resize-none rounded-xl bg-[#2A3540] border border-border px-4 py-3 text-sm text-white placeholder:text-quaternary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />

        <Button
          type="button"
          onClick={handleSend}
          disabled={disabled || sending || (!text.trim() && !pendingFile)}
          size="icon"
          className="shrink-0 rounded-xl size-11"
          aria-label="Send message"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
