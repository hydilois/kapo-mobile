import { useState } from "react";
import { Text, ScrollView, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { authErrorMessage } from "@/lib/authErrors";
import { TextField } from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { colors, fonts, radius } from "@/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim()) {
      setError("Renseignez votre adresse e-mail.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      // Message neutre pour ne pas révéler l'existence d'un compte
      if (err?.code === "auth/user-not-found") setSent(true);
      else setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: "Mot de passe oublié" }} />
      <Text style={styles.title}>Réinitialiser votre mot de passe</Text>

      {sent ? (
        <Text style={styles.info}>
          Si un compte existe pour {email.trim()}, un e-mail de réinitialisation vient de lui être
          envoyé. Pensez à vérifier vos spams.
        </Text>
      ) : (
        <>
          <Text style={styles.text}>
            Saisissez votre adresse e-mail : nous vous enverrons un lien pour choisir un nouveau
            mot de passe.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextField
            label="Adresse e-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="vous@exemple.com"
          />
          <Button title="Envoyer le lien" onPress={submit} loading={loading} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  title: {
    fontFamily: fonts.heading,
    fontSize: 19,
    color: colors.navy,
    textAlign: "center",
    marginTop: 8,
  },
  text: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, lineHeight: 20 },
  info: {
    backgroundColor: "#F0FDF4",
    color: colors.success,
    fontFamily: fonts.body,
    fontSize: 13.5,
    borderRadius: radius.kapo,
    padding: 14,
    lineHeight: 20,
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
