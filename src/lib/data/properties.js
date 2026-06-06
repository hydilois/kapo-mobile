// Accès aux annonces (logements) via Firestore — utilisable côté client.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fbLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS, PROPERTY_STATUS } from "@/lib/constants";

const col = () => collection(db, COLLECTIONS.PROPERTIES);

function mapDoc(d) {
  return { id: d.id, ...d.data() };
}

// Annonces publiées (catalogue public)
export async function getPublishedProperties({ max = 24 } = {}) {
  const q = query(
    col(),
    where("isPublished", "==", true),
    orderBy("createdAt", "desc"),
    fbLimit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapDoc);
}

// Les plus sollicitées (mis en avant) — fallback sur les plus récentes
export async function getFeaturedProperties({ max = 8 } = {}) {
  return getPublishedProperties({ max });
}

export async function getPropertyById(id) {
  const ref = doc(db, COLLECTIONS.PROPERTIES, id);
  const snap = await getDoc(ref);
  return snap.exists() ? mapDoc(snap) : null;
}

export async function getPropertiesByCategory(categoryId, { max = 24 } = {}) {
  const q = query(
    col(),
    where("isPublished", "==", true),
    where("categoryId", "==", categoryId),
    fbLimit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapDoc);
}

export async function getPropertiesByTown(townId, { max = 24 } = {}) {
  const q = query(
    col(),
    where("isPublished", "==", true),
    where("townId", "==", townId),
    fbLimit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapDoc);
}

// Recherche filtrée (ville, catégorie, voyageurs, prix).
// Firestore n'autorisant pas tous les filtres combinés, on filtre le reste en mémoire.
export async function searchProperties({
  townId,
  categoryId,
  travelers,
  maxPrice,
  max = 48,
} = {}) {
  const clauses = [where("isPublished", "==", true)];
  if (townId) clauses.push(where("townId", "==", townId));
  if (categoryId) clauses.push(where("categoryId", "==", categoryId));

  const q = query(col(), ...clauses, fbLimit(max));
  const snap = await getDocs(q);
  let results = snap.docs.map(mapDoc);

  if (travelers) results = results.filter((p) => (p.travelers || 1) >= Number(travelers));
  if (maxPrice) results = results.filter((p) => (p.price || 0) <= Number(maxPrice));

  return results;
}
