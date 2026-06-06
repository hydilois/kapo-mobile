import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { colors, fonts, radius } from "@/theme";

// Catégories de logements — liste horizontale (web : grille avec overlay).
export default function CategoryGrid({ categories = [] }) {
  const router = useRouter();
  if (!categories.length) return null;

  return (
    <FlatList
      horizontal
      data={categories}
      keyExtractor={(c) => c.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() =>
            router.push({ pathname: "/(tabs)/recherche", params: { category: item.id } })
          }
        >
          <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" transition={150} />
          <View style={styles.overlay} />
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, gap: 10 },
  card: {
    width: 110,
    height: 110,
    borderRadius: radius.kapo,
    overflow: "hidden",
    backgroundColor: colors.navy,
  },
  image: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,43,94,0.35)" },
  name: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
  },
});
