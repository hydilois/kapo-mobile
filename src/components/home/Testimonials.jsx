import { View, Text, FlatList, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { colors, fonts, radius } from "@/theme";

// Témoignages — cartes horizontales (web : grille 3 colonnes).
export default function Testimonials({ testimonials = [] }) {
  if (!testimonials.length) return null;

  return (
    <FlatList
      horizontal
      data={testimonials}
      keyExtractor={(t) => t.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Feather name="message-circle" size={18} color={colors.primary} />
          <Text style={styles.content} numberOfLines={5}>
            {item.content}
          </Text>
          <Text style={styles.author}>— {item.author}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, gap: 10 },
  card: {
    width: 260,
    backgroundColor: colors.white,
    borderRadius: radius.kapo,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  content: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 19 },
  author: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.navy },
});
