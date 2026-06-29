"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import {
  CHAT_CONVERSATIONS_COLLECTION,
  CHAT_MESSAGES_SUBCOLLECTION,
} from "@/lib/chat/constants";
import { markChatReadClient } from "@/lib/chat/client";

/**
 * Live messages for a conversation.
 * @param {string | null | undefined} conversationUserId
 * @param {{ markRead?: boolean }} [options]
 */
export function useChatMessages(conversationUserId, options = {}) {
  const { markRead = true } = options;
  const [messages, setMessages] = useState(/** @type {Array<{ id: string } & Record<string, unknown>>} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    if (!conversationUserId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let unsubMessages = () => {};
    setLoading(true);
    setError(null);

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubMessages();

      if (!firebaseUser) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const ref = query(
        collection(
          db,
          CHAT_CONVERSATIONS_COLLECTION,
          conversationUserId,
          CHAT_MESSAGES_SUBCOLLECTION
        ),
        orderBy("createdAt", "asc")
      );

      unsubMessages = onSnapshot(
        ref,
        (snap) => {
          const items = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setMessages(items);
          setLoading(false);

          if (markRead && items.length > 0) {
            markChatReadClient(conversationUserId).catch(() => {});
          }
        },
        (err) => {
          console.warn("useChatMessages:", err);
          setError("listener_failed");
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      unsubMessages();
    };
  }, [conversationUserId, markRead]);

  return { messages, loading, error };
}
