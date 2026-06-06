import { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import SelectField from "@/components/ui/SelectField";
import PropertyCard from "@/components/property/PropertyCard";
import { searchProperties } from "@/lib/data/properties";
import { getCategories, getActiveTowns } from "@/lib/data/taxonomy";
import { useFetch } from "@/hooks/useFetch";
import { colors, fonts } from "@/theme";

const TRAVELER_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}+`,
}));

// Recherche + catalogue : fusionne /logements et /recherche du site web.
export default function SearchScreen() {
  const params = useLocalSearchParams();
  const [town, setTown] = useState("");
  const [category, setCategory] = useState("");
  const [travelers, setTravelers] = useState("");

  // Pré-remplit les filtres quand on arrive depuis l'accueil (params URL).
  useEffect(() => {
    if (params.town !== undefined) setTown(params.town || "");
    if (params.category !== undefined) setCategory(params.category || "");
    if (params.travelers !== undefined) setTravelers(params.travelers || "");
  }, [params.town, params.category, params.travelers]);

  const taxonomy = useFetch(async () => {
    const [towns, categories] = await Promise.all([getActiveTowns(), getCategories()]);
    return { towns, categories };
  }, []);

  const results = useFetch(
    () =>
      searchProperties({
        townId: town || undefined,
        categoryId: category || undefined,
        travelers: travelers || undefined,
      }),
    [town, category, travelers]
  );

  const { towns = [], categories = [] } = taxonomy.data || {};
  const list = results.data || [];

  const title = useMemo(() => {
    const t = towns.find((x) => x.id === town);
    return t ? `Logements à ${t.name}` : "Tous les logements";
  }, [towns, town]);

  return (
    <View style={styles.screen}>
      <View style={styles.filters}>
        <SelectField
          placeholder="Ville"
          icon="map-pin"
          value={town}
          onChange={setTown}
          options={towns.map((t) => ({ value: t.id, label: t.name }))}
          style={{ flex: 1 }}
        />
        <SelectField
          placeholder="Type"
          icon="home"
          value={category}
          onChange={setCategory}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          style={{ flex: 1 }}
        />
        <SelectField
          placeholder="Voy."
          icon="users"
          value={travelers}
          onChange={setTravelers}
          options={TRAVELER_OPTIONS}
          style={{ width: 92 }}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <Text style={styles.count}>
            {title} — {results.loading ? "…" : `${list.length} logement${list.length > 1 ? "s" : ""}`}
          </Text>
        }
        ListEmptyComponent={
          !results.loading ? (
            <Text style={styles.empty}>Aucun logement ne correspond à votre recherche.</Text>
          ) : null
        }
        renderItem={({ item }) => <PropertyCard property={item} />}
        onRefresh={results.reload}
        refreshing={results.loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  list: { padding: 16, paddingBottom: 32 },
  count: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.navy, marginBottom: 12 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: "center", marginTop: 40 },
});
