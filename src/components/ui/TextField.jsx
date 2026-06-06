import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { colors, fonts, radius } from "@/theme";

// Champ texte charte Kapo (équivalent .input-kapo du web).
export function TextField({ label, style, ...props }) {
  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.muted}
        {...props}
      />
    </View>
  );
}

// Champ mot de passe avec œil (équivalent PasswordField du web).
export function PasswordField({ label, style, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.passwordWrap}>
        <TextInput
          style={[styles.input, { flex: 1, borderWidth: 0 }]}
          placeholderTextColor={colors.muted}
          secureTextEntry={!visible}
          autoCapitalize="none"
          {...props}
        />
        <Pressable style={styles.eye} onPress={() => setVisible((v) => !v)} hitSlop={8}>
          <Feather name={visible ? "eye-off" : "eye"} size={18} color={colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.ink, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    paddingHorizontal: 12,
    height: 48,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    backgroundColor: colors.white,
  },
  eye: { paddingHorizontal: 12 },
});
