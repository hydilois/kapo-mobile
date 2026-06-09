import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "@/theme";

export default function PropertyFormStub() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Formulaire d'annonce</Text>
      <Text style={styles.s}>Écran en construction…</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: 16 },
  t: { fontFamily: fonts.heading, fontSize: 18, color: colors.navy },
  s: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 6 },
});
