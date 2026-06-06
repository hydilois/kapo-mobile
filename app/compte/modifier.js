import { useState } from "react";
import { Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { updateUserProfile } from "@/lib/data/profile";
import { useAuth } from "@/context/AuthContext";
import { USER_TYPES } from "@/lib/constants";
import RequireAuth from "@/components/layout/RequireAuth";
import { TextField } from "@/components/ui/TextField";
import SelectField from "@/components/ui/SelectField";
import Button from "@/components/ui/Button";
import { colors, fonts, radius } from "@/theme";

export default function EditProfileScreen() {
  return (
    <RequireAuth message="Connectez-vous pour modifier votre profil." next="/compte/modifier">
      <EditProfileContent />
    </RequireAuth>
  );
}

function EditProfileContent() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || "");
  const [ville, setVille] = useState(profile?.ville || "");
  const [typeCompte, setTypeCompte] = useState(profile?.typeCompte || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Le prénom et le nom sont obligatoires.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        ville: ville.trim(),
        ...(typeCompte ? { typeCompte } : {}),
      });
      await refreshProfile();
      router.back();
    } catch (err) {
      setError(err?.message || "La mise à jour a échoué. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: "Mes informations" }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextField label="Prénom" value={firstName} onChangeText={setFirstName} />
        <TextField label="Nom" value={lastName} onChangeText={setLastName} />
        <TextField label="Adresse e-mail" value={user?.email || ""} editable={false} style={{ opacity: 0.6 }} />
        <TextField
          label="Téléphone"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholder="+237 6XX XX XX XX"
        />
        <TextField label="Ville" value={ville} onChangeText={setVille} placeholder="Douala, Yaoundé…" />
        <SelectField
          placeholder="Type de compte"
          icon="briefcase"
          value={typeCompte}
          onChange={setTypeCompte}
          options={USER_TYPES.map((t) => ({ value: t, label: t }))}
        />

        <Button title="Enregistrer" onPress={submit} loading={loading} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, paddingBottom: 40 },
  error: {
    backgroundColor: "#FEF2F2",
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 13,
    borderRadius: radius.kapo,
    padding: 12,
  },
});
