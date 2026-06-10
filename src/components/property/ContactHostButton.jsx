import { Pressable, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useAuth } from "@/context/AuthContext";
import { conversationIdFor } from "@/lib/data/messages";
import { colors, fonts, radius } from "@/theme";

// Bouton « Contacter l'hôte » : ouvre (ou démarre) le fil avec l'hôte du
// logement. Masqué pour l'hôte propriétaire lui-même.
export default function ContactHostButton({ property }) {
  const router = useRouter();
  const { user } = useAuth();

  if (!property?.agentId) return null;
  if (user && user.uid === property.agentId) return null;

  function open() {
    if (!user) {
      router.push(`/connexion?next=/logement/${property.id}`);
      return;
    }
    const convId = conversationIdFor(property.id, user.uid);
    router.push({
      pathname: `/messages/${convId}`,
      params: { propertyId: property.id, title: property.title || "" },
    });
  }

  return (
    <Pressable style={styles.btn} onPress={open}>
      <Feather name="message-circle" size={16} color={colors.primary} />
      <Text style={styles.text}>Contacter l&apos;hôte</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.kapo,
    paddingVertical: 12,
    marginTop: 10,
  },
  text: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
});
