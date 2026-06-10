import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { listenConversations } from "@/lib/data/messages";
import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/layout/RequireAuth";
import { formatDate } from "@/lib/utils";
import { colors, fonts, radius } from "@/theme";

export default function MessagesScreen() {
  return (
    <RequireAuth message="Connectez-vous pour accéder à votre messagerie." next="/messages">
      <MessagesContent />
    </RequireAuth>
  );
}

function MessagesContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenConversations(user.uid, setItems);
    return unsub;
  }, [user?.uid]);

  return (
    <FlatList
      style={styles.screen}
      data={items}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListHeaderComponent={<Stack.Screen options={{ title: "Messagerie" }} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Feather name="message-circle" size={34} color={colors.muted} />
          <Text style={styles.emptyText}>Aucune conversation. Contactez un hôte depuis un logement.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const isHost = user.uid === item.hostId;
        const otherName = isHost ? item.voyageurName || "Voyageur" : item.hostName || "L'hôte";
        const unread = item.unread?.[user.uid] || 0;
        return (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/messages/${item.id}`)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{otherName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.titleRow}>
                <Text style={styles.name} numberOfLines={1}>{otherName}</Text>
                {item.lastAt ? <Text style={styles.date}>{formatDate(item.lastAt)}</Text> : null}
              </View>
              {item.propertyTitle ? (
                <Text style={styles.property} numberOfLines={1}>{item.propertyTitle}</Text>
              ) : null}
              <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
                {item.lastSenderId === user.uid ? "Vous : " : ""}{item.lastMessage}
              </Text>
            </View>
            {unread > 0 ? (
              <View style={styles.badge}><Text style={styles.badgeText}>{unread}</Text></View>
            ) : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    padding: 12,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#FDEDF0", alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.heading, fontSize: 17, color: colors.primary },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.navy },
  date: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  property: { fontFamily: fonts.body, fontSize: 11.5, color: colors.secondary },
  preview: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  previewUnread: { fontFamily: fonts.bodySemiBold, color: colors.ink },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6,
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.white },
  empty: { alignItems: "center", gap: 10, paddingTop: 80 },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, textAlign: "center", paddingHorizontal: 30 },
});
