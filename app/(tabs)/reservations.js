import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import Feather from "@expo/vector-icons/Feather";
import { getUserReservations } from "@/lib/data/reservations";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { formatPrice, formatDate, reservationNumber } from "@/lib/utils";
import { RESERVATION_STATUS } from "@/lib/constants";
import RequireAuth from "@/components/layout/RequireAuth";
import { colors, fonts, radius } from "@/theme";

// Couleurs de badge par statut (mêmes libellés que le web).
const STATUS_STYLE = {
  [RESERVATION_STATUS.SENT]: { bg: "#FEF9C3", fg: "#854d0e" },
  [RESERVATION_STATUS.ACCEPTED]: { bg: "#DCFCE7", fg: "#166534" },
  [RESERVATION_STATUS.COMPLETED]: { bg: "#DBEAFE", fg: "#1e40af" },
  [RESERVATION_STATUS.REFUSED]: { bg: "#FEE2E2", fg: "#991b1b" },
  [RESERVATION_STATUS.CANCELLED]: { bg: "#F3F4F6", fg: "#4b5563" },
};

export default function ReservationsScreen() {
  return (
    <RequireAuth message="Connectez-vous pour voir vos réservations." next="/(tabs)/reservations">
      <ReservationsContent />
    </RequireAuth>
  );
}

function ReservationsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, loading, reload } = useFetch(() => getUserReservations(user.uid), [user.uid]);

  // Recharge à chaque retour sur l'onglet (après un paiement par exemple)
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const list = data || [];

  return (
    <FlatList
      style={styles.screen}
      data={list}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      onRefresh={reload}
      refreshing={loading}
      ListEmptyComponent={
        !loading ? (
          <View style={styles.empty}>
            <Feather name="calendar" size={34} color={colors.muted} />
            <Text style={styles.emptyText}>Aucune réservation pour le moment.</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        const badge = STATUS_STYLE[item.status] || STATUS_STYLE[RESERVATION_STATUS.SENT];
        return (
          <Pressable style={styles.card} onPress={() => router.push(`/logement/${item.propertyId}`)}>
            <View style={styles.cardHeader}>
              <Text style={styles.title} numberOfLines={1}>
                {item.propertyTitle || "Logement"}
              </Text>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.fg }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.muted}>
              {formatDate(item.dateArrivee)} → {formatDate(item.dateDepart)} · {item.nbreNuits}{" "}
              nuit{item.nbreNuits > 1 ? "s" : ""}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.number}>{item.numeroReservation || reservationNumber(item.id)}</Text>
              <Text style={styles.total}>{formatPrice(item.total)}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    padding: 14,
    gap: 6,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.ink },
  badge: { borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontFamily: fonts.bodySemiBold, fontSize: 11 },
  muted: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  number: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.navy },
  total: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.primary },
  empty: { alignItems: "center", gap: 10, marginTop: 60 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted },
});
