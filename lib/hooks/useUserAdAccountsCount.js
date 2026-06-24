"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { AD_ACCOUNT_STATUS } from "@/lib/ad-accounts/constants";

/**
 * Approved ad accounts for the signed-in user (dashboard access requires ≥1).
 * Expects documents in `ad-accounts` with field `userId` in Firestore.
 */
export function useUserAdAccountsCount() {
  const [user, setUser] = useState(null);
  const [approvedCount, setApprovedCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDocs = () => {};

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubDocs();
      setUser(firebaseUser);

      if (!firebaseUser) {
        setApprovedCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      const ref = query(
        collection(db, "ad-accounts"),
        where("userId", "==", firebaseUser.uid)
      );
      unsubDocs = onSnapshot(
        ref,
        (snap) => {
          const n = snap.docs.filter(
            (d) => d.data()?.status === AD_ACCOUNT_STATUS.APPROVED
          ).length;
          setApprovedCount(n);
          setLoading(false);
        },
        (err) => {
          console.warn("adAccounts listener:", err);
          setApprovedCount(0);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      unsubDocs();
    };
  }, []);

  return {
    user,
    approvedCount: approvedCount ?? 0,
    loading,
  };
}
