import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Hook générique de chargement (équivalent mobile des Server Components du web).
// Option `cacheKey` : cache hors-ligne « stale-while-revalidate » (AsyncStorage)
// → affichage instantané des données déjà vues + repli si le réseau est coupé
// (utile en faible débit). À réserver aux écrans sans dates affichées (les
// Timestamps Firestore ne survivent pas au JSON) : accueil, catalogue, référentiels.
export function useFetch(fetcher, deps = [], { cacheKey } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      if (cacheKey) AsyncStorage.setItem(cacheKey, JSON.stringify(result)).catch(() => {});
      return result;
    } catch (err) {
      console.warn("useFetch:", err?.message || err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let active = true;
    setLoading(true);
    // 1) Affiche immédiatement le cache si présent (stale)…
    if (cacheKey) {
      AsyncStorage.getItem(cacheKey)
        .then((raw) => {
          if (!active || !raw) return;
          try { setData(JSON.parse(raw)); setLoading(false); } catch {}
        })
        .catch(() => {});
    }
    // 2) …puis revalide en arrière-plan.
    load();
    return () => { active = false; };
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, reload: load };
}
