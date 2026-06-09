import { useCallback, useState } from "react";
import {
  View, Text, ScrollView, FlatList, Pressable, Modal, TextInput, Alert, StyleSheet,
} from "react-native";
import { useFocusEffect } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import {
  getHostPayouts, getPaymentMethods, addPaymentMethod, deletePaymentMethod, setDefaultMethod,
} from "@/lib/data/payments";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { formatPrice, formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_TYPES, PAYOUT_STATUS } from "@/lib/constants";
import SelectField from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { colors, fonts, radius } from "@/theme";

const PAYOUT_BADGE = {
  [PAYOUT_STATUS.UPCOMING]: { bg: "#DBEAFE", fg: "#1e40af" },
  [PAYOUT_STATUS.DUE]: { bg: "#FEF3C7", fg: "#92400e" },
  [PAYOUT_STATUS.PAID]: { bg: "#DCFCE7", fg: "#166534" },
  [PAYOUT_STATUS.FAILED]: { bg: "#FEE2E2", fg: "#991b1b" },
  [PAYOUT_STATUS.CANCELLED]: { bg: "#F3F4F6", fg: "#4b5563" },
};

export default function HostPayouts() {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);

  const { data, loading, reload } = useFetch(async () => {
    const [methods, payouts] = await Promise.all([
      getPaymentMethods(user.uid),
      getHostPayouts(user.uid),
    ]);
    return { methods, payouts };
  }, [user.uid]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const methods = data?.methods || [];
  const payouts = data?.payouts || [];
  const paid = payouts.filter((p) => p.status === PAYOUT_STATUS.PAID);
  const pending = payouts.filter(
    (p) => p.status === PAYOUT_STATUS.UPCOMING || p.status === PAYOUT_STATUS.DUE
  );
  const totalPaid = paid.reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = pending.reduce((s, p) => s + (p.amount || 0), 0);

  async function makeDefault(m) {
    await setDefaultMethod(user.uid, m.id).catch(() => {});
    reload();
  }

  function removeMethod(m) {
    Alert.alert("Supprimer", "Supprimer ce moyen de réception ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await deletePaymentMethod(m.id).catch(() => {});
          reload();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* Récap */}
      {!loading && payouts.length > 0 && (
        <View style={styles.recap}>
          <View style={styles.recapCard}>
            <Text style={styles.recapLabel}>À venir / à verser</Text>
            <Text style={styles.recapValue}>{formatPrice(totalPending)}</Text>
          </View>
          <View style={styles.recapCard}>
            <Text style={styles.recapLabel}>Déjà versé</Text>
            <Text style={[styles.recapValue, { color: colors.primary }]}>{formatPrice(totalPaid)}</Text>
          </View>
        </View>
      )}

      <Text style={styles.note}>
        Vos versements sont libérés 24 h après l'arrivée du voyageur, sur votre moyen de réception
        par défaut. Montants nets (commission Kapo déduite).
      </Text>

      {/* Moyens de réception */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Moyens de réception</Text>
        <Pressable style={styles.addBtn} onPress={() => setAdding(true)}>
          <Feather name="plus" size={14} color={colors.white} />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </Pressable>
      </View>

      {methods.length === 0 ? (
        <Text style={styles.empty}>Aucun moyen de réception. Ajoutez un compte MoMo ou bancaire.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {methods.map((m) => (
            <View key={m.id} style={styles.methodCard}>
              <Feather
                name={m.accountType === "Compte MoMo" ? "smartphone" : "credit-card"}
                size={18}
                color={colors.secondary}
              />
              <View style={{ flex: 1 }}>
                <View style={styles.methodTop}>
                  <Text style={styles.methodType}>{m.accountType}</Text>
                  {m.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Feather name="star" size={10} color={colors.secondary} />
                      <Text style={styles.defaultText}>Par défaut</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.methodName}>{m.fullName}</Text>
                <Text style={styles.muted}>{m.iban || m.phoneNumber}</Text>
                <View style={styles.methodActions}>
                  {!m.isDefault ? (
                    <Pressable onPress={() => makeDefault(m)}>
                      <Text style={styles.linkPrimary}>Définir par défaut</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => removeMethod(m)}>
                    <Text style={styles.linkDanger}>Supprimer</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Versements */}
      <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Mes versements</Text>
      {loading ? (
        <Text style={styles.empty}>Chargement…</Text>
      ) : payouts.length === 0 ? (
        <Text style={styles.empty}>
          Aucun versement pour le moment. Ils apparaîtront dès qu'un voyageur aura payé.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {payouts.map((p) => {
            const badge = PAYOUT_BADGE[p.status] || PAYOUT_BADGE[PAYOUT_STATUS.UPCOMING];
            return (
              <View key={p.id} style={styles.payoutCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payoutTitle} numberOfLines={1}>{p.propertyTitle || "Logement"}</Text>
                  <Text style={styles.muted}>
                    {p.numeroReservation || "—"} ·{" "}
                    {p.status === PAYOUT_STATUS.PAID
                      ? (p.paidAt ? `versé le ${formatDate(p.paidAt)}` : "versé")
                      : (p.scheduledAt ? `prévu le ${formatDate(p.scheduledAt)}` : "—")}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={styles.payoutAmount}>{formatPrice(p.amount)}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.fg }]}>{p.status}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <AddMethodModal
        visible={adding}
        onClose={() => setAdding(false)}
        onSubmit={async (form) => {
          try {
            await addPaymentMethod(user.uid, form, methods.length === 0);
            setAdding(false);
            reload();
          } catch (e) {
            Alert.alert("Erreur", e?.message || "Ajout impossible.");
          }
        }}
      />
    </ScrollView>
  );
}

function AddMethodModal({ visible, onClose, onSubmit }) {
  const [accountType, setAccountType] = useState(PAYMENT_METHOD_TYPES[0]);
  const [fullName, setFullName] = useState("");
  const [iban, setIban] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const isBank = accountType === "Compte Bancaire";

  function submit() {
    if (!fullName.trim()) return Alert.alert("Titulaire requis");
    onSubmit({
      fullName: fullName.trim(),
      accountType,
      iban: isBank ? iban.trim() : "",
      phoneNumber: isBank ? "" : phoneNumber.trim(),
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Nouveau moyen de réception</Text>
            <Pressable onPress={onClose} hitSlop={8}><Feather name="x" size={20} color={colors.muted} /></Pressable>
          </View>
          <View style={{ gap: 12 }}>
            <SelectField
              placeholder="Type de compte"
              value={accountType}
              onChange={setAccountType}
              options={PAYMENT_METHOD_TYPES.map((t) => ({ value: t, label: t }))}
            />
            <TextField label="Titulaire du compte" value={fullName} onChangeText={setFullName} placeholder="Nom complet" />
            {isBank ? (
              <TextField label="IBAN / RIB" value={iban} onChangeText={setIban} placeholder="CMxx…" autoCapitalize="characters" />
            ) : (
              <TextField label="Numéro Mobile Money" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholder="6XXXXXXXX" />
            )}
            <Button title="Enregistrer" variant="host" onPress={submit} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  recap: { flexDirection: "row", gap: 10, marginBottom: 12 },
  recapCard: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.kapo, padding: 14 },
  recapLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  recapValue: { fontFamily: fonts.heading, fontSize: 18, color: colors.navy, marginTop: 4 },
  note: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, lineHeight: 18, marginBottom: 18 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.navy },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: colors.secondary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  addBtnText: { color: colors.white, fontFamily: fonts.bodySemiBold, fontSize: 12.5 },
  methodCard: {
    flexDirection: "row", gap: 12,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.kapo, padding: 14,
  },
  methodTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  methodType: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  defaultBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FFF3E0", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  defaultText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5, color: colors.secondary },
  methodName: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, marginTop: 2 },
  muted: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  methodActions: { flexDirection: "row", gap: 16, marginTop: 8 },
  linkPrimary: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.primary },
  linkDanger: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.danger },
  payoutCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.kapo, padding: 14,
  },
  payoutTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  payoutAmount: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.primary },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, paddingBottom: 28 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.navy },
});
