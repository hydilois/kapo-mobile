import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { getPropertyById } from "@/lib/data/properties";
import { useFetch } from "@/hooks/useFetch";
import { colors, fonts } from "@/theme";

// Détail logement — version minimale (complétée au jalon 2).
export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: property, loading } = useFetch(() => getPropertyById(id), [id]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: property?.title || "Logement" }} />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : !property ? (
        <Text style={styles.empty}>Logement introuvable.</Text>
      ) : (
        <Text style={styles.title}>{property.title}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.navy },
  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 40 },
});
