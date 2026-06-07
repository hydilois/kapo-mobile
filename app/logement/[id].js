import { useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { getPropertyById } from "@/lib/data/properties";
import { getConforts, getTowns } from "@/lib/data/taxonomy";
import { getPropertyComments } from "@/lib/data/comments";
import { useFetch } from "@/hooks/useFetch";
import { formatDate } from "@/lib/utils";
import Gallery from "@/components/property/Gallery";
import BookingSection from "@/components/property/BookingSection";
import FavoriteButton from "@/components/property/FavoriteButton";
import ShareButton from "@/components/property/ShareButton";
import ReportButton from "@/components/property/ReportButton";
import { colors, fonts, radius } from "@/theme";

function Fact({ icon, label }) {
  return (
    <View style={styles.fact}>
      <Feather name={icon} size={15} color={colors.primary} />
      <Text style={styles.factText}>{label}</Text>
    </View>
  );
}

function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

// Détail logement — transposition de /logements/[id] (web).
export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data, loading, reload } = useFetch(async () => {
    const [property, conforts, towns, comments] = await Promise.all([
      getPropertyById(id),
      getConforts(),
      getTowns(),
      getPropertyComments(id),
    ]);
    return { property, conforts, towns, comments };
  }, [id]);

  // Recharge les avis au retour de l'écran « Laisser un avis »
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const { property, conforts = [], towns = [], comments = [] } = data || {};

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Logement" }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Logement" }} />
        <Text style={styles.empty}>Logement introuvable.</Text>
      </View>
    );
  }

  const town = towns.find((t) => t.id === property.townId);
  const amenities = conforts.filter((c) => (property.confortIds || []).includes(c.id));
  const avgRating = comments.length
    ? comments.reduce((s, c) => s + (Number(c.rating) || 0), 0) / comments.length
    : Number(property.rating) || 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Stack.Screen options={{ title: property.title }} />
      <View>
        <Gallery property={property} />
        <View style={styles.galleryActions}>
          <ShareButton property={property} />
          <FavoriteButton property={property} />
        </View>
      </View>

      <View style={styles.body}>
        {/* Titre + note */}
        <Text style={styles.title}>{property.title}</Text>
        <View style={styles.metaRow}>
          <Feather name="map-pin" size={13} color={colors.muted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {[property.address, town?.name].filter(Boolean).join(", ")}
          </Text>
          {avgRating > 0 ? (
            <View style={styles.rating}>
              <Feather name="star" size={13} color={colors.secondary} />
              <Text style={styles.ratingText}>{avgRating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {/* Faits clés */}
        <View style={styles.facts}>
          <Fact icon="users" label={`${property.travelers || 1} voyageur${(property.travelers || 1) > 1 ? "s" : ""}`} />
          <Fact icon="grid" label={`${property.rooms || 1} pièce${(property.rooms || 1) > 1 ? "s" : ""}`} />
          {property.beds ? <Fact icon="moon" label={`${property.beds} lit${property.beds > 1 ? "s" : ""}`} /> : null}
          {property.bathrooms ? <Fact icon="droplet" label={`${property.bathrooms} sdb`} /> : null}
          {property.surface ? <Fact icon="maximize" label={`${property.surface} m²`} /> : null}
        </View>

        {/* Description */}
        {property.description ? (
          <>
            <SectionTitle>Description</SectionTitle>
            <Text style={styles.description}>{property.description}</Text>
          </>
        ) : null}

        {/* Équipements */}
        {amenities.length ? (
          <>
            <SectionTitle>Équipements</SectionTitle>
            <View style={styles.amenities}>
              {amenities.map((a) => (
                <View key={a.id} style={styles.amenity}>
                  <View style={styles.amenityDot} />
                  <Text style={styles.amenityText}>{a.libelle}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Réservation */}
        <SectionTitle>Réserver ce logement</SectionTitle>
        <BookingSection property={property} />

        {/* Avis */}
        <SectionTitle>
          Avis{comments.length ? ` (${comments.length})` : ""}
        </SectionTitle>
        {comments.length ? (
          comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{c.writerName || "Utilisateur Kapo"}</Text>
                {c.rating > 0 ? (
                  <View style={styles.rating}>
                    <Feather name="star" size={12} color={colors.secondary} />
                    <Text style={styles.ratingText}>{c.rating}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.commentText}>{c.content}</Text>
              <Text style={styles.commentDate}>{formatDate(c.createdAt)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>Aucun avis pour le moment.</Text>
        )}
        <Pressable style={styles.reviewBtn} onPress={() => router.push(`/avis/${property.id}`)}>
          <Feather name="edit-3" size={14} color={colors.primary} />
          <Text style={styles.reviewBtnText}>Laisser un avis</Text>
        </Pressable>

        <ReportButton property={property} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  body: { padding: 16, gap: 8 },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.navy },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  rating: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  facts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.kapo,
    padding: 12,
  },
  fact: { flexDirection: "row", alignItems: "center", gap: 5 },
  factText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.ink },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.navy, marginTop: 16 },
  description: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink, lineHeight: 21 },
  amenities: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  amenityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondary },
  amenityText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ink },
  comment: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    padding: 12,
    gap: 4,
  },
  commentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  commentAuthor: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.ink },
  commentText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 19 },
  commentDate: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  galleryActions: {
    position: "absolute",
    top: 12,
    right: 14,
    flexDirection: "row",
    gap: 8,
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.kapo,
    height: 44,
    marginTop: 4,
  },
  reviewBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.primary },
});
