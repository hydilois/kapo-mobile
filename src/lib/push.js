// Notifications push (Expo Push). Enregistre le jeton de l'appareil sur le
// document utilisateur (users/{uid}.pushTokens) ; l'envoi est fait côté serveur
// (site Kapo) via l'API Expo Push. Fonctionne dans un build standalone (APK) ;
// en Expo Go (SDK 53+) le push distant n'est plus pris en charge.
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";

// Affiche les notifications reçues au premier plan.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let lastToken = null;

// Demande la permission, récupère le jeton Expo et l'enregistre sur l'utilisateur.
export async function registerForPush(uid) {
  try {
    if (!uid || !Device.isDevice) return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Notifications Kapo",
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: "#F26178",
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== "granted") return null;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    if (!token || token === lastToken) return token;
    lastToken = token;

    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      pushTokens: arrayUnion(token),
    }).catch(() => {});
    return token;
  } catch {
    return null;
  }
}
