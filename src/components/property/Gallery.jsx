import { useState } from "react";
import { View, Text, FlatList, useWindowDimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { colors, fonts } from "@/theme";

const FALLBACK = require("../../../assets/brand/logo-icon.png");

// Galerie d'images — pagination horizontale + compteur "i / n".
export default function Gallery({ property }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const photos = [property.image, ...(property.photos || [])].filter(Boolean);
  const sources = photos.length ? photos : [null];

  return (
    <View>
      <FlatList
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={sources}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <Image
            source={item ? { uri: item } : FALLBACK}
            style={{ width, height: 280, backgroundColor: colors.surface }}
            contentFit={item ? "cover" : "contain"}
            transition={150}
          />
        )}
      />
      {sources.length > 1 ? (
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {index + 1} / {sources.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    position: "absolute",
    bottom: 10,
    right: 12,
    backgroundColor: "rgba(34,34,34,0.7)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: { color: colors.white, fontFamily: fonts.bodyMedium, fontSize: 12 },
});
