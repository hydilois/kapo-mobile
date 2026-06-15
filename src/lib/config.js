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

// Largeurs autorisées par l'optimiseur Next déployé (defaults imageSizes+deviceSizes).
const ALLOWED_W = [256, 384, 640, 750, 828, 1080];
const snapW = (w) => ALLOWED_W.find((x) => x >= w) || ALLOWED_W[ALLOWED_W.length - 1];

// Renvoie une URL d'image OPTIMISÉE (redimensionnée + WebP) en passant par
// l'optimiseur d'images du site Next (/_next/image) — gros gain de bande
// passante sur mobile. `dataSaver` réduit encore largeur et qualité.
// Les images locales (file:, data:, picker) sont renvoyées telles quelles.
export function optimizedImage(image, width = 640, { dataSaver = false } = {}) {
  const abs = resolveImageUrl(image);
  if (!abs || !/^https?:\/\//i.test(abs)) return abs;
  const w = snapW(dataSaver ? Math.min(width, 384) : width);
  const q = dataSaver ? 35 : 62;
  return `${API_BASE_URL}/_next/image?url=${encodeURIComponent(abs)}&w=${w}&q=${q}`;
}

// Source complète pour <Image> (expo-image) : URI optimisée + en-tête Accept
// forçant le WebP côté optimiseur Next (≈95 % de bande passante en moins vs
// l'image d'origine). Renvoie null si pas d'image (le composant gère le repli).
export function imgSource(image, width = 640, opts = {}) {
  const uri = optimizedImage(image, width, opts);
  if (!uri) return null;
  return uri.includes("/_next/image")
    ? { uri, headers: { Accept: "image/webp,image/*,*/*" } }
    : { uri };
}
