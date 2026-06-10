import { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { getHostReservations } from "@/lib/data/hostReservations";
import { decideReservationApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { formatPrice, formatDate } from "@/lib/utils";
import { RESERVATION_STATUS } from "@/lib/constants";
import { colors, fonts, radius } from "@/theme";

const TABS = [
  { key: "all", label: "Toutes" },
  { key: RESERVATION_STATUS.SENT, label: "En attente" },
  { key: RESERVATION_STATUS.ACCEPTED, label: "Acceptées" },
  { key: RESERVATION_STATUS.COMPLETED, label: "Terminées" },
  { key: "refused", label: "Refusées" },
];

const BADGE = {
  [RESERVATION_STATUS.SENT]: { bg: "#FEF9C3", fg: "#854d0e" },
  [RESERVATION_STATUS.ACCEPTED]: { bg: "#DCFCE7", fg: "#166534" },
  [RESERVATION_STATUS.COMPLETED]: { bg: "#DBEAFE", fg: "#1e40af" },
  [RESERVATION_STATUS.REFUSED]: { bg: "#FEE2E2", fg: "#991b1b" },
  [RESERVATION_STATUS.CANCELLED]: { bg: "#F3F4F6", fg: "#4b5563" },
};

export default function HostReservations() {
  const { user } = useAuth();
  const { data, loading, reload } = useFetch(() => getHostReservations(user.uid), [user.uid]);
  const [tab, setTab] = useState("all");
  const [actingId, setActingId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const list = data || [];

  const filtered = useMemo(() => {
    if (tab === "all") return list;
    if (tab === "refused")
      return list.filter(
        (r) => r.status === RESERVATION_STATUS.REFUSED || r.status === RESERVATION_STATUS.CANCELLED
      );
    return list.filter((r) => r.status === tab);
  }, [list, tab]);

  function decide(r, accept) {
    Alert.alert(
      accept ? "Accepter la réservation" : "Refuser la réservation",
      `${r.numeroReservation || ""} — ${r.propertyTitle || "logement"}`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: accept ? "Accepter" : "Refuser",
          style: accept ? "default" : "destructive",
          onPress: async () => {
            setActingId(r.id);
            try {
              await decideReservationApi({ reservationId: r.id, accept });
              reload();
            } catch (e) {
              Alert.alert("Erreur", e?.message || "Action impossible.");
            } finally {
              setActingId(null);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onRefresh={reload}
        refreshing={loading}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Feather name="calendar" size={34} color={colors.muted} />
              <Text style={styles.emptyText}>Aucune réservation dans cette catégorie.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const badge = BADGE[item.status] || BADGE[RESERVATION_STATUS.SENT];
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.title} numberOfLines={1}>{item.propertyTitle || "Logement"}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.fg }]}>{item.status}</Text>
                </View>
              </View>
              {/* Aperçu profil voyageur (façon Airbnb) : confiance avant décision */}
              <View style={styles.guestRow}>
                <Feather name="user" size={12} color={colors.muted} />
                <Text style={styles.guestName} numberOfLines={1}>
                  {item.voyageurName || item.voyageurEmail || "Voyageur"}
                </Text>
                {item.voyageurVerified ? (
                  <View style={styles.verifBadge}>
                    <Feather name="check-circle" size={10} color={colors.success || "#16a34a"} />
                    <Text style={styles.verifText}>Vérifié</Text>
                  </View>
                ) : null}
              </View>
              {item.voyageurName && item.voyageurEmail ? (
                <Text style={styles.guestSub}>{item.voyageurEmail}</Text>
              ) : null}
              {(item.voyageurPhone || item.voyageurSince || typeof item.voyageurTripsCount === "number") ? (
                <Text style={styles.guestSub}>
                  {[
                    item.voyageurPhone,
                    item.voyageurSince ? `Membre depuis ${formatDate(item.voyageurSince)}` : null,
                    typeof item.voyageurTripsCount === "number" ? `${item.voyageurTripsCount} réservation(s)` : null,
                  ].filter(Boolean).join("  ·  ")}
                </Text>
              ) : null}
              <Text style={styles.muted}>
                {formatDate(item.dateArrivee)} → {formatDate(item.dateDepart)} · {item.nbreNuits} nuit(s)
              </Text>
              <View style={styles.amounts}>
                <Text style={styles.amountLabel}>Total voyageur : <Text style={styles.amountVal}>{formatPrice(item.total)}</Text></Text>
                <Text style={styles.amountLabel}>Pour vous : <Text style={styles.netVal}>{formatPrice(item.totalAgent != null ? item.totalAgent : item.total)}</Text></Text>
              </View>

              {item.status === RESERVATION_STATUS.SENT ? (
                <View style={styles.decideRow}>
                  <Pressable
                    style={[styles.refuseBtn, actingId === item.id && { opacity: 0.5 }]}
                    disabled={actingId === item.id}
                    onPress={() => decide(item, false)}
                  >
                    <Feather name="x" size={15} color={colors.danger} />
                    <Text style={styles.refuseText}>Refuser</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.acceptBtn, actingId === item.id && { opacity: 0.5 }]}
                    disabled={actingId === item.id}
                    onPress={() => decide(item, true)}
                  >
                    <Feather name="check" size={15} color={colors.white} />
                    <Text style={styles.acceptText}>Accepter</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  tabsWrap: { borderBottomWidth: 1, borderBottomColor: colors.border },
  tabs: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.secondary },
  tabText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.muted },
  tabTextActive: { color: colors.white },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.kapo, padding: 14, gap: 5 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.ink },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontFamily: fonts.bodySemiBold, fontSize: 11 },
  muted: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  guestRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  guestName: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  verifBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ECFDF3",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  verifText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5, color: "#16a34a" },
  guestSub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted },
  amounts: { marginTop: 4, gap: 2 },
  amountLabel: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  amountVal: { fontFamily: fonts.bodySemiBold, color: colors.ink },
  netVal: { fontFamily: fonts.bodyBold, color: colors.primary },
  decideRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  refuseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    height: 42,
  },
  refuseText: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.danger },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.success,
    borderRadius: 8,
    height: 42,
  },
  acceptText: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.white },
  empty: { alignItems: "center", gap: 10, marginTop: 60 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted },
});
