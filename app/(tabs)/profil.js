import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/layout/RequireAuth";
import Button from "@/components/ui/Button";
import { colors, fonts, radius } from "@/theme";

// Profil — version basique (complétée au jalon 6 : édition, avatar, mot de passe).
export default function ProfileScreen() {
  return (
    <RequireAuth message="Connectez-vous pour accéder à votre profil." next="/(tabs)/profil">
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { user, profile, logout } = useAuth();
  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    user?.displayName ||
    "Utilisateur Kapo";

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      <Button title="Se déconnecter" variant="outline" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 16, gap: 16 },
  card: {
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    padding: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FDEDF0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  avatarText: { fontFamily: fonts.heading, fontSize: 28, color: colors.primary },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.ink },
  email: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
