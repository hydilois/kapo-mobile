import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { formatPrice } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";
import { colors, fonts, radius } from "@/theme";

const FALLBACK = require("../../../assets/brand/logo-icon.png");

// Carte logement — transposition de src/components/property/PropertyCard.jsx (web).
export default function PropertyCard({ property, width }) {
  const router = useRouter();
  const image = property.image || property.photos?.[0];

  return (
    <Pressable
      style={[styles.card, width ? { width } : null]}
      onPress={() => router.push(`/logement/${property.id}`)}
    >
      <View style={styles.imageWrap}>
        <Image
          source={image ? { uri: image } : FALLBACK}
          style={styles.image}
          contentFit={image ? "cover" : "contain"}
          transition={150}
        />
        {property.reduction > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{property.reduction}%</Text>
          </View>
        ) : null}
        <FavoriteButton property={property} size={17} style={styles.fav} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {property.title}
          </Text>
          {property.rating > 0 ? (
            <View style={styles.rating}>
              <Feather name="star" size={12} color={colors.secondary} />
              <Text style={styles.ratingText}>{Number(property.rating).toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {property.address ? (
          <View style={styles.row}>
            <Feather name="map-pin" size={12} color={colors.muted} />
            <Text style={styles.muted} numberOfLines={1}>
              {property.address}
            </Text>
          </View>
        ) : null}

        <Text style={styles.muted}>
          {property.rooms || 1} pièce{(property.rooms || 1) > 1 ? "s" : ""} ·{" "}
          {property.travelers || 1} voyageur{(property.travelers || 1) > 1 ? "s" : ""}
        </Text>

        <Text style={styles.price}>
          {formatPrice(property.price)} <Text style={styles.perNight}>/ nuit</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.kapo,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  imageWrap: { aspectRatio: 4 / 3, backgroundColor: colors.surface },
  image: { flex: 1 },
  badge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: colors.white, fontFamily: fonts.bodySemiBold, fontSize: 11 },
  fav: { position: "absolute", top: 8, right: 8 },
  body: { padding: 10, gap: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  rating: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  muted: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, flexShrink: 1 },
  price: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.primary, marginTop: 2 },
  perNight: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
});
