// Lecture des réservations côté client (pour l'espace voyageur).
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";

export async function getUserReservations(uid) {
  const q = query(
    collection(db, COLLECTIONS.RESERVATIONS),
    where("voyageurId", "==", uid)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Tri par date d'arrivée décroissante (évite un index composite Firestore)
  return list.sort((a, b) => (b.dateArrivee || "").localeCompare(a.dateArrivee || ""));
}
