import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isBefore,
  startOfToday,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";
import Feather from "@expo/vector-icons/Feather";
import { colors, fonts, radius } from "@/theme";

const WEEKDAYS = ["LU", "MA", "ME", "JE", "VE", "SA", "DI"];
const toKey = (d) => format(d, "yyyy-MM-dd");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Calendrier de sélection d'une plage (arrivée → départ).
// Port React Native du RangeCalendar web : logique identique (nuits
// indisponibles, bornes min/max, plage chevauchant une nuit bloquée refusée),
// rendu 1 mois à la fois (écran mobile) avec flèches ‹ ›.
export default function RangeCalendar({
  arrivee,
  depart,
  onSelect,
  unavailable = new Set(),
  min,
  max,
}) {
  const today = startOfToday();
  const [base, setBase] = useState(() => startOfMonth(arrivee ? parseISO(arrivee) : today));

  function isDisabled(key, day) {
    if (isBefore(day, today)) return true;
    if (min && key < min) return true;
    if (max && key > max) return true;
    if (unavailable.has(key)) return true;
    return false;
  }

  // Un créneau [a, b) contient-il une nuit indisponible ?
  function hasBlockedNight(a, b) {
    const lo = a < b ? a : b;
    const hi = a < b ? b : a;
    let cur = parseISO(lo);
    const end = parseISO(hi);
    while (isBefore(cur, end)) {
      if (unavailable.has(toKey(cur))) return true;
      cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
    }
    return false;
  }

  function clickDay(key, day) {
    if (isDisabled(key, day)) return;
    if (!arrivee || (arrivee && depart)) {
      onSelect(key, null); // (re)commence une sélection
      return;
    }
    if (key <= arrivee) {
      onSelect(key, null);
      return;
    }
    if (hasBlockedNight(arrivee, key)) {
      onSelect(key, null); // créneau invalide → repart de cette date
      return;
    }
    onSelect(arrivee, key); // sélection complète
  }

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(base), end: endOfMonth(base) }),
    [base]
  );
  const lead = (getDay(startOfMonth(base)) + 6) % 7; // décalage lundi
  const canPrev = startOfMonth(base) > startOfMonth(today);

  const lo = arrivee && depart ? arrivee : null;
  const hi = arrivee && depart ? depart : null;

  return (
    <View style={styles.box}>
      {/* En-tête : mois + navigation */}
      <View style={styles.header}>
        <Pressable
          onPress={() => canPrev && setBase(addMonths(base, -1))}
          style={[styles.navBtn, !canPrev && { opacity: 0.3 }]}
        >
          <Feather name="chevron-left" size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.month}>{cap(format(base, "MMMM yyyy", { locale: fr }))}</Text>
        <Pressable onPress={() => setBase(addMonths(base, 1))} style={styles.navBtn}>
          <Feather name="chevron-right" size={18} color={colors.ink} />
        </Pressable>
      </View>

      {/* Jours de la semaine */}
      <View style={styles.week}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grille des jours */}
      <View style={styles.grid}>
        {Array.from({ length: lead }).map((_, i) => (
          <View key={`b${i}`} style={styles.cell} />
        ))}
        {days.map((day) => {
          const key = toKey(day);
          const disabled = isDisabled(key, day);
          const isStart = arrivee && key === arrivee;
          const isEnd = depart && key === depart;
          const inRange = lo && hi && key > lo && key < hi;
          const isToday = key === toKey(today);

          return (
            <View key={key} style={styles.cell}>
              <Pressable
                disabled={disabled}
                onPress={() => clickDay(key, day)}
                style={[
                  styles.day,
                  (isStart || isEnd) && styles.daySelected,
                  inRange && styles.dayInRange,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    disabled && styles.dayDisabled,
                    (isStart || isEnd) && styles.dayTextSelected,
                    !disabled && !isStart && !isEnd && isToday && styles.dayToday,
                  ]}
                >
                  {day.getDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  month: { fontFamily: fonts.headingSemiBold, fontSize: 15, color: colors.ink },
  week: { flexDirection: "row", marginTop: 8 },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.muted,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 2 },
  day: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  daySelected: { backgroundColor: colors.primary },
  dayInRange: { backgroundColor: "#FDE3E8" },
  dayText: { fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  dayTextSelected: { color: colors.white, fontFamily: fonts.bodySemiBold },
  dayDisabled: { color: "#cbd5e1", textDecorationLine: "line-through" },
  dayToday: { color: colors.primary, fontFamily: fonts.bodySemiBold },
});
