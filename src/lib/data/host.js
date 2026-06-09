// Gestion des annonces de l'hôte connecté (côté client, autorisé par les règles
// Firestore : create si connecté, update/delete si agentId == uid).

import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs,
  query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS, PROPERTY_STATUS } from "@/lib/constants";
import { slugify } from "@/lib/utils";

function assertDb() {
  if (!db) throw new Error("Firebase n'est pas configuré (voir CLAUDE.md).");
}

// Crée une annonce. `published` détermine la mise en ligne immédiate.
export async function createProperty(uid, data, { published = false } = {}) {
  assertDb();
  const ref = await addDoc(collection(db, COLLECTIONS.PROPERTIES), {
    ...normalize(data),
    agentId: uid,
    slug: slugify(data.title || ""),
    status: published ? PROPERTY_STATUS.VALIDATED : PROPERTY_STATUS.PENDING,
    isComplete: true,
    isPublished: published,
    rating: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Le créateur d'une annonce devient hôte
  await markUserAsHost(uid);
  // Visibilité immédiate dans le catalogue public (sinon ISR ~60 s)
  return ref.id;
}

export async function updateProperty(id, data, { published } = {}) {
  assertDb();
  const patch = { ...normalize(data), slug: slugify(data.title || ""), updatedAt: serverTimestamp() };
  if (typeof published === "boolean") {
    patch.isPublished = published;
    patch.status = published ? PROPERTY_STATUS.VALIDATED : PROPERTY_STATUS.PENDING;
  }
  await updateDoc(doc(db, COLLECTIONS.PROPERTIES, id), patch);
}

export async function setPublished(id, published) {
  assertDb();
  await updateDoc(doc(db, COLLECTIONS.PROPERTIES, id), {
    isPublished: published,
    status: published ? PROPERTY_STATUS.VALIDATED : PROPERTY_STATUS.PENDING,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProperty(id) {
  assertDb();
  await deleteDoc(doc(db, COLLECTIONS.PROPERTIES, id));
}

export async function getProperty(id) {
  assertDb();
  const snap = await getDoc(doc(db, COLLECTIONS.PROPERTIES, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Duplique une annonce : crée un brouillon (non publié) reprenant ses champs.
export async function duplicateProperty(uid, propertyId) {
  assertDb();
  const src = await getProperty(propertyId);
  if (!src) throw new Error("Annonce introuvable.");
  // On retire les champs propres à l'original
  const { id, slug, createdAt, updatedAt, rating, isPublished, status, agentId, photoPaths, ...rest } = src;
  const title = `${src.title || "Annonce"} (copie)`;
  const ref = await addDoc(collection(db, COLLECTIONS.PROPERTIES), {
    ...normalize(rest),
    title,
    agentId: uid,
    slug: slugify(title),
    status: PROPERTY_STATUS.PENDING,
    isComplete: true,
    isPublished: false,
    rating: 0,
    photoPaths: [], // ne s'approprie pas les objets Storage de l'original
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await markUserAsHost(uid);
  return ref.id;
}

export async function getHostProperties(uid) {
  assertDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.PROPERTIES), where("agentId", "==", uid))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function markUserAsHost(uid) {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      isHost: true,
      updatedAt: serverTimestamp(),
    });
  } catch {
    /* document utilisateur absent : non bloquant */
  }
}

// Force les champs numériques en nombres.
function normalize(data) {
  const numbers = ["price", "surface", "rooms", "bedrooms", "bathrooms", "beds", "travelers", "reduction", "nbreNuitsLimite"];
  const out = { ...data };
  for (const k of numbers) if (out[k] != null) out[k] = Number(out[k]) || 0;
  return out;
}
