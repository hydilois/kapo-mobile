// Configuration de l'app mobile.
// Base URL des API HTTP du site Kapo (réservations, paiements, e-mails…).
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://kapo.elshaseries.com"
).replace(/\/+$/, "");
