import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import Button from "@/components/ui/Button";
import { colors, fonts } from "@/theme";

// Écran de résultat de paiement (succès / échec) — natif, hors WebView.
export default function PaymentResult({ success, title, message, onRetry }) {
  const router = useRouter();

  return (
    <View style={styles.center}>
      <View style={[styles.iconWrap, { backgroundColor: success ? "#F0FDF4" : "#FEF2F2" }]}>
        <Feather
          name={success ? "check-circle" : "x-circle"}
          size={44}
          color={success ? colors.success : colors.danger}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      <View style={styles.actions}>
        {success ? (
          <>
            <Button
              title="Voir mes réservations"
              onPress={() => router.replace("/(tabs)/reservations")}
            />
            <Button
              title="Continuer à explorer"
              variant="outline"
              onPress={() => router.replace("/(tabs)")}
            />
          </>
        ) : (
          <>
            {onRetry ? <Button title="Réessayer" onPress={onRetry} /> : null}
            <Button
              title="Retour à l'accueil"
              variant="outline"
              onPress={() => router.replace("/(tabs)")}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
    backgroundColor: colors.background,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  title: { fontFamily: fonts.heading, fontSize: 20, color: colors.navy, textAlign: "center" },
  message: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  actions: { alignSelf: "stretch", gap: 10, marginTop: 18 },
});
