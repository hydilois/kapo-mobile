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
import Feather from "@expo/vector-icons/Feather";
import { useAuth } from "@/context/AuthContext";
import { authErrorMessage } from "@/lib/authErrors";
import { sendVerificationEmail } from "@/lib/api";
import { TextField, PasswordField } from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { colors, fonts, radius } from "@/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError("Renseignez tous les champs obligatoires.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      // E-mail de vérification (best-effort, comme sur le web)
      sendVerificationEmail().catch(() => {});
      setDone(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <View style={styles.success}>
        <Stack.Screen options={{ title: "Inscription" }} />
        <Feather name="mail" size={42} color={colors.primary} />
        <Text style={styles.successTitle}>Vérifiez votre e-mail</Text>
        <Text style={styles.successText}>
          Votre compte est créé ! Un lien de vérification a été envoyé à {email.trim()}.
        </Text>
        <Button
          title="Continuer"
          onPress={() => {
            if (next) router.replace(decodeURIComponent(String(next)));
            else router.replace("/(tabs)");
          }}
          style={{ alignSelf: "stretch" }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Inscription" }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Créer un compte Kapo</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.row}>
          <TextField
            label="Prénom"
            value={firstName}
            onChangeText={setFirstName}
            style={{ flex: 1 }}
            placeholder="Prénom"
          />
          <TextField
            label="Nom"
            value={lastName}
            onChangeText={setLastName}
            style={{ flex: 1 }}
            placeholder="Nom"
          />
        </View>
        <TextField
          label="Adresse e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="vous@exemple.com"
        />
        <TextField
          label="Téléphone (optionnel)"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholder="+237 6XX XX XX XX"
        />
        <PasswordField
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="6 caractères minimum"
        />

        <Button title="S'inscrire" onPress={submit} loading={loading} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ?</Text>
          <Pressable
            onPress={() => router.replace({ pathname: "/connexion", params: next ? { next } : {} })}
          >
            <Text style={styles.link}>Se connecter</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, paddingBottom: 40 },
  title: {
    fontFamily: fonts.heading,
    fontSize: 19,
    color: colors.navy,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 6,
  },
  row: { flexDirection: "row", gap: 10 },
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
  success: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: colors.background,
  },
  successTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.navy },
  successText: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
});
