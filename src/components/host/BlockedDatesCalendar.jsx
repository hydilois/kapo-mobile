import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, startOfToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import Feather from "@expo/vector-icons/Feather";
import { colors, fonts, radius } from "@/theme";

const WEEKDAYS = ["LU", "MA", "ME", "JE", "VE", "SA", "DI"];
const toKey = (d) => format(d, "yyyy-MM-dd");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Calendrier de sélection des dates indisponibles (toggle multi-dates), un mois
// à la fois. `value` = tableau de "yyyy-MM-dd" ; `onChange(next[])`.
export default function BlockedDatesCalendar({ value = [], onChange }) {
  const today = startOfToday();
  const [base, setBase] = useState(() => startOfMonth(today));
  const selected = useMemo(() => new Set(value), [value]);

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(base), end: endOfMonth(base) }),
    [base]
  );
  const lead = (getDay(startOfMonth(base)) + 6) % 7;
  const canPrev = startOfMonth(base) > startOfMonth(today);

  function toggle(key) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange?.(Array.from(next).sort());
  }

  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <Pressable onPress={() => canPrev && setBase(addMonths(base, -1))} style={[styles.nav, !canPrev && { opacity: 0.3 }]}>
          <Feather name="chevron-left" size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.month}>{cap(format(base, "MMMM yyyy", { locale: fr }))}</Text>
        <Pressable onPress={() => setBase(addMonths(base, 1))} style={styles.nav}>
          <Feather name="chevron-right" size={18} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((d) => <Text key={d} style={styles.weekday}>{d}</Text>)}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: lead }).map((_, i) => <View key={`b${i}`} style={styles.cell} />)}
        {days.map((day) => {
          const key = toKey(day);
          const past = isBefore(day, today);
          const on = selected.has(key);
          return (
            <View key={key} style={styles.cell}>
              <Pressable
                disabled={past}
                onPress={() => toggle(key)}
                style={[styles.day, on && styles.dayOn]}
              >
                <Text style={[styles.dayText, past && styles.dayPast, on && styles.dayTextOn]}>
                  {day.getDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Text style={styles.hint}>
        Touchez une date pour la marquer indisponible. {value.length} date(s) bloquée(s).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nav: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  month: { fontFamily: fonts.headingSemiBold, fontSize: 15, color: colors.ink },
  week: { flexDirection: "row", marginTop: 8 },
  weekday: { flex: 1, textAlign: "center", fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.muted },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 2 },
  day: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dayOn: { backgroundColor: colors.secondary },
  dayText: { fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  dayPast: { color: "#cbd5e1" },
  dayTextOn: { color: colors.white, fontFamily: fonts.bodySemiBold },
  hint: { marginTop: 8, fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, textAlign: "center" },
});
