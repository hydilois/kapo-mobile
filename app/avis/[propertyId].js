import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { createReviewApi } from "@/lib/api";
import RequireAuth from "@/components/layout/RequireAuth";
import Button from "@/components/ui/Button";
import { colors, fonts, radius } from "@/theme";

export default function AddReviewScreen() {
  const { propertyId } = useLocalSearchParams();
  return (
    <RequireAuth message="Connectez-vous pour laisser un avis." next={`/avis/${propertyId}`}>
      <AddReviewContent />
    </RequireAuth>
  );
}

function AddReviewContent() {
  const router = useRouter();
  const { propertyId } = useLocalSearchParams();

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!content.trim()) {
      setError("Votre avis ne peut pas être vide.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Avis vérifié : le serveur exige une réservation « Terminée » et
      // renvoie un message clair (403) si ce n'est pas le cas.
      await createReviewApi({ propertyId, content, rating });
      router.back();
    } catch (err) {
      setError(err?.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: "Laisser un avis" }} />

      <Text style={styles.label}>Votre note</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
            <Feather
              name="star"
              size={30}
              color={n <= rating ? colors.secondary : colors.border}
            />
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Votre avis</Text>
      <TextInput
        style={styles.textarea}
        multiline
        numberOfLines={6}
        maxLength={2000}
        value={content}
        onChangeText={setContent}
        placeholder="Partagez votre expérience dans ce logement…"
        placeholderTextColor={colors.muted}
        textAlignVertical="top"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Publier mon avis" onPress={submit} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  stars: { flexDirection: "row", gap: 10, marginBottom: 8 },
  textarea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    padding: 12,
    minHeight: 130,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  error: {
    backgroundColor: "#FEF2F2",
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 13,
    borderRadius: radius.kapo,
    padding: 12,
  },
});
