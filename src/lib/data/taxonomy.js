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
export const getConforts = () => all(COLLECTIONS.CONFORTS, "libelle");
export const getTestimonials = () => all(COLLECTIONS.TESTIMONIALS, "author");
