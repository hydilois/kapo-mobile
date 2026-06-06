import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { colors, fonts, radius } from "@/theme";

// Équivalent mobile d'un <select> : champ qui ouvre une liste en modal.
// options = [{ value, label }] ; value "" = placeholder.
export default function SelectField({
  placeholder = "Sélectionner…",
  value,
  options = [],
  onChange,
  icon,
  style,
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <View style={style}>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        {icon ? <Feather name={icon} size={16} color={colors.muted} style={styles.icon} /> : null}
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Feather name="chevron-down" size={16} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{placeholder}</Text>
            <FlatList
              data={[{ value: "", label: placeholder }, ...options]}
              keyExtractor={(item) => String(item.value)}
              style={{ maxHeight: 380 }}
              renderItem={({ item }) => {
                const active = String(item.value) === String(value ?? "");
                return (
                  <Pressable
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      onChange?.(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {item.label}
                    </Text>
                    {active ? <Feather name="check" size={16} color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    paddingHorizontal: 12,
    height: 46,
  },
  icon: { marginRight: 8 },
  value: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  placeholder: { color: colors.muted },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: 12,
  },
  sheetTitle: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 15,
    color: colors.navy,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionActive: { backgroundColor: "#FDEDF0" },
  optionText: { fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  optionTextActive: { color: colors.primary, fontFamily: fonts.bodySemiBold },
});
