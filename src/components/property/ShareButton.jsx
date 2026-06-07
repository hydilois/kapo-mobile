import { Share, Pressable, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { API_BASE_URL } from "@/lib/config";
import { colors } from "@/theme";

// Bouton « Partager » : ouvre la feuille de partage NATIVE du téléphone
// (WhatsApp, SMS, e-mail, copie du lien… selon les apps installées) avec
// le lien web public de l'annonce.
export default function ShareButton({ property, size = 18, style }) {
  async function onPress() {
    const url = `${API_BASE_URL}/logements/${property.id}`;
    try {
      await Share.share(
        {
          message: `Découvrez « ${property.title} » sur Kapo : ${url}`,
          url, // utilisé par iOS
          title: property.title,
        },
        { dialogTitle: "Partager cette annonce" }
      );
    } catch {
      /* partage annulé : rien à faire */
    }
  }

  return (
    <Pressable style={[styles.btn, style]} onPress={onPress} hitSlop={8}>
      <Feather name="share" size={size} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
});
