import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { getPropertyById } from "@/lib/data/properties";
import { useFetch } from "@/hooks/useFetch";
import { formatPrice, formatDate, computePricing } from "@/lib/utils";
import {
  createReservation,
  initiatePayunitPayment,
  initiateStripePayment,
  initiatePaypalPayment,
  confirmPayunitPayment,
  confirmStripePayment,
  capturePaypalPayment,
} from "@/lib/api";
import RequireAuth from "@/components/layout/RequireAuth";
import Button from "@/components/ui/Button";
import PaymentResult from "@/components/payment/PaymentResult";
import { colors, fonts, radius } from "@/theme";

// Méthodes de paiement — Mobile Money (PayUnit) recommandé, comme sur le web.
const METHODS = [
  {
    key: "payunit",
    label: "Mobile Money",
    sub: "MTN MoMo, Orange Money — recommandé",
    icon: "smartphone",
  },
  { key: "stripe", label: "Carte bancaire", sub: "Visa, Mastercard", icon: "credit-card" },
  { key: "paypal", label: "PayPal", sub: "Compte PayPal", icon: "globe" },
];

const INITIATORS = {
  payunit: initiatePayunitPayment,
  stripe: initiateStripePayment,
  paypal: initiatePaypalPayment,
};

// Confirmations en mode simulation (pas de redirection : on confirme direct).
const SIMULATED_CONFIRM = {
  payunit: (reservationId) => confirmPayunitPayment({ reservationId }),
  stripe: (reservationId) => confirmStripePayment({ reservationId, sessionId: "simulated" }),
  paypal: (reservationId) => capturePaypalPayment({ reservationId, token: "simulated" }),
};

export default function ReservationScreen() {
  const { propertyId, arrivee, depart } = useLocalSearchParams();
  return (
    <RequireAuth
      message="Connectez-vous pour réserver ce logement."
      next={`/reservation/${propertyId}?arrivee=${arrivee || ""}&depart=${depart || ""}`}
    >
      <ReservationContent />
    </RequireAuth>
  );
}

function ReservationContent() {
  const router = useRouter();
  // `resume` : reprise du paiement d'une réservation existante (« Payer
  // maintenant » depuis Mes réservations) — on ne recrée pas de réservation.
  const { propertyId, arrivee, depart, resume } = useLocalSearchParams();
  const [method, setMethod] = useState("payunit");
  const [phase, setPhase] = useState("idle"); // idle | processing | success | failed
  const [error, setError] = useState("");

  const { data: property, loading } = useFetch(() => getPropertyById(propertyId), [propertyId]);

  const calc = useMemo(
    () => (property ? computePricing(property, arrivee, depart) : null),
    [property, arrivee, depart]
  );

  async function pay() {
    setError("");
    setPhase("processing");
    try {
      // Étape 1 : reprise d'une réservation existante (resume) ou création
      let reservationId = resume;
      if (!reservationId) {
        const { reservation } = await createReservation({ propertyId, arrivee, depart });
        reservationId = reservation.id;
      }
      // Étape 2 : initiation du paiement selon la méthode
      const { url, simulated } = await INITIATORS[method]({ reservationId });
      if (simulated) {
        // Mode simulation (clés absentes côté serveur) : confirmation directe
        const { status } = await SIMULATED_CONFIRM[method](reservationId);
        setPhase(status === "SUCCESSFUL" ? "success" : "failed");
        if (status !== "SUCCESSFUL") setError("Le paiement n'a pas abouti. Réessayez.");
        return;
      }
      // Checkout réel : écran WebView avec interception du retour
      setPhase("idle");
      router.push({
        pathname: "/reservation/paiement",
        params: { url: encodeURIComponent(url), provider: method, reservationId },
      });
    } catch (err) {
      setPhase("failed");
      setError(err?.message || "Une erreur est survenue. Réessayez.");
    }
  }

  if (loading || !property) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Réservation" }} />
        <Text style={styles.muted}>{loading ? "Chargement…" : "Logement introuvable."}</Text>
      </View>
    );
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: "Réservation" }} />

      {resume ? (
        <View style={styles.resumeBanner}>
          <Feather name="info" size={14} color="#1d4ed8" />
          <Text style={styles.resumeText}>
            Reprise du paiement de votre réservation en attente — aucune nouvelle réservation ne
            sera créée.
          </Text>
        </View>
      ) : null}

      {/* Récapitulatif */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{property.title}</Text>
        <Row label="Arrivée" value={formatDate(arrivee)} />
        <Row label="Départ" value={formatDate(depart)} />
        {calc ? (
          <>
            <Row
              label={`${formatPrice(calc.pricePerNight)} x ${calc.nights} nuit${calc.nights > 1 ? "s" : ""}`}
              value={formatPrice(calc.subtotal)}
            />
            {calc.discount > 0 ? (
              <Row label={`Réduction (${calc.reductionRate}%)`} value={`-${formatPrice(calc.discount)}`} accent />
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalText}>{formatPrice(calc.total)}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.muted}>Dates invalides — revenez au logement pour les choisir.</Text>
        )}
      </View>

      {/* Choix de la méthode */}
      <Text style={styles.sectionTitle}>Moyen de paiement</Text>
      <View style={{ gap: 10 }}>
        {METHODS.map((m) => {
          const active = method === m.key;
          return (
            <Pressable
              key={m.key}
              style={[styles.method, active && styles.methodActive]}
              onPress={() => setMethod(m.key)}
            >
              <View style={[styles.methodIcon, active && { backgroundColor: colors.primary }]}>
                <Feather name={m.icon} size={17} color={active ? colors.white : colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodLabel}>{m.label}</Text>
                <Text style={styles.methodSub}>{m.sub}</Text>
              </View>
              <Feather
                name={active ? "check-circle" : "circle"}
                size={18}
                color={active ? colors.primary : colors.border}
              />
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={calc ? `Payer ${formatPrice(calc.total)}` : "Payer"}
        onPress={pay}
        loading={phase === "processing"}
        disabled={!calc}
        style={{ marginTop: 20 }}
      />
      <Text style={styles.secureNote}>
        <Feather name="lock" size={11} color={colors.muted} /> Paiement sécurisé — aucun montant
        n'est débité sans votre confirmation.
      </Text>
    </ScrollView>
  );
}

function Row({ label, value, accent }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowText, accent && { color: colors.success }]}>{label}</Text>
      <Text style={[styles.rowText, accent && { color: colors.success }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    padding: 14,
    gap: 2,
  },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.navy, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  rowText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 6,
  },
  totalText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.navy, marginVertical: 14 },
  method: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    padding: 12,
  },
  methodActive: { borderColor: colors.primary, backgroundColor: "#FFF8F9" },
  methodIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  methodLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  methodSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  error: {
    marginTop: 14,
    backgroundColor: "#FEF2F2",
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 13,
    borderRadius: radius.kapo,
    padding: 12,
  },
  secureNote: {
    marginTop: 12,
    textAlign: "center",
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.muted,
  },
  muted: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  resumeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: radius.kapo,
    padding: 12,
    marginBottom: 14,
  },
  resumeText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: "#1d4ed8", lineHeight: 18 },
});
