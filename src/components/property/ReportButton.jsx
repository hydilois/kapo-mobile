import { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { notifyAdminReport } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { REPORT_REASONS } from "@/lib/constants";
import Button from "@/components/ui/Button";
import { colors, fonts, radius } from "@/theme";

// Signalement d'une annonce — transposition du ReportButton web
// (POST /api/reports : enregistre le signalement + alerte l'admin).
export default function ReportButton({ property }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function openModal() {
    if (!user) {
      router.push({ pathname: "/connexion", params: { next: pathname } });
      return;
    }
    setOpen(true);
  }

  async function submit() {
    setError("");
    setLoading(true);
    try {
      await notifyAdminReport({
        propertyId: property.id,
        propertyTitle: property.title || "",
        reason,
        details: details.trim(),
      });
      setSent(true);
    } catch (err) {
      setError(err?.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Pressable style={styles.trigger} onPress={openModal}>
        <Feather name="flag" size={13} color={colors.muted} />
        <Text style={styles.triggerText}>Signaler cette annonce</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Signaler cette annonce</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Feather name="x" size={20} color={colors.muted} />
              </Pressable>
            </View>

            {sent ? (
              <View style={styles.sentBox}>
                <Feather name="check-circle" size={32} color={colors.success} />
                <Text style={styles.sentText}>
                  Merci, votre signalement a été transmis à notre équipe.
                </Text>
                <Button title="Fermer" variant="outline" onPress={() => setOpen(false)} />
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ gap: 10 }}>
                {REPORT_REASONS.map((r) => (
                  <Pressable key={r} style={styles.reason} onPress={() => setReason(r)}>
                    <Feather
                      name={reason === r ? "check-circle" : "circle"}
                      size={17}
                      color={reason === r ? colors.primary : colors.border}
                    />
                    <Text style={styles.reasonText}>{r}</Text>
                  </Pressable>
                ))}
                <TextInput
                  style={styles.textarea}
                  multiline
                  value={details}
                  onChangeText={setDetails}
                  placeholder="Précisions (optionnel)…"
                  placeholderTextColor={colors.muted}
                  textAlignVertical="top"
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button title="Envoyer le signalement" onPress={submit} loading={loading} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  triggerText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.muted,
    textDecorationLine: "underline",
  },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    maxHeight: "85%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.navy },
  reason: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  reasonText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink, flex: 1 },
  textarea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    padding: 12,
    minHeight: 80,
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.ink,
    marginTop: 6,
  },
  error: {
    backgroundColor: "#FEF2F2",
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 13,
    borderRadius: radius.kapo,
    padding: 12,
  },
  sentBox: { alignItems: "center", gap: 12, paddingVertical: 16 },
  sentText: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.ink,
    textAlign: "center",
    lineHeight: 20,
  },
});
