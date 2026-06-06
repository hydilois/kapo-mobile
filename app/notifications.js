import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { getUserNotifications, markNotificationRead } from "@/lib/data/notifications";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { formatDate } from "@/lib/utils";
import RequireAuth from "@/components/layout/RequireAuth";
import { colors, fonts, radius } from "@/theme";

export default function NotificationsScreen() {
  return (
    <RequireAuth message="Connectez-vous pour voir vos notifications." next="/notifications">
      <NotificationsContent />
    </RequireAuth>
  );
}

function NotificationsContent() {
  const { user } = useAuth();
  const { data, loading, reload } = useFetch(() => getUserNotifications(user.uid), [user.uid]);
  const list = data || [];

  async function open(notif) {
    if (!notif.isRead) {
      markNotificationRead(notif.id).catch(() => {});
      reload();
    }
  }

  return (
    <FlatList
      style={styles.screen}
      data={list}
      keyExtractor={(n) => n.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      onRefresh={reload}
      refreshing={loading}
      ListHeaderComponent={<Stack.Screen options={{ title: "Notifications" }} />}
      ListEmptyComponent={
        !loading ? (
          <View style={styles.empty}>
            <Feather name="bell" size={34} color={colors.muted} />
            <Text style={styles.emptyText}>Aucune notification.</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.card, !item.isRead && styles.cardUnread]}
          onPress={() => open(item)}
        >
          <View style={styles.iconWrap}>
            <Feather name="bell" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, !item.isRead && { fontFamily: fonts.bodyBold }]}>
                {item.title || "Notification"}
              </Text>
              {!item.isRead ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.content}>{item.content}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    padding: 12,
  },
  cardUnread: { borderColor: colors.primary, backgroundColor: "#FFF8F9" },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FDEDF0",
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.ink },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  content: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 19 },
  date: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  empty: { alignItems: "center", gap: 10, marginTop: 60 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted },
});
