"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { CHAT_SENDER_ROLE } from "@/lib/chat/constants";
import { useChatMessages } from "@/lib/hooks/useChatMessages";
import ChatMessageList from "@/components/chat/chat-message-list";
import ChatComposer from "@/components/chat/chat-composer";

export default function UserChatPanel() {
  const [uid, setUid] = useState(/** @type {string | null} */ (null));
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const { messages, loading, error } = useChatMessages(uid, { markRead: true });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] text-quaternary">
        Loading…
      </div>
    );
  }

  if (!uid) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] text-quaternary">
        Please sign in to use chat.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-h-[calc(100vh-80px)]">
      <div className="shrink-0 px-6 py-4 border-b border-border bg-tertiary">
        <h1 className="text-xl font-semibold text-white">Support</h1>
        <p className="text-sm text-quaternary mt-0.5">
          Chat with our team — we typically reply within business hours.
        </p>
      </div>

      {error ? (
        <div className="px-4 py-2 text-sm text-[#FA3C67] bg-[#FA3C67]/10">
          Could not load messages. Deploy Firestore rules if you haven&apos;t yet.
        </div>
      ) : null}

      <ChatMessageList
        messages={messages}
        loading={loading}
        viewerRole={CHAT_SENDER_ROLE.USER}
      />

      <ChatComposer conversationUserId={uid} />
    </div>
  );
}
