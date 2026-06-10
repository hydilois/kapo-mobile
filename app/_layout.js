import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from "@expo-google-fonts/montserrat";
import { AuthProvider } from "@/context/AuthContext";
import { colors, fonts } from "@/theme";

SplashScreen.preventAutoHideAsync();

// Route vers le bon écran quand l'utilisateur tape sur une notification push.
function PushTapHandler() {
  const router = useRouter();
  useEffect(() => {
    function handle(response) {
      const data = response?.notification?.request?.content?.data || {};
      if (data.type === "message" && data.conversationId) {
        router.push(`/messages/${data.conversationId}`);
      } else if (data.type === "reservation") {
        router.push("/(tabs)/reservations");
      }
    }
    Notifications.getLastNotificationResponseAsync().then((r) => r && handle(r));
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, []);
  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <PushTapHandler />
      <Stack
        screenOptions={{
          headerTintColor: colors.navy,
          headerTitleStyle: { fontFamily: fonts.headingSemiBold, color: colors.navy },
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="hote" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: "modal" }} />
      </Stack>
    </AuthProvider>
  );
}
