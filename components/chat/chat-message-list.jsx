"use client";

import React, { useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import { CHAT_SENDER_ROLE } from "@/lib/chat/constants";
import { formatChatTimestamp } from "@/lib/chat/client";

/**
 * @param {{ messages: Array<Record<string, unknown>>, loading?: boolean, viewerRole: 'admin' | 'user' }} props
 */
export default function ChatMessageList({ messages, loading = false, viewerRole }) {
  const bottomRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-quaternary text-sm">
        Loading messages…
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-quaternary text-sm px-4 text-center">
        No messages yet. Send a message to start the conversation.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg) => {
        const isOwn =
          (viewerRole === CHAT_SENDER_ROLE.ADMIN &&
            msg.senderRole === CHAT_SENDER_ROLE.ADMIN) ||
          (viewerRole === CHAT_SENDER_ROLE.USER &&
            msg.senderRole === CHAT_SENDER_ROLE.USER);

        const attachment = msg.attachment;
        const hasAttachment =
          attachment &&
          typeof attachment === "object" &&
          typeof attachment.url === "string";

        const contentType =
          hasAttachment && typeof attachment.contentType === "string"
            ? attachment.contentType
            : "";
        const isImage = contentType.startsWith("image/");

        return (
          <div
            key={msg.id}
            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                isOwn
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-[#2A3540] text-white rounded-bl-md"
              }`}
            >
              {typeof msg.text === "string" && msg.text.trim() ? (
                <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
              ) : null}

              {hasAttachment ? (
                <div className={msg.text ? "mt-2" : ""}>
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.name || "Attachment"}
                        className="max-w-full max-h-48 rounded-lg object-contain"
                      />
                    </a>
                  ) : (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 text-sm underline ${
                        isOwn ? "text-white/90" : "text-primary"
                      }`}
                    >
                      <FileText className="size-4 shrink-0" />
                      <span className="truncate max-w-[200px]">
                        {attachment.name || "Download file"}
                      </span>
                    </a>
                  )}
                </div>
              ) : null}

              <p
                className={`text-[10px] mt-1 ${
                  isOwn ? "text-white/60 text-right" : "text-quaternary"
                }`}
              >
                {formatChatTimestamp(msg.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
