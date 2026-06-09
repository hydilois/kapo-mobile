import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "@/theme";

export default function HostStub() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>annonces</Text>
      <Text style={styles.s}>Écran en construction…</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  t: { fontFamily: fonts.heading, fontSize: 20, color: colors.navy, textTransform: "capitalize" },
  s: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 6 },
});
