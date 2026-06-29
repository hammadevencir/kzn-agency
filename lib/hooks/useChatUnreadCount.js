"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { CHAT_CONVERSATIONS_COLLECTION } from "@/lib/chat/constants";
import { ROLE } from "@/lib/auth/constants";

/**
 * Total unread count for sidebar badge.
 * @param {'admin' | 'user'} role
 */
export function useChatUnreadCount(role) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let unsub = () => {};

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsub();

      if (!firebaseUser) {
        setUnreadCount(0);
        return;
      }

      if (role === ROLE.USER) {
        const ref = doc(db, CHAT_CONVERSATIONS_COLLECTION, firebaseUser.uid);
        unsub = onSnapshot(
          ref,
          (snap) => {
            const count = snap.exists() ? Number(snap.data()?.userUnreadCount) || 0 : 0;
            setUnreadCount(count);
          },
          () => setUnreadCount(0)
        );
        return;
      }

      if (role === ROLE.ADMIN) {
        const ref = collection(db, CHAT_CONVERSATIONS_COLLECTION);
        unsub = onSnapshot(
          ref,
          (snap) => {
            let total = 0;
            for (const d of snap.docs) {
              total += Number(d.data()?.adminUnreadCount) || 0;
            }
            setUnreadCount(total);
          },
          () => setUnreadCount(0)
        );
        return;
      }

      setUnreadCount(0);
    });

    return () => {
      unsubAuth();
      unsub();
    };
  }, [role]);

  return unreadCount;
}
