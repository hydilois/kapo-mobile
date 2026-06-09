import { Tabs, useRouter } from "expo-router";
import { Pressable, Text, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import RequireAuth from "@/components/layout/RequireAuth";
import { colors, fonts } from "@/theme";

const icon = (name) => ({ color, size }) => (
  <Feather name={name} size={size ?? 22} color={color} />
);

function VoyageurButton() {
  const router = useRouter();
  return (
    <Pressable
      style={styles.switch}
      onPress={() => router.replace("/(tabs)")}
      hitSlop={8}
    >
      <Feather name="user" size={14} color={colors.secondary} />
      <Text style={styles.switchText}>Voyageur</Text>
    </Pressable>
  );
}

export default function HostLayout() {
  return (
    <RequireAuth message="Connectez-vous pour accéder à votre espace hôte." next="/hote">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.secondary,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
          headerTintColor: colors.navy,
          headerTitleStyle: { fontFamily: fonts.headingSemiBold, color: colors.navy },
          headerRight: () => <VoyageurButton />,
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Tableau de bord", tabBarLabel: "Bord", tabBarIcon: icon("grid") }} />
        <Tabs.Screen name="annonces" options={{ title: "Mes annonces", tabBarLabel: "Annonces", tabBarIcon: icon("home") }} />
        <Tabs.Screen name="reservations" options={{ title: "Réservations", tabBarIcon: icon("calendar") }} />
        <Tabs.Screen name="versements" options={{ title: "Versements", tabBarIcon: icon("dollar-sign") }} />
        {/* Formulaire d'annonce : écran poussé, masqué de la barre d'onglets */}
        <Tabs.Screen name="annonce/[id]" options={{ href: null, title: "Annonce" }} />
      </Tabs>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  switch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginRight: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#FFF3E0",
  },
  switchText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.secondary },
});
