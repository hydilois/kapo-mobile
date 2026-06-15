import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useAuth } from "@/context/AuthContext";
import { sendPhoneCodeApi, verifyPhoneCodeApi } from "@/lib/api";
import { normalizeCameroonPhone } from "@/lib/utils";
import { colors, fonts, radius } from "@/theme";

// Vérification du numéro par OTP SMS (façon Airbnb) — affichée dans le profil.
export default function PhoneVerification() {
  const { profile, refreshProfile } = useAuth();
  const [phone, setPhone] = useState(profile?.phoneNumber || "");
  const [step, setStep] = useState("idle"); // idle | code
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  if (profile?.phoneVerified) {
    return (
      <View style={styles.verified}>
        <Feather name="check-circle" size={15} color="#16a34a" />
        <Text style={styles.verifiedText}>Numéro vérifié : {profile.phoneNumber}</Text>
      </View>
    );
  }

  async function sendCode() {
    const e164 = normalizeCameroonPhone(phone);
    if (!e164) { setError("Numéro invalide (ex : +237 6XX XX XX XX)."); return; }
    setBusy(true); setError(""); setMsg("");
    try {
      const r = await sendPhoneCodeApi({ phoneNumber: e164 });
      setStep("code");
      setMsg(r.simulated ? "Code envoyé (simulation : voir logs)." : `Code envoyé par SMS au ${r.phone}.`);
    } catch (e) { setError(e?.message || "Échec de l'envoi."); } finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true); setError(""); setMsg("");
    try {
      await verifyPhoneCodeApi({ code });
      await refreshProfile();
      setMsg("Numéro vérifié ✅");
    } catch (e) { setError(e?.message || "Code incorrect."); } finally { setBusy(false); }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        <Feather name="phone" size={13} color={colors.secondaryDark} />  Vérifiez votre numéro (SMS de réservation)
      </Text>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {msg ? <Text style={styles.ok}>{msg}</Text> : null}

      {step === "idle" ? (
        <>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+237 6XX XX XX XX"
            placeholderTextColor={colors.muted}
          />
          <Pressable style={[styles.btn, busy && { opacity: 0.5 }]} onPress={sendCode} disabled={busy}>
            <Text style={styles.btnText}>{busy ? "Envoi…" : "Envoyer le code"}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <TextInput
            style={[styles.input, { letterSpacing: 6, textAlign: "center" }]}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            placeholder="Code à 6 chiffres"
            placeholderTextColor={colors.muted}
          />
          <Pressable style={[styles.btn, (busy || code.length !== 6) && { opacity: 0.5 }]} onPress={verify} disabled={busy || code.length !== 6}>
            <Text style={styles.btnText}>{busy ? "Vérification…" : "Vérifier"}</Text>
          </Pressable>
          <Pressable onPress={() => { setStep("idle"); setCode(""); }}>
            <Text style={styles.change}>Changer de numéro</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: "#FCE3C4", backgroundColor: "#FFF8EF", borderRadius: radius.kapo, padding: 14, gap: 8 },
  title: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.secondaryDark },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.kapo,
    paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.body, fontSize: 14,
    color: colors.ink, backgroundColor: colors.white,
  },
  btn: { backgroundColor: colors.primary, borderRadius: radius.kapo, paddingVertical: 11, alignItems: "center" },
  btnText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.white },
  change: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, textAlign: "center" },
  verified: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ECFDF3", borderRadius: radius.kapo, padding: 12 },
  verifiedText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: "#16a34a" },
  err: { fontFamily: fonts.body, fontSize: 12.5, color: colors.danger },
  ok: { fontFamily: fonts.body, fontSize: 12.5, color: "#16a34a" },
});
