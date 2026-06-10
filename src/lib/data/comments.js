// Avis / commentaires sur les logements (côté client).
// Règles Firestore : lecture publique ; CRÉATION RÉSERVÉE AU SERVEUR (avis
// vérifié, cf. lib/api.js#createReviewApi → POST /api/reviews) ; suppression
// par l'auteur (writerId) ou un admin.

import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";

// Liste les avis d'un logement, triés du plus récent au plus ancien.
export async function getPropertyComments(propertyId) {
  if (!db || !propertyId) return [];
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.COMMENTS), where("propertyId", "==", propertyId))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => !c.unsuitable)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function deleteComment(id) {
  if (!db) throw new Error("Firebase n'est pas configuré (voir CLAUDE.md).");
  await deleteDoc(doc(db, COLLECTIONS.COMMENTS, id));
}
