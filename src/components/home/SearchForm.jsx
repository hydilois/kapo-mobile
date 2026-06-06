import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import SelectField from "@/components/ui/SelectField";
import { colors, fonts, radius } from "@/theme";

const TRAVELER_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} voyageur${i ? "s" : ""}${i === 9 ? " ou plus" : ""}`,
}));

// Formulaire de recherche (ville / type / voyageurs) — transposition du
// SearchForm web. Redirige vers l'onglet Recherche avec les filtres en params.
export default function SearchForm({ towns = [], categories = [], initial = {} }) {
  const router = useRouter();
  const [town, setTown] = useState(initial.town || "");
  const [category, setCategory] = useState(initial.category || "");
  const [travelers, setTravelers] = useState(initial.travelers || "");

  const submit = () => {
    router.push({
      pathname: "/(tabs)/recherche",
      params: { town, category, travelers },
    });
  };

  return (
    <View style={styles.box}>
      <SelectField
        placeholder="Ville"
        icon="map-pin"
        value={town}
        onChange={setTown}
        options={towns.map((t) => ({ value: t.id, label: t.name }))}
      />
      <SelectField
        placeholder="Type de logement"
        icon="home"
        value={category}
        onChange={setCategory}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />
      <SelectField
        placeholder="Voyageurs"
        icon="users"
        value={travelers}
        onChange={setTravelers}
        options={TRAVELER_OPTIONS}
      />
      <Pressable style={styles.button} onPress={submit}>
        <Feather name="search" size={16} color={colors.white} />
        <Text style={styles.buttonText}>Rechercher</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.kapo,
    height: 48,
  },
  buttonText: { color: colors.white, fontFamily: fonts.bodySemiBold, fontSize: 15 },
});
