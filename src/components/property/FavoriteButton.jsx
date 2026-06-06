import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { isFavorited, toggleFavorite } from "@/lib/data/favorites";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";

// Cœur favori — transposition du FavoriteButton web : redirige vers la
// connexion si déconnecté, masqué pour le propriétaire de l'annonce.
export default function FavoriteButton({ property, size = 20, style }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);

  const isOwner = Boolean(user && property.agentId && property.agentId === user.uid);

  useEffect(() => {
    let active = true;
    if (user && property?.id) {
      isFavorited(user.uid, property.id).then((v) => active && setFav(v));
    } else {
      setFav(false);
    }
    return () => {
      active = false;
    };
  }, [user?.uid, property?.id]);

  if (isOwner) return null;

  async function onPress() {
    if (!user) {
      router.push({ pathname: "/connexion", params: { next: pathname } });
      return;
    }
    if (busy) return;
    setBusy(true);
    setFav((v) => !v); // optimiste
    try {
      const next = await toggleFavorite(user.uid, property);
      setFav(next);
    } catch {
      setFav((v) => !v); // rollback
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable style={[styles.btn, style]} onPress={onPress} hitSlop={8}>
      <Feather
        name="heart"
        size={size}
        color={fav ? colors.primary : colors.muted}
        // Feather n'a pas de cœur plein : on joue sur la couleur + fond
        style={fav ? { textShadowColor: colors.primary, textShadowRadius: 1 } : null}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
});
