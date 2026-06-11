// Constantes métier reprises du projet Symfony source.

// Noms des collections Firestore
export const COLLECTIONS = {
  USERS: "users",
  PROPERTIES: "properties",
  RESERVATIONS: "reservations",
  COMMENTS: "comments",
  CATEGORIES: "categories",
  TOWNS: "towns",
  CONFORTS: "conforts", // équipements
  TESTIMONIALS: "testimonials",
  PAYMENT_METHODS: "paymentMethods",
  NOTIFICATIONS: "notifications",
  FAVORITES: "favorites",
  BANK: "bank", // configuration paiement globale (singleton)
  REPORTS: "reports", // signalements d'annonces
  PAYOUTS: "payouts", // versements dus aux hôtes
  CONVERSATIONS: "conversations", // fils de discussion hôte ↔ voyageur
  MESSAGES: "messages", // messages d'un fil de discussion
};

// Statuts d'un versement à l'hôte (payout).
// Cycle : À venir (séquestre) → À verser (libéré, prêt à payer) → Versé.
export const PAYOUT_STATUS = {
  UPCOMING: "À venir",
  DUE: "À verser",
  PAID: "Versé",
  FAILED: "Échec",
  CANCELLED: "Annulé",
};

// Commission Kapo par défaut (%) si non définie dans bank/default.commissionRate.
export const DEFAULT_COMMISSION_RATE = 12;

// Motifs de signalement / masquage d'annonce
export const REPORT_REASONS = [
  "Annonce frauduleuse / arnaque",
  "Photos trompeuses ou volées",
  "Logement inexistant",
  "Contenu inapproprié",
  "Prix ou informations erronés",
  "Autre",
];

// Rôles utilisateur (cf. User::roles dans Symfony)
export const ROLES = {
  USER: "ROLE_USER",
  HOST: "ROLE_HOST",
  ADMIN: "ROLE_ADMIN",
  SUPER_ADMIN: "ROLE_SUPER_ADMIN",
};

// Types de compte (User::typeCompte)
export const USER_TYPES = ["Propriétaire", "Professionnel du tourisme"];

// Statuts d'une annonce (Property::STATUS)
export const PROPERTY_STATUS = {
  PENDING: "En cours",
  VALIDATED: "Validé",
};

// Statuts d'une réservation (Reservation::STATUS)
export const RESERVATION_STATUS = {
  SENT: "Envoyée",
  ACCEPTED: "Acceptée",
  REFUSED: "Refusée",
  CANCELLED: "Annulée",
  COMPLETED: "Terminée",
};

// Options de paiement (méthode africaine en premier)
export const PAYMENT_OPTIONS = {
  MOBILE_MONEY: "Mobile Money",
  VISA: "Visa",
  PAYPAL: "Paypal",
  PAYLIB: "Paylib",
};

// Types de moyen de paiement hôte (PaymentMethod::OPTIONS)
export const PAYMENT_METHOD_TYPES = ["Compte Bancaire", "Compte MoMo"];
