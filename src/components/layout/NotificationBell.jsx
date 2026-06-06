import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAuth } from "@/context/AuthContext";
import { colors, fonts } from "@/theme";

// Cloche de notifications avec badge temps réel (équivalent header web).
export default function NotificationBell({ light = false }) {
  const router = useRouter();
  const { user } = useAuth();
  const count = useUnreadNotifications();

  if (!user) return null;

  return (
    <Pressable style={styles.btn} onPress={() => router.push("/notifications")} hitSlop={8}>
      <Feather name="bell" size={20} color={light ? colors.white : colors.navy} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.white, fontFamily: fonts.bodySemiBold, fontSize: 10 },
});
