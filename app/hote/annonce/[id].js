import { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import { getCategories, getTowns, getConforts } from "@/lib/data/taxonomy";
import { getProperty, createProperty, updateProperty } from "@/lib/data/host";
import { uploadPropertyImage, deleteStorageObject } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { formatPrice } from "@/lib/utils";
import SelectField from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import BlockedDatesCalendar from "@/components/host/BlockedDatesCalendar";
import { colors, fonts, radius } from "@/theme";

const STEPS = ["Infos", "Équipements", "Photos"];
const NUMERIC_DEFAULTS = {
  price: "", surface: "", rooms: "1", bedrooms: "1", bathrooms: "1", beds: "1",
  travelers: "1", reduction: "0", nbreNuitsLimite: "0",
};

export default function PropertyFormScreen() {
  const { id } = useLocalSearchParams();
  const isEdit = id && id !== "nouvelle";

  const { data, loading } = useFetch(async () => {
    const [categories, towns, conforts, existing] = await Promise.all([
      getCategories(),
      getTowns(),
      getConforts(),
      isEdit ? getProperty(id) : Promise.resolve(null),
    ]);
    return { categories, towns, conforts, existing };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: isEdit ? "Modifier" : "Nouvelle annonce" }} />
        <ActivityIndicator color={colors.secondary} />
      </View>
    );
  }
  if (isEdit && !data?.existing) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Annonce" }} />
        <Text style={styles.muted}>Annonce introuvable.</Text>
      </View>
    );
  }

  return <Form isEdit={isEdit} propertyId={id} {...data} />;
}

function Form({ isEdit, propertyId, categories = [], towns = [], conforts = [], existing }) {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  const [form, setForm] = useState(() => ({
    title: existing?.title || "",
    categoryId: existing?.categoryId || "",
    townId: existing?.townId || "",
    address: existing?.address || "",
    description: existing?.description || "",
    debutDisponibilite: existing?.debutDisponibilite || "",
    finDisponibilite: existing?.finDisponibilite || "",
    ...Object.fromEntries(
      Object.keys(NUMERIC_DEFAULTS).map((k) => [k, String(existing?.[k] ?? NUMERIC_DEFAULTS[k])])
    ),
  }));
  const [confortIds, setConfortIds] = useState(existing?.confortIds || []);
  const [disabledDates, setDisabledDates] = useState(existing?.disabledDates || []);
  const [photos, setPhotos] = useState(
    (existing?.photos || []).map((url, i) => ({ url, path: existing?.photoPaths?.[i] || null }))
  );
  const [coverIndex, setCoverIndex] = useState(() => {
    const list = existing?.photos || [];
    const idx = existing?.image ? list.indexOf(existing.image) : -1;
    return idx >= 0 ? idx : 0;
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleConfort = (cid) =>
    setConfortIds((ids) => (ids.includes(cid) ? ids.filter((x) => x !== cid) : [...ids, cid]));

  async function pickImages() {
    setError("");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (res.canceled || !res.assets?.length) return;
    setUploading(true);
    try {
      for (const asset of res.assets) {
        const uploaded = await uploadPropertyImage(user.uid, asset.uri);
        setPhotos((p) => [...p, uploaded]);
      }
    } catch (e) {
      setError(
        e?.message?.includes("Storage")
          ? "Le stockage de fichiers n'est pas activé (forfait Blaze). Ajoutez plutôt une image par URL."
          : e?.message || "Téléversement impossible."
      );
    } finally {
      setUploading(false);
    }
  }

  function addPhotoByUrl() {
    const url = photoUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setError("Saisissez une URL d'image valide (http/https).");
      return;
    }
    setError("");
    setPhotos((p) => [...p, { url, path: null }]);
    setPhotoUrl("");
  }

  async function removePhoto(idx) {
    const photo = photos[idx];
    setPhotos((p) => p.filter((_, i) => i !== idx));
    setCoverIndex((c) => (idx === c ? 0 : idx < c ? c - 1 : c));
    if (photo?.path) await deleteStorageObject(photo.path);
  }

  function validateStep() {
    if (step === 0 && (!form.title || !form.categoryId || !form.townId || !form.price)) {
      setError("Renseignez au moins le titre, la catégorie, la ville et le prix.");
      return false;
    }
    setError("");
    return true;
  }

  function next() {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function prev() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit(published) {
    if (!validateStep()) return;
    setSaving(true);
    setError("");
    try {
      const data = {
        ...form,
        confortIds,
        disabledDates,
        photos: photos.map((p) => p.url),
        photoPaths: photos.map((p) => p.path).filter(Boolean),
        image: photos[coverIndex]?.url || photos[0]?.url || existing?.image || "",
      };
      if (isEdit) await updateProperty(propertyId, data, { published });
      else await createProperty(user.uid, data, { published });
      router.replace("/hote/annonces");
    } catch (e) {
      setError(e?.message || "Enregistrement impossible.");
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: isEdit ? "Modifier l'annonce" : "Nouvelle annonce" }} />

      {/* Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((label, i) => (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              {i < step ? (
                <Feather name="check" size={13} color={colors.white} />
              ) : (
                <Text style={[styles.stepNum, i <= step && { color: colors.white }]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, i <= step && { color: colors.navy }]}>{label}</Text>
            {i < STEPS.length - 1 && <View style={[styles.stepBar, i < step && { backgroundColor: colors.secondary }]} />}
          </View>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Étape 0 — Infos */}
      {step === 0 && (
        <View style={{ gap: 12 }}>
          <TextField label="Titre de l'annonce *" value={form.title} onChangeText={(v) => set("title", v)} placeholder="Ex : Appartement moderne à Bonapriso" />
          <SelectField placeholder="Catégorie *" value={form.categoryId} onChange={(v) => set("categoryId", v)} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
          <SelectField placeholder="Ville *" value={form.townId} onChange={(v) => set("townId", v)} options={towns.map((t) => ({ value: t.id, label: t.name }))} />
          <TextField label="Adresse" value={form.address} onChangeText={(v) => set("address", v)} placeholder="Quartier, ville" />
          <View>
            <Text style={styles.label}>Description</Text>
            <TextInput style={styles.textarea} multiline value={form.description} onChangeText={(v) => set("description", v)} placeholder="Décrivez votre logement…" placeholderTextColor={colors.muted} textAlignVertical="top" />
          </View>
          <View style={styles.row}>
            <NumField label="Prix / nuit (FCFA) *" value={form.price} onChange={(v) => set("price", v)} />
            <NumField label="Surface (m²)" value={form.surface} onChange={(v) => set("surface", v)} />
          </View>
          <View style={styles.row}>
            <NumField label="Voyageurs" value={form.travelers} onChange={(v) => set("travelers", v)} />
            <NumField label="Pièces" value={form.rooms} onChange={(v) => set("rooms", v)} />
          </View>
          <View style={styles.row}>
            <NumField label="Chambres" value={form.bedrooms} onChange={(v) => set("bedrooms", v)} />
            <NumField label="Lits" value={form.beds} onChange={(v) => set("beds", v)} />
            <NumField label="Sdb" value={form.bathrooms} onChange={(v) => set("bathrooms", v)} />
          </View>
        </View>
      )}

      {/* Étape 1 — Équipements */}
      {step === 1 && (
        <View style={{ gap: 16 }}>
          <View>
            <Text style={styles.sectionLabel}>Équipements proposés</Text>
            <View style={styles.chips}>
              {conforts.map((c) => {
                const on = confortIds.includes(c.id);
                return (
                  <Pressable key={c.id} style={[styles.chip, on && styles.chipOn]} onPress={() => toggleConfort(c.id)}>
                    {on ? <Feather name="check" size={13} color={colors.secondary} /> : null}
                    <Text style={[styles.chipText, on && { color: colors.ink }]}>{c.libelle}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.row}>
            <NumField label="Réduction (%)" value={form.reduction} onChange={(v) => set("reduction", v)} />
            <NumField label="Nuits min. pour réduction" value={form.nbreNuitsLimite} onChange={(v) => set("nbreNuitsLimite", v)} />
          </View>
          <View style={styles.row}>
            <TextField label="Disponible du (AAAA-MM-JJ)" value={form.debutDisponibilite} onChangeText={(v) => set("debutDisponibilite", v)} placeholder="2026-07-01" style={{ flex: 1 }} />
            <TextField label="Jusqu'au (AAAA-MM-JJ)" value={form.finDisponibilite} onChangeText={(v) => set("finDisponibilite", v)} placeholder="2026-12-31" style={{ flex: 1 }} />
          </View>
          <View>
            <Text style={styles.sectionLabel}>Dates indisponibles</Text>
            <BlockedDatesCalendar value={disabledDates} onChange={setDisabledDates} />
          </View>
        </View>
      )}

      {/* Étape 2 — Photos */}
      {step === 2 && (
        <View style={{ gap: 14 }}>
          <Pressable style={styles.uploadBox} onPress={pickImages} disabled={uploading}>
            <Feather name={uploading ? "loader" : "upload-cloud"} size={26} color={colors.secondary} />
            <Text style={styles.uploadText}>{uploading ? "Téléversement…" : "Choisir des photos (galerie)"}</Text>
          </Pressable>

          <View style={styles.urlRow}>
            <TextInput style={styles.urlInput} value={photoUrl} onChangeText={setPhotoUrl} placeholder="…ou collez l'URL d'une image (https://…)" placeholderTextColor={colors.muted} autoCapitalize="none" />
            <Pressable style={styles.urlBtn} onPress={addPhotoByUrl}><Text style={styles.urlBtnText}>Ajouter</Text></Pressable>
          </View>
          <Text style={styles.hint}>Stockage désactivé ? Référencez une image par son URL.</Text>

          {photos.length > 0 && (
            <View style={styles.photoGrid}>
              {photos.map((p, i) => (
                <View key={`${p.url}-${i}`} style={[styles.photoItem, i === coverIndex && styles.photoCover]}>
                  <Image source={{ uri: p.url }} style={styles.photoImg} contentFit="cover" />
                  <Pressable style={styles.coverBtn} onPress={() => setCoverIndex(i)}>
                    <Feather name="star" size={11} color={i === coverIndex ? colors.secondary : colors.white} />
                    <Text style={[styles.coverText, i === coverIndex && { color: colors.secondary }]}>
                      {i === coverIndex ? "Couverture" : "Définir"}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.delBtn} onPress={() => removePhoto(i)}>
                    <Feather name="x" size={13} color={colors.white} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              Récap : <Text style={styles.summaryStrong}>{form.title || "Sans titre"}</Text> ·{" "}
              {form.price ? formatPrice(form.price) : "prix non défini"} / nuit · {confortIds.length} équipement(s) · {photos.length} photo(s)
            </Text>
          </View>
        </View>
      )}

      {/* Navigation */}
      <View style={styles.nav}>
        <Pressable style={[styles.navBtn, (step === 0 || saving) && { opacity: 0.4 }]} onPress={prev} disabled={step === 0 || saving}>
          <Feather name="arrow-left" size={16} color={colors.navy} />
          <Text style={styles.navBtnText}>Précédent</Text>
        </Pressable>

        {step < STEPS.length - 1 ? (
          <Pressable style={styles.nextBtn} onPress={next}>
            <Text style={styles.nextBtnText}>Suivant</Text>
            <Feather name="arrow-right" size={16} color={colors.white} />
          </Pressable>
        ) : (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button title="Brouillon" variant="outline" onPress={() => submit(false)} loading={saving} style={{ paddingHorizontal: 14 }} />
            <Button title={isEdit ? "Mettre à jour" : "Publier"} variant="host" onPress={() => submit(true)} loading={saving} style={{ paddingHorizontal: 14 }} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.numInput} value={String(value)} onChangeText={onChange} keyboardType="numeric" placeholderTextColor={colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  muted: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  stepper: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  stepItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" },
  stepDotActive: { backgroundColor: colors.secondary },
  stepNum: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.muted },
  stepLabel: { marginLeft: 6, fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted },
  stepBar: { flex: 1, height: 2, backgroundColor: "#e5e7eb", marginHorizontal: 6 },
  error: { backgroundColor: "#FEF2F2", color: colors.danger, fontFamily: fonts.body, fontSize: 13, borderRadius: radius.kapo, padding: 12, marginBottom: 12 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.ink, marginBottom: 5 },
  sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.navy, marginBottom: 10 },
  row: { flexDirection: "row", gap: 10 },
  textarea: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.kapo, padding: 12, minHeight: 96,
    fontFamily: fonts.body, fontSize: 14, color: colors.ink, backgroundColor: colors.white,
  },
  numInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.kapo, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 14, color: colors.ink, backgroundColor: colors.white,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 8,
  },
  chipOn: { borderColor: colors.secondary, backgroundColor: "#FFF8EF" },
  chipText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  uploadBox: {
    alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 2, borderColor: colors.border, borderStyle: "dashed", borderRadius: radius.kapo, paddingVertical: 28,
  },
  uploadText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
  urlRow: { flexDirection: "row", gap: 8 },
  urlInput: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.kapo, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 13, color: colors.ink, backgroundColor: colors.white,
  },
  urlBtn: { borderWidth: 1, borderColor: colors.secondary, borderRadius: radius.kapo, paddingHorizontal: 16, justifyContent: "center" },
  urlBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.secondary },
  hint: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoItem: { width: "31.5%", aspectRatio: 4 / 3, borderRadius: 8, overflow: "hidden", borderWidth: 2, borderColor: colors.border },
  photoCover: { borderColor: colors.secondary },
  photoImg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  coverBtn: {
    position: "absolute", left: 4, top: 4, flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2,
  },
  coverText: { fontFamily: fonts.bodySemiBold, fontSize: 9, color: colors.white },
  delBtn: { position: "absolute", right: 4, top: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 999, padding: 4 },
  summary: { backgroundColor: colors.surface, borderRadius: radius.kapo, padding: 12 },
  summaryText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, lineHeight: 18 },
  summaryStrong: { fontFamily: fonts.bodySemiBold, color: colors.ink },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22 },
  navBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 8 },
  navBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.navy },
  nextBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.secondary, borderRadius: radius.kapo, paddingHorizontal: 22, height: 46, justifyContent: "center",
  },
  nextBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.white },
});
