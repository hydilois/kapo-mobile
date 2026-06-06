// Helpers partagés — copie de src/lib/utils.js du site web (sans cn/clsx,
// inutile en React Native). computePricing reste la source unique du calcul
// de prix, identique au serveur.

// Slug à partir d'un titre (équivalent Cocur\Slugify)
export function slugify(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Prix formaté en F CFA (Cameroun)
export function formatPrice(amount = 0) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " F CFA";
}

// Date courte FR
export function formatDate(value) {
  if (!value) return "";
  const d = value?.toDate ? value.toDate() : new Date(value);
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);
}

// Nombre de nuits entre deux dates
export function nightsBetween(arrivee, depart) {
  const a = new Date(arrivee);
  const d = new Date(depart);
  const diff = Math.ceil((d - a) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

// Numéro de réservation type "KA1234"
export function reservationNumber(id) {
  return "KA" + String(id).slice(-6).toUpperCase();
}

// Calcul du prix d'une réservation — UNIQUE source de vérité,
// partagée avec le site web et l'API serveur.
// Total = sous-total − réduction (pas de frais de service ajoutés au voyageur).
export function computePricing(property, arrivee, depart) {
  const nights = nightsBetween(arrivee, depart);
  if (!nights) return null;
  const pricePerNight = property?.price || 0;
  const subtotal = nights * pricePerNight;
  let discount = 0;
  let reductionRate = 0;
  if (property?.reduction > 0 && nights >= (property?.nbreNuitsLimite || 0)) {
    // Borne la réduction à 0–100 % pour empêcher un total nul ou négatif
    reductionRate = Math.min(Math.max(property.reduction, 0), 100);
    discount = Math.round((subtotal * reductionRate) / 100);
  }
  const total = subtotal - discount;
  return { nights, pricePerNight, subtotal, discount, reductionRate, total };
}

// Deux intervalles de dates (YYYY-MM-DD) se chevauchent-ils ?
export function datesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}
