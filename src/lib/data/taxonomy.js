// Catégories, villes, équipements, témoignages — données de référence.
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";

async function all(name, orderField = "name") {
  try {
    const snap = await getDocs(query(collection(db, name), orderBy(orderField)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    // orderBy peut échouer si le champ n'existe pas encore : fallback sans tri
    const snap = await getDocs(collection(db, name));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

export const getCategories = () => all(COLLECTIONS.CATEGORIES);
export const getTowns = () => all(COLLECTIONS.TOWNS);
export const getRegions = () => all(COLLECTIONS.REGIONS);
export const getDepartments = () => all(COLLECTIONS.DEPARTMENTS);
export const getConforts = () => all(COLLECTIONS.CONFORTS, "libelle");
export const getTestimonials = () => all(COLLECTIONS.TESTIMONIALS, "author");

// Villes ayant au moins un logement publié — même logique que
// fetchActiveTowns() du site web (repli : toutes les villes).
export async function getActiveTowns() {
  const { getPublishedProperties } = await import("./properties");
  const [towns, properties] = await Promise.all([
    getTowns(),
    getPublishedProperties({ max: 200 }),
  ]);
  const usedTownIds = new Set(properties.map((p) => p.townId).filter(Boolean));
  const active = towns.filter((t) => usedTownIds.has(t.id));
  return active.length ? active : towns;
}
