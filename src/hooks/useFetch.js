import { useCallback, useEffect, useState } from "react";

// Petit hook générique de chargement de données (équivalent mobile des
// Server Components du site web) : état loading/error + rechargement.
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      console.warn("useFetch:", err?.message || err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
