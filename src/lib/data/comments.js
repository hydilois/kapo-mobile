// Avis / commentaires sur les logements (côté client).
// Règles Firestore : lecture publique, création si connecté, édition/suppression
// par l'auteur (writerId) ou un admin.

import {
  collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
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

// Ajoute un avis. `author` = { uid, name, imageUrl }.
export async function addComment({ propertyId, author, content, rating }) {
  if (!db) throw new Error("Firebase n'est pas configuré (voir CLAUDE.md).");
  if (!author?.uid) throw new Error("Vous devez être connecté pour laisser un avis.");
  const text = (content || "").trim();
  if (!text) throw new Error("Votre avis ne peut pas être vide.");

  const ref = await addDoc(collection(db, COLLECTIONS.COMMENTS), {
    propertyId,
    writerId: author.uid,
    writerName: author.name || "Utilisateur Kapo",
    writerImage: author.imageUrl || "",
    content: text.slice(0, 2000),
    rating: Number(rating) || 0,
    unsuitable: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteComment(id) {
  if (!db) throw new Error("Firebase n'est pas configuré (voir CLAUDE.md).");
  await deleteDoc(doc(db, COLLECTIONS.COMMENTS, id));
}
