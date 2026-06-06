// Notifications reçues par l'utilisateur connecté (côté client).

import {
  collection, query, where, getDocs, doc, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";

export async function getUserNotifications(uid) {
  if (!db) throw new Error("Firebase n'est pas configuré (voir CLAUDE.md).");
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.NOTIFICATIONS), where("receiverId", "==", uid))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function markNotificationRead(id) {
  if (!db) return;
  await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), { isRead: true });
}
