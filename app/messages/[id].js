import { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { listenMessages, getConversation } from "@/lib/data/messages";
import { sendMessageApi, markConversationReadApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/layout/RequireAuth";
import { colors, fonts, radius } from "@/theme";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  return (
    <RequireAuth message="Connectez-vous pour accéder à votre messagerie." next={`/messages/${id}`}>
      <ConversationContent />
    </RequireAuth>
  );
}

function ConversationContent() {
  const { id: convId, propertyId, title } = useLocalSearchParams();
  const { user } = useAuth();
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    getConversation(convId).then((c) => { if (c) { setConv(c); setStarted(true); } });
    const unsub = listenMessages(convId, setMessages);
    return unsub;
  }, [convId, user?.uid]);

  useEffect(() => {
    if (started) markConversationReadApi({ convId }).catch(() => {});
  }, [started, messages.length, convId]);

  const otherName = conv
    ? user?.uid === conv.hostId
      ? conv.voyageurName || "Voyageur"
      : conv.hostName || "L'hôte"
    : title || "Conversation";

  async function send() {
    const content = text.trim();
    if (!content) return;
    setBusy(true);
    try {
      if (started) await sendMessageApi({ convId, content });
      else await sendMessageApi({ propertyId, content });
      setText("");
      if (!started) {
        setStarted(true);
        getConversation(convId).then((c) => c && setConv(c));
      }
    } catch (err) {
      // message d'erreur léger : on garde le texte saisi
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: otherName }} />
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 14, gap: 6 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <Text style={styles.empty}>Envoyez le premier message pour démarrer la conversation.</Text>
        }
        renderItem={({ item }) => {
          const mine = item.senderId === user?.uid;
          return (
            <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowOther]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, mine && { color: colors.white }]}>{item.content}</Text>
              </View>
            </View>
          );
        }}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Écrire un message…"
          placeholderTextColor={colors.muted}
          multiline
        />
        <Pressable
          style={[styles.sendBtn, (busy || !text.trim()) && { opacity: 0.5 }]}
          onPress={send}
          disabled={busy || !text.trim()}
        >
          <Feather name="send" size={18} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: "center", paddingTop: 60, paddingHorizontal: 30 },
  bubbleRow: { flexDirection: "row" },
  rowMine: { justifyContent: "flex-end" },
  rowOther: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8 },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleOther: { backgroundColor: colors.surface },
  bubbleText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink, lineHeight: 19 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
  },
});
