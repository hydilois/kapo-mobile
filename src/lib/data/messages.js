// Messagerie hôte ↔ voyageur (lecture temps réel, mobile).
// Écritures via le serveur (lib/api.js → /api/messages) ; ici lecture seule.
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";

export const conversationIdFor = (propertyId, voyageurId) => `${propertyId}__${voyageurId}`;

const secs = (t) => t?.seconds || 0;

export function listenConversations(uid, cb) {
  if (!db || !uid) return () => {};
  const q = query(collection(db, COLLECTIONS.CONVERSATIONS), where("participantIds", "array-contains", uid));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => secs(b.lastAt) - secs(a.lastAt))),
    () => cb([])
  );
}

export function listenMessages(convId, cb) {
  if (!db || !convId) return () => {};
  const q = query(collection(db, COLLECTIONS.MESSAGES), where("conversationId", "==", convId));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => secs(a.createdAt) - secs(b.createdAt))),
    () => cb([])
  );
}

export async function getConversation(convId) {
  if (!db || !convId) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.CONVERSATIONS, convId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch {
    return null;
  }
}

export function unreadTotal(conversations, uid) {
  return (conversations || []).reduce((sum, c) => sum + (c.unread?.[uid] || 0), 0);
}
