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
import { CHAT_CONVERSATIONS_COLLECTION } from "@/lib/chat/constants";

/** Admin inbox: all conversations ordered by last activity. */
export function useChatConversations() {
  const [conversations, setConversations] = useState(
    /** @type {Array<{ id: string } & Record<string, unknown>>} */ ([])
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    let unsubConversations = () => {};

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubConversations();

      if (!firebaseUser) {
        setConversations([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const ref = query(
        collection(db, CHAT_CONVERSATIONS_COLLECTION),
        orderBy("lastMessageAt", "desc")
      );

      unsubConversations = onSnapshot(
        ref,
        (snap) => {
          setConversations(
            snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }))
          );
          setLoading(false);
        },
        (err) => {
          console.warn("useChatConversations:", err);
          setError("listener_failed");
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      unsubConversations();
    };
  }, []);

  return { conversations, loading, error };
}
