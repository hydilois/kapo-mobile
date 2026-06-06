import { Tabs } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { colors, fonts } from "@/theme";

const icon = (name) => ({ color, size }) => (
  <Feather name={name} size={size ?? 22} color={color} />
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        headerTintColor: colors.navy,
        headerTitleStyle: { fontFamily: fonts.headingSemiBold, color: colors.navy },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Accueil", headerShown: false, tabBarIcon: icon("home") }}
      />
      <Tabs.Screen
        name="recherche"
        options={{ title: "Recherche", tabBarIcon: icon("search") }}
      />
      <Tabs.Screen
        name="favoris"
        options={{ title: "Favoris", tabBarIcon: icon("heart") }}
      />
      <Tabs.Screen
        name="reservations"
        options={{ title: "Réservations", tabBarIcon: icon("calendar") }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: "Profil", tabBarIcon: icon("user") }}
      />
    </Tabs>
  );
}
