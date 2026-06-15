import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { imgSource } from "@/lib/config";
import { useDataSaver } from "@/context/DataSaverContext";
import { colors, fonts, radius } from "@/theme";

// Catégories de logements — liste horizontale (web : grille avec overlay).
export default function CategoryGrid({ categories = [] }) {
  const router = useRouter();
  const { dataSaver } = useDataSaver();
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
          <Image
            source={imgSource(item.image, 384, { dataSaver })}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
          <View style={styles.band}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
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
  image: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  band: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,43,94,0.78)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  name: {
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
  },
});
