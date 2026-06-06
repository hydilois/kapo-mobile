import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useAuth } from "@/context/AuthContext";
import { authErrorMessage } from "@/lib/authErrors";
import { TextField, PasswordField } from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { colors, fonts, radius } from "@/theme";

const LOGO = require("../../assets/brand/logo.png");

export default function LoginScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setError("Renseignez votre e-mail et votre mot de passe.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      if (next) router.replace(decodeURIComponent(String(next)));
      else if (router.canGoBack()) router.back();
      else router.replace("/(tabs)");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Connexion" }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={LOGO} style={styles.logo} contentFit="contain" />
        <Text style={styles.title}>Bon retour sur Kapo !</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextField
          label="Adresse e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="vous@exemple.com"
        />
        <PasswordField
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
        />

        <Pressable onPress={() => router.push("/mot-de-passe-oublie")}>
          <Text style={styles.link}>Mot de passe oublié ?</Text>
        </Pressable>

        <Button title="Se connecter" onPress={submit} loading={loading} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <Pressable
            onPress={() => router.replace({ pathname: "/inscription", params: next ? { next } : {} })}
          >
            <Text style={styles.link}>S'inscrire</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, paddingBottom: 40 },
  logo: { width: 120, height: 32, alignSelf: "center", marginTop: 12 },
  title: {
    fontFamily: fonts.heading,
    fontSize: 19,
    color: colors.navy,
    textAlign: "center",
    marginBottom: 6,
  },
  error: {
    backgroundColor: "#FEF2F2",
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 13,
    borderRadius: radius.kapo,
    padding: 12,
  },
  link: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary },
  footer: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 },
  footerText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
