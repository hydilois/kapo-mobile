import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { colors, fonts, radius } from "@/theme";

// Villes du Cameroun — liste horizontale (web : grille image + nom en overlay).
export default function TownGrid({ towns = [] }) {
  const router = useRouter();
  if (!towns.length) return null;

  return (
    <FlatList
      horizontal
      data={towns}
      keyExtractor={(t) => t.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push({ pathname: "/(tabs)/recherche", params: { town: item.id } })}
        >
          <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" transition={150} />
          <View style={styles.overlay} />
          <Text style={styles.name} numberOfLines={1}>
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
    width: 150,
    height: 100,
    borderRadius: radius.kapo,
    overflow: "hidden",
    backgroundColor: colors.navy,
  },
  image: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,43,94,0.35)" },
  name: {
    position: "absolute",
    bottom: 8,
    left: 10,
    right: 10,
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
});
