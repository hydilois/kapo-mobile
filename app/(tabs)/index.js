import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import * as WebBrowser from "expo-web-browser";
import { getCategories, getActiveTowns, getTestimonials } from "@/lib/data/taxonomy";
import { getFeaturedProperties } from "@/lib/data/properties";
import { useFetch } from "@/hooks/useFetch";
import SearchForm from "@/components/home/SearchForm";
import CategoryGrid from "@/components/home/CategoryGrid";
import TownGrid from "@/components/home/TownGrid";
import Testimonials from "@/components/home/Testimonials";
import PropertyCard from "@/components/property/PropertyCard";
import NotificationBell from "@/components/layout/NotificationBell";
import { API_BASE_URL } from "@/lib/config";
import { colors, fonts, radius } from "@/theme";

const HERO = require("../../assets/img/hero.jpg");
const LOGO = require("../../assets/brand/logo.png");

const ADVANTAGES = [
  { icon: "smartphone", title: "Paiement Mobile Money", text: "MTN MoMo et Orange Money, la méthode africaine." },
  { icon: "shield", title: "Réservation sécurisée", text: "Vos paiements sont protégés et confirmés." },
  { icon: "headphones", title: "Support local", text: "Une équipe au Cameroun, à votre écoute." },
];

function Section({ title, children, style }) {
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const home = useFetch(async () => {
    const [categories, towns, testimonials, featured] = await Promise.all([
      getCategories(),
      getActiveTowns(),
      getTestimonials(),
      getFeaturedProperties({ max: 8 }),
    ]);
    return { categories, towns, testimonials, featured };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await home.reload();
    setRefreshing(false);
  }, [home.reload]);

  const { categories = [], towns = [], testimonials = [], featured = [] } = home.data || {};

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Hero + recherche */}
      <ImageBackground source={HERO} style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.topBar}>
            <View style={styles.logoWrap}>
              <Image source={LOGO} style={styles.logo} contentFit="contain" />
            </View>
            <NotificationBell />
          </View>
          <Text style={styles.heroTitle}>Se loger au Cameroun, à la méthode africaine</Text>
          <SearchForm towns={towns} categories={categories} />
        </View>
      </ImageBackground>

      {/* Avantages */}
      <View style={styles.advantages}>
        {ADVANTAGES.map((a) => (
          <View key={a.title} style={styles.advantage}>
            <View style={styles.advantageIcon}>
              <Feather name={a.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.advantageTitle}>{a.title}</Text>
              <Text style={styles.advantageText}>{a.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <Section title="Quel type de logement ?">
        <CategoryGrid categories={categories} />
      </Section>

      <Section title="Logements populaires">
        {featured.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
            {featured.map((p) => (
              <PropertyCard key={p.id} property={p} width={230} />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.empty}>
            {home.loading ? "Chargement…" : "Aucun logement disponible pour le moment."}
          </Text>
        )}
        <Pressable style={styles.outlineBtn} onPress={() => router.push("/(tabs)/recherche")}>
          <Text style={styles.outlineBtnText}>Voir tous les logements</Text>
        </Pressable>
      </Section>

      <Section title="Explorer par ville">
        <TownGrid towns={towns.slice(0, 8)} />
      </Section>

      {/* Devenir hôte */}
      <View style={styles.hostBanner}>
        <Text style={styles.hostTitle}>Vous avez un logement à louer ?</Text>
        <Text style={styles.hostText}>
          Publiez votre annonce sur Kapo et recevez des réservations de voyageurs partout au Cameroun.
        </Text>
        <Pressable
          style={styles.hostBtn}
          onPress={() => WebBrowser.openBrowserAsync(`${API_BASE_URL}/hote/devenir-hote`)}
        >
          <Text style={styles.hostBtnText}>Devenir hôte</Text>
        </Pressable>
      </View>

      <Section title="Ils nous font confiance">
        <Testimonials testimonials={testimonials} />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { paddingBottom: 24 },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,43,94,0.55)",
  },
  heroContent: { paddingHorizontal: 16, gap: 14 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logoWrap: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderRadius: radius.kapo,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logo: { width: 96, height: 26 },
  heroTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    lineHeight: 32,
    color: colors.white,
    maxWidth: 320,
  },
  advantages: { padding: 16, gap: 12 },
  advantage: { flexDirection: "row", alignItems: "center", gap: 12 },
  advantageIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: "#FDEDF0",
    alignItems: "center",
    justifyContent: "center",
  },
  advantageTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  advantageText: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  section: { marginTop: 20, gap: 12 },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.navy,
    paddingHorizontal: 16,
  },
  cards: { paddingHorizontal: 16, gap: 12 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, paddingHorizontal: 16 },
  outlineBtn: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.kapo,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: { color: colors.primary, fontFamily: fonts.bodySemiBold, fontSize: 14 },
  hostBanner: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: 18,
    gap: 8,
  },
  hostTitle: { fontFamily: fonts.heading, fontSize: 17, color: colors.white },
  hostText: { fontFamily: fonts.body, fontSize: 13, color: "#cdd8e6", lineHeight: 19 },
  hostBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.secondary,
    borderRadius: radius.kapo,
    paddingHorizontal: 18,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  hostBtnText: { color: colors.white, fontFamily: fonts.bodySemiBold, fontSize: 14 },
});
