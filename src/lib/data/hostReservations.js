// Lecture des réservations reçues par l'hôte (côté client).
// La DÉCISION (accepter/refuser) passe par la route serveur
// `/api/reservations/decision` (cf. lib/api.js → decideReservationApi),
// qui met à jour le statut, crée la notification et envoie l'e-mail.

import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";

export async function getHostReservations(uid) {
  if (!db) throw new Error("Firebase n'est pas configuré (voir CLAUDE.md).");
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.RESERVATIONS), where("agentId", "==", uid))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}
