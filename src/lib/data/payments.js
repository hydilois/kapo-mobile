// Moyens de paiement (versements) de l'hôte + versements reçus. Côté client.

import {
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";

function assertDb() {
  if (!db) throw new Error("Firebase n'est pas configuré (voir CLAUDE.md).");
}

export async function getPaymentMethods(uid) {
  assertDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.PAYMENT_METHODS), where("userId", "==", uid))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
}

export async function addPaymentMethod(uid, data, makeDefault) {
  assertDb();
  const ref = await addDoc(collection(db, COLLECTIONS.PAYMENT_METHODS), {
    ...data,
    userId: uid,
    isDefault: Boolean(makeDefault),
    createdAt: serverTimestamp(),
  });
  if (makeDefault) await setDefaultMethod(uid, ref.id);
  return ref.id;
}

export async function deletePaymentMethod(id) {
  assertDb();
  await deleteDoc(doc(db, COLLECTIONS.PAYMENT_METHODS, id));
}

export async function setDefaultMethod(uid, id) {
  assertDb();
  const list = await getPaymentMethods(uid);
  await Promise.all(
    list.map((m) =>
      updateDoc(doc(db, COLLECTIONS.PAYMENT_METHODS, m.id), { isDefault: m.id === id })
    )
  );
}

// Versements de l'hôte (collection payouts) : à venir + à verser + versés.
// Le net hôte (montant) tient déjà compte de la commission Kapo.
export async function getHostPayouts(uid) {
  assertDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.PAYOUTS), where("agentId", "==", uid))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}
