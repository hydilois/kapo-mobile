import { useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { getHostProperties } from "@/lib/data/host";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { colors, fonts, radius } from "@/theme";

export default function HostDashboard() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { data, loading, reload } = useFetch(() => getHostProperties(user.uid), [user.uid]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const properties = data || [];
  const published = properties.filter((p) => p.isPublished).length;
  const stats = [
    { label: "Annonces", value: properties.length, icon: "home" },
    { label: "Publiées", value: published, icon: "eye" },
    { label: "Brouillons", value: properties.length - published, icon: "edit-3" },
  ];

  const name = profile?.firstName || "hôte";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={styles.hello}>Bonjour {name} 👋</Text>

      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Feather name={s.icon} size={18} color={colors.secondary} />
            <Text style={styles.statValue}>{loading ? "…" : s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.primaryBtn} onPress={() => router.push("/hote/annonce/nouvelle")}>
        <Feather name="plus" size={18} color={colors.white} />
        <Text style={styles.primaryBtnText}>Nouvelle annonce</Text>
      </Pressable>

      <View style={{ gap: 10 }}>
        <Shortcut icon="home" label="Mes annonces" onPress={() => router.push("/hote/annonces")} />
        <Shortcut icon="calendar" label="Réservations reçues" onPress={() => router.push("/hote/reservations")} />
        <Shortcut icon="dollar-sign" label="Mes versements" onPress={() => router.push("/hote/versements")} />
      </View>
    </ScrollView>
  );
}

function Shortcut({ icon, label, onPress }) {
  return (
    <Pressable style={styles.shortcut} onPress={onPress}>
      <Feather name={icon} size={17} color={colors.navy} />
      <Text style={styles.shortcutLabel}>{label}</Text>
      <Feather name="chevron-right" size={17} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hello: { fontFamily: fonts.heading, fontSize: 20, color: colors.navy },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    paddingVertical: 16,
  },
  statValue: { fontFamily: fonts.heading, fontSize: 22, color: colors.navy },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.secondary,
    borderRadius: radius.kapo,
    height: 50,
  },
  primaryBtnText: { color: colors.white, fontFamily: fonts.bodySemiBold, fontSize: 15 },
  shortcut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    padding: 16,
  },
  shortcutLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
});
