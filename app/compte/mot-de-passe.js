import { useState } from "react";
import { Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { changePassword } from "@/lib/data/profile";
import RequireAuth from "@/components/layout/RequireAuth";
import { PasswordField } from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { colors, fonts, radius } from "@/theme";

export default function ChangePasswordScreen() {
  return (
    <RequireAuth message="Connectez-vous pour changer votre mot de passe." next="/compte/mot-de-passe">
      <ChangePasswordContent />
    </RequireAuth>
  );
}

function ChangePasswordContent() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (next.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (next !== confirm) {
      setError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await changePassword(current, next);
      setDone(true);
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      setError(err?.message || "Le changement de mot de passe a échoué.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: "Mot de passe" }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {done ? (
          <Text style={styles.success}>Mot de passe modifié avec succès ✓</Text>
        ) : (
          <>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PasswordField label="Mot de passe actuel" value={current} onChangeText={setCurrent} />
            <PasswordField
              label="Nouveau mot de passe"
              value={next}
              onChangeText={setNext}
              placeholder="6 caractères minimum"
            />
            <PasswordField
              label="Confirmer le nouveau mot de passe"
              value={confirm}
              onChangeText={setConfirm}
            />
            <Button title="Changer le mot de passe" onPress={submit} loading={loading} style={{ marginTop: 8 }} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  error: {
    backgroundColor: "#FEF2F2",
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 13,
    borderRadius: radius.kapo,
    padding: 12,
  },
  success: {
    backgroundColor: "#F0FDF4",
    color: colors.success,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    borderRadius: radius.kapo,
    padding: 14,
    textAlign: "center",
  },
});
