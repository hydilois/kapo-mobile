// Appels API authentifiés vers le site Kapo (joint le jeton Firebase).
// Adaptation mobile de src/lib/api.js du web : mêmes fonctions, URLs
// préfixées par API_BASE_URL (le mobile n'a pas de chemin relatif).
import { auth } from "@/lib/firebase/client";
import { API_BASE_URL } from "@/lib/config";

async function authHeaders() {
  const user = auth?.currentUser;
  if (!user) throw new Error("Vous devez être connecté.");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");
  return data;
}

const url = (path) => `${API_BASE_URL}${path}`;

export async function createReservation({ propertyId, arrivee, depart }) {
  const res = await fetch(url("/api/reservations"), {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ propertyId, arrivee, depart }),
  });
  return handle(res); // { reservation }
}

// --- PayUnit (Mobile Money, checkout hébergé) ---
export async function initiatePayunitPayment({ reservationId }) {
  const res = await fetch(url("/api/payments/payunit"), {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ reservationId }),
  });
  return handle(res); // { url, simulated }
}

export async function confirmPayunitPayment({ reservationId }) {
  const res = await fetch(
    url(`/api/payments/payunit/confirm?reservationId=${encodeURIComponent(reservationId)}`),
    { headers: await authHeaders() }
  );
  return handle(res); // { status }
}

// --- Stripe ---
export async function initiateStripePayment({ reservationId }) {
  const res = await fetch(url("/api/payments/stripe"), {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ reservationId }),
  });
  return handle(res); // { url, simulated }
}

export async function confirmStripePayment({ reservationId, sessionId }) {
  const res = await fetch(
    url(
      `/api/payments/stripe/confirm?reservationId=${encodeURIComponent(reservationId)}&session_id=${encodeURIComponent(sessionId)}`
    ),
    { headers: await authHeaders() }
  );
  return handle(res); // { status }
}

// --- PayPal ---
export async function initiatePaypalPayment({ reservationId }) {
  const res = await fetch(url("/api/payments/paypal"), {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ reservationId }),
  });
  return handle(res); // { url, simulated }
}

export async function capturePaypalPayment({ reservationId, token }) {
  const res = await fetch(
    url(
      `/api/payments/paypal/capture?reservationId=${encodeURIComponent(reservationId)}&token=${encodeURIComponent(token)}`
    ),
    { headers: await authHeaders() }
  );
  return handle(res); // { status }
}

// --- Annulation par le voyageur d'une réservation non payée ---
export async function cancelReservationApi({ reservationId }) {
  const res = await fetch(url("/api/reservations/cancel"), {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ reservationId }),
  });
  return handle(res); // { status: "Annulée" }
}

// --- Décision hôte sur une réservation reçue (accepter/refuser) ---
// Met à jour le statut + notifie + e-mail le voyageur (côté serveur).
export async function decideReservationApi({ reservationId, accept }) {
  const res = await fetch(url("/api/reservations/decision"), {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ reservationId, accept }),
  });
  return handle(res); // { status }
}

// --- Vérification e-mail (Resend) ---
export async function sendVerificationEmail() {
  const res = await fetch(url("/api/auth/send-verification"), {
    method: "POST",
    headers: await authHeaders(),
  });
  return handle(res); // { sent, simulated } | { alreadyVerified }
}

// --- Alerte admin lors d'un signalement d'annonce ---
export async function notifyAdminReport({ propertyId, propertyTitle, reason, details }) {
  const res = await fetch(url("/api/reports"), {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ propertyId, propertyTitle, reason, details }),
  });
  return handle(res);
}
