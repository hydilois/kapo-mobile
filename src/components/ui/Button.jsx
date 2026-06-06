import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, fonts, radius } from "@/theme";

// Bouton charte Kapo : primary (.btn-kapo), host (.btn-host), outline (.btn-outline).
export default function Button({ title, onPress, variant = "primary", loading, disabled, style }) {
  const isOutline = variant === "outline";
  const bg =
    variant === "host" ? colors.secondary : variant === "outline" ? "transparent" : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: bg },
        isOutline && styles.outline,
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.white} />
      ) : (
        <Text style={[styles.text, isOutline && { color: colors.primary }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: radius.kapo,
    alignItems: "center",
    justifyContent: "center",
  },
  outline: { borderWidth: 1, borderColor: colors.primary },
  text: { color: colors.white, fontFamily: fonts.bodySemiBold, fontSize: 15 },
});
