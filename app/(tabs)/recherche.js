import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "@/theme";

export default function Placeholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>recherche</Text>
      <Text style={styles.text}>Écran en construction…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  title: { fontFamily: fonts.heading, fontSize: 22, color: colors.navy, textTransform: "capitalize" },
  text: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 8 },
});
