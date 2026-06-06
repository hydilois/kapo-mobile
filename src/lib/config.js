// Configuration de l'app mobile.
// Base URL des API HTTP du site Kapo (réservations, paiements, e-mails…).
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://kapo.elshaseries.com"
).replace(/\/+$/, "");

// Certaines images en base (villes, anciennes catégories) sont des chemins
// relatifs au site web (ex. "/img/banniere/4.jpg") : valides dans le
// navigateur, mais pas sur mobile → on les préfixe par le domaine du site.
export function resolveImageUrl(image) {
  if (!image) return null;
  if (image.startsWith("/")) return `${API_BASE_URL}${image}`;
  return image;
}
