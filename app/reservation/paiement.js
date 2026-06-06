import { useRef, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import {
  confirmPayunitPayment,
  confirmStripePayment,
  capturePaypalPayment,
} from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import PaymentResult from "@/components/payment/PaymentResult";
import { colors, fonts } from "@/theme";

// Le serveur fixe les URLs de retour des paiements sur le domaine web :
// /voyageur/reservation/{propertyId}?provider=…&reservationId=…(&session_id|&token|&cancelled=1)
// On intercepte cette navigation dans la WebView, on en extrait les paramètres
// et on confirme NATIVEMENT (avec le jeton Firebase de l'app) via l'API.
const RETURN_PREFIX = `${API_BASE_URL}/voyageur/reservation/`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function PaymentWebViewScreen() {
  const { url, provider, reservationId } = useLocalSearchParams();
  const checkoutUrl = decodeURIComponent(String(url || ""));

  const handled = useRef(false); // idempotence : la page de retour peut émettre plusieurs événements
  const [phase, setPhase] = useState("checkout"); // checkout | confirming | success | failed | cancelled
  const [error, setError] = useState("");

  async function confirm(params) {
    setPhase("confirming");
    try {
      // PENDING : on retente 3 fois (3 s d'intervalle), le webhook serveur
      // finit de toute façon le travail en cas d'attente prolongée.
      for (let attempt = 0; attempt < 3; attempt++) {
        const { status } = await callConfirm(params);
        if (status === "SUCCESSFUL") {
          setPhase("success");
          return;
        }
        if (status === "FAILED") break;
        await sleep(3000);
      }
      setPhase("failed");
      setError("Le paiement n'a pas pu être confirmé. S'il a été débité, il sera validé automatiquement sous peu.");
    } catch (err) {
      // 409 « déjà payée » = déjà confirmé (webhook) → succès
      if (String(err?.message || "").includes("déjà payée")) {
        setPhase("success");
        return;
      }
      setPhase("failed");
      setError(err?.message || "Une erreur est survenue pendant la confirmation.");
    }
  }

  function callConfirm(params) {
    if (provider === "stripe")
      return confirmStripePayment({ reservationId, sessionId: params.session_id || "" });
    if (provider === "paypal")
      return capturePaypalPayment({ reservationId, token: params.token || "" });
    return confirmPayunitPayment({ reservationId });
  }

  function onNavigation(navUrl) {
    if (handled.current) return false;
    if (!navUrl.startsWith(RETURN_PREFIX)) return true; // laisser charger
    handled.current = true;

    const params = {};
    try {
      const parsed = new URL(navUrl);
      parsed.searchParams.forEach((v, k) => (params[k] = v));
    } catch {
      // URL malformée : on tente quand même la confirmation
    }

    if (params.cancelled === "1") {
      setPhase("cancelled");
    } else {
      confirm(params);
    }
    return false; // ne pas charger la page web de retour
  }

  if (phase === "success") {
    return (
      <PaymentResult
        success
        title="Réservation confirmée !"
        message="Votre paiement a bien été reçu. L'hôte a été informé de votre réservation."
      />
    );
  }

  if (phase === "failed") {
    return (
      <PaymentResult
        title="Paiement non abouti"
        message={error}
      />
    );
  }

  if (phase === "cancelled") {
    return (
      <PaymentResult
        title="Paiement annulé"
        message="Vous avez annulé le paiement. Votre réservation reste en attente : vous pouvez la régler plus tard depuis « Mes réservations »."
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: "Paiement sécurisé" }} />
      {phase === "confirming" ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.confirming}>Confirmation du paiement…</Text>
        </View>
      ) : (
        <WebView
          source={{ uri: checkoutUrl }}
          // Interception du retour : iOS passe par onShouldStartLoadWithRequest,
          // Android par onNavigationStateChange (les deux sont branchés).
          onShouldStartLoadWithRequest={(req) => onNavigation(req.url)}
          onNavigationStateChange={(navState) => {
            if (navState.url && navState.url.startsWith(RETURN_PREFIX)) onNavigation(navState.url);
          }}
          startInLoadingState
          renderLoading={() => (
            <View style={[StyleSheet.absoluteFill, styles.center]}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          )}
          incognito
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: colors.background,
  },
  confirming: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
});
