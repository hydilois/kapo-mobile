// Favoris du voyageur (côté client). Doc id déterministe `${uid}_${propertyId}`
// pour éviter les doublons. On dénormalise quelques champs du logement pour
// afficher la liste sans lectures supplémentaires.

import {
  collection, query, where, getDocs, setDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";

function favId(uid, propertyId) {
  return `${uid}_${propertyId}`;
}

// On vérifie l'existence par REQUÊTE (pas getDoc par id) : lire un document
// inexistant est refusé par les règles (resource == null), tandis qu'une requête
// renvoie simplement un résultat vide.
async function findFavorite(uid, propertyId) {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.FAVORITES),
      where("userId", "==", uid),
      where("propertyId", "==", propertyId)
    )
  );
  return snap.empty ? null : snap.docs[0];
}

export async function isFavorited(uid, propertyId) {
  if (!db || !uid) return false;
  return Boolean(await findFavorite(uid, propertyId));
}

// Ajoute ou retire ; retourne le nouvel état (true = en favori).
export async function toggleFavorite(uid, property) {
  if (!db) throw new Error("Firebase n'est pas configuré (voir CLAUDE.md).");
  const found = await findFavorite(uid, property.id);
  if (found) {
    await deleteDoc(found.ref);
    return false;
  }
  await setDoc(doc(db, COLLECTIONS.FAVORITES, favId(uid, property.id)), {
    userId: uid,
    propertyId: property.id,
    // dénormalisation pour l'affichage de la liste
    propertyTitle: property.title || "",
    propertyImage: property.image || "",
    propertyAddress: property.address || "",
    propertyPrice: property.price || 0,
    propertyRooms: property.rooms || 0,
    propertyTravelers: property.travelers || 0,
    propertyReduction: property.reduction || 0,
    createdAt: serverTimestamp(),
  });
  return true;
}

export async function getUserFavorites(uid) {
  if (!db || !uid) return [];
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.FAVORITES), where("userId", "==", uid))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}
