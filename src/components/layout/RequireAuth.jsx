import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import { colors, fonts } from "@/theme";

// Garde d'authentification des écrans privés (favoris, réservations,
// notifications, compte). Équivalent mobile des invites de connexion du web.
export default function RequireAuth({ children, message = "Connectez-vous pour accéder à cette page.", next }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Feather name="lock" size={36} color={colors.primary} />
        <Text style={styles.message}>{message}</Text>
        <Button
          title="Se connecter"
          onPress={() => router.push({ pathname: "/connexion", params: next ? { next } : {} })}
          style={{ alignSelf: "stretch", marginHorizontal: 24 }}
        />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: colors.background,
    padding: 24,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
