import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

// Nombre de notifications non lues, en temps réel (badge cloche).
export function useUnreadNotifications() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!db || !user) {
      setCount(0);
      return;
    }
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where("receiverId", "==", user.uid),
      where("isRead", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => setCount(snap.size), () => setCount(0));
    return unsub;
  }, [user?.uid]);

  return count;
}
