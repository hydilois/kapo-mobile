import { useCallback } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { getUserFavorites, toggleFavorite } from "@/lib/data/favorites";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { formatPrice } from "@/lib/utils";
import RequireAuth from "@/components/layout/RequireAuth";
import { colors, fonts, radius } from "@/theme";

const FALLBACK = require("../../assets/brand/logo-icon.png");

export default function FavoritesScreen() {
  return (
    <RequireAuth message="Connectez-vous pour voir vos favoris." next="/(tabs)/favoris">
      <FavoritesContent />
    </RequireAuth>
  );
}

function FavoritesContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, loading, reload } = useFetch(() => getUserFavorites(user.uid), [user.uid]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function remove(fav) {
    await toggleFavorite(user.uid, { id: fav.propertyId }).catch(() => {});
    reload();
  }

  const list = data || [];

  return (
    <FlatList
      style={styles.screen}
      data={list}
      keyExtractor={(f) => f.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      onRefresh={reload}
      refreshing={loading}
      ListEmptyComponent={
        !loading ? (
          <View style={styles.empty}>
            <Feather name="heart" size={34} color={colors.muted} />
            <Text style={styles.emptyText}>
              Aucun favori : touchez le cœur d'un logement pour le retrouver ici.
            </Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/logement/${item.propertyId}`)}>
          <Image
            source={item.propertyImage ? { uri: item.propertyImage } : FALLBACK}
            style={styles.image}
            contentFit={item.propertyImage ? "cover" : "contain"}
          />
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={1}>
              {item.propertyTitle || "Logement"}
            </Text>
            {item.propertyAddress ? (
              <Text style={styles.muted} numberOfLines={1}>
                {item.propertyAddress}
              </Text>
            ) : null}
            <Text style={styles.price}>
              {formatPrice(item.propertyPrice)} <Text style={styles.muted}>/ nuit</Text>
            </Text>
          </View>
          <Pressable style={styles.heart} onPress={() => remove(item)} hitSlop={8}>
            <Feather name="heart" size={18} color={colors.primary} />
          </Pressable>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    overflow: "hidden",
  },
  image: { width: 96, height: 86, backgroundColor: colors.surface },
  body: { flex: 1, padding: 10, gap: 2 },
  title: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  price: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.primary },
  heart: { padding: 14 },
  empty: { alignItems: "center", gap: 10, marginTop: 60, paddingHorizontal: 24 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, textAlign: "center" },
});
