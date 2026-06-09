import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, Alert, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import {
  getHostProperties, setPublished, deleteProperty, duplicateProperty,
} from "@/lib/data/host";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { formatPrice } from "@/lib/utils";
import { colors, fonts, radius } from "@/theme";

const FALLBACK = require("../../assets/brand/logo-icon.png");

export default function HostListings() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, loading, reload } = useFetch(() => getHostProperties(user.uid), [user.uid]);
  const [actingId, setActingId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const list = data || [];

  async function togglePublish(p) {
    setActingId(p.id);
    try {
      await setPublished(p.id, !p.isPublished);
      reload();
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Action impossible.");
    } finally {
      setActingId(null);
    }
  }

  async function duplicate(p) {
    setActingId(p.id);
    try {
      const newId = await duplicateProperty(user.uid, p.id);
      router.push(`/hote/annonce/${newId}`);
    } catch (e) {
      Alert.alert("Erreur", e?.message || "Duplication impossible.");
    } finally {
      setActingId(null);
    }
  }

  function remove(p) {
    Alert.alert("Supprimer l'annonce", `Supprimer définitivement « ${p.title} » ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setActingId(p.id);
          try {
            await deleteProperty(p.id);
            reload();
          } catch (e) {
            Alert.alert("Erreur", e?.message || "Suppression impossible.");
          } finally {
            setActingId(null);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onRefresh={reload}
        refreshing={loading}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Feather name="home" size={34} color={colors.muted} />
              <Text style={styles.emptyText}>Aucune annonce. Créez votre première annonce.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable style={styles.cardTop} onPress={() => router.push(`/hote/annonce/${item.id}`)}>
              <Image
                source={item.image ? { uri: item.image } : FALLBACK}
                style={styles.image}
                contentFit={item.image ? "cover" : "contain"}
              />
              <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  <View style={[styles.badge, item.isPublished ? styles.badgePub : styles.badgeDraft]}>
                    <Text style={[styles.badgeText, { color: item.isPublished ? "#166534" : "#92400e" }]}>
                      {item.isPublished ? "Publiée" : "Brouillon"}
                    </Text>
                  </View>
                </View>
                {item.address ? <Text style={styles.muted} numberOfLines={1}>{item.address}</Text> : null}
                <Text style={styles.price}>{formatPrice(item.price)} <Text style={styles.muted}>/ nuit</Text></Text>
              </View>
            </Pressable>

            <View style={styles.actions}>
              <Action icon={item.isPublished ? "eye-off" : "eye"} label={item.isPublished ? "Dépublier" : "Publier"}
                onPress={() => togglePublish(item)} disabled={actingId === item.id} />
              <Action icon="edit-2" label="Modifier" onPress={() => router.push(`/hote/annonce/${item.id}`)} />
              <Action icon="copy" label="Dupliquer" onPress={() => duplicate(item)} disabled={actingId === item.id} />
              <Action icon="trash-2" label="Supprimer" danger onPress={() => remove(item)} disabled={actingId === item.id} />
            </View>
          </View>
        )}
      />

      <Pressable style={styles.fab} onPress={() => router.push("/hote/annonce/nouvelle")}>
        <Feather name="plus" size={20} color={colors.white} />
        <Text style={styles.fabText}>Nouvelle annonce</Text>
      </Pressable>
    </View>
  );
}

function Action({ icon, label, onPress, danger, disabled }) {
  return (
    <Pressable style={[styles.action, disabled && { opacity: 0.4 }]} onPress={onPress} disabled={disabled}>
      <Feather name={icon} size={15} color={danger ? colors.danger : colors.navy} />
      <Text style={[styles.actionText, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.kapo, overflow: "hidden" },
  cardTop: { flexDirection: "row", gap: 10, padding: 10 },
  image: { width: 92, height: 82, borderRadius: 8, backgroundColor: colors.surface },
  cardBody: { flex: 1, gap: 3, justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgePub: { backgroundColor: "#DCFCE7" },
  badgeDraft: { backgroundColor: "#FEF3C7" },
  badgeText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5 },
  muted: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  price: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.primary },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  action: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
  },
  actionText: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.navy },
  empty: { alignItems: "center", gap: 10, marginTop: 60, paddingHorizontal: 24 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, textAlign: "center" },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingHorizontal: 18,
    height: 50,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  fabText: { color: colors.white, fontFamily: fonts.bodySemiBold, fontSize: 14 },
});
