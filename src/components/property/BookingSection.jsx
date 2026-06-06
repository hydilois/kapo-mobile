import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { format, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { formatPrice, computePricing } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useAvailability } from "@/hooks/useAvailability";
import RangeCalendar from "./RangeCalendar";
import { colors, fonts, radius } from "@/theme";

const fmtFr = (iso) => (iso ? format(parseISO(iso), "dd/MM/yyyy") : "");

// Bloc réservation — transposition du BookingWidget web : dates via
// RangeCalendar (nuits indisponibles), prix computePricing, bouton Réserver.
export default function BookingSection({ property }) {
  const router = useRouter();
  const { user } = useAuth();
  const [arrivee, setArrivee] = useState("");
  const [depart, setDepart] = useState("");
  const [showCal, setShowCal] = useState(false);

  const { unavailable, bounds } = useAvailability(property);

  // Un hôte ne réserve pas sa propre annonce.
  const isOwner = Boolean(user && property.agentId && property.agentId === user.uid);

  const calc = useMemo(
    () => computePricing(property, arrivee, depart),
    [arrivee, depart, property]
  );

  function onSelect(a, d) {
    setArrivee(a || "");
    setDepart(d || "");
    if (a && d) setShowCal(false);
  }

  function reserve() {
    const target = `/reservation/${property.id}?arrivee=${arrivee}&depart=${depart}`;
    if (!user) {
      router.push({ pathname: "/connexion", params: { next: target } });
      return;
    }
    router.push(target);
  }

  return (
    <View style={styles.box}>
      <Text style={styles.price}>
        {formatPrice(property.price)} <Text style={styles.perNight}>/ nuit</Text>
      </Text>
      <View style={styles.underline} />

      {/* Champs de dates */}
      <View style={styles.dates}>
        <DateField label="Date d'arrivée" value={fmtFr(arrivee)} onPress={() => setShowCal(true)} />
        <DateField label="Date de départ" value={fmtFr(depart)} onPress={() => setShowCal(true)} />
      </View>

      {showCal ? (
        <View style={{ marginTop: 12 }}>
          <RangeCalendar
            arrivee={arrivee}
            depart={depart}
            onSelect={onSelect}
            unavailable={unavailable}
            min={bounds.min}
            max={bounds.max}
          />
          <Pressable onPress={() => setShowCal(false)}>
            <Text style={styles.closeCal}>Fermer le calendrier</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Détails sur la réservation */}
      {calc && !showCal ? (
        <View style={styles.details}>
          <Row
            label={`${formatPrice(property.price)} x ${calc.nights} nuit${calc.nights > 1 ? "s" : ""}`}
            value={formatPrice(calc.subtotal)}
          />
          {calc.discount > 0 ? (
            <Row label={`Réduction (${calc.reductionRate}%)`} value={`-${formatPrice(calc.discount)}`} accent />
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalLabel}>{formatPrice(calc.total)}</Text>
          </View>
        </View>
      ) : null}

      {isOwner ? (
        <Text style={styles.ownerNote}>
          Vous êtes l'hôte de ce logement : vous ne pouvez pas le réserver.
        </Text>
      ) : (
        <>
          <Text style={styles.note}>Aucun montant ne vous sera débité pour le moment</Text>
          <Pressable
            style={[styles.reserveBtn, !calc && { opacity: 0.5 }]}
            disabled={!calc}
            onPress={reserve}
          >
            <Text style={styles.reserveText}>Réserver</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function DateField({ label, value, onPress }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Pressable style={styles.dateField} onPress={onPress}>
        <Feather name="calendar" size={15} color={colors.muted} />
        <Text style={[styles.dateValue, !value && { color: colors.muted }]}>
          {value || "jj/mm/aaaa"}
        </Text>
      </Pressable>
    </View>
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
  box: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    padding: 16,
    backgroundColor: colors.white,
  },
  price: { fontFamily: fonts.bodyBold, fontSize: 22, color: colors.ink },
  perNight: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  underline: { width: 48, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 8 },
  dates: { flexDirection: "row", gap: 10, marginTop: 16 },
  dateLabel: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.ink, marginBottom: 4 },
  dateField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
  },
  dateValue: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  closeCal: {
    textAlign: "center",
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    paddingVertical: 8,
  },
  details: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rowText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  ownerNote: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    textAlign: "center",
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
  },
  note: {
    marginTop: 14,
    textAlign: "center",
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
  },
  reserveBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: radius.kapo,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  reserveText: { color: colors.white, fontFamily: fonts.bodySemiBold, fontSize: 15 },
});
