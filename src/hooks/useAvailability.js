import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";

// Nuits indisponibles + bornes de disponibilité d'un logement.
// Même logique que le BookingWidget web : API serveur (dates bloquées par
// l'hôte + nuits déjà réservées), repli sur les champs du logement.
export function useAvailability(property) {
  const [unavailable, setUnavailable] = useState(new Set());
  const [bounds, setBounds] = useState({ min: null, max: null });

  useEffect(() => {
    if (!property?.id) return;
    let active = true;

    const fallback = () => {
      if (!active) return;
      setUnavailable(new Set(property.disabledDates || []));
      setBounds({
        min: property.debutDisponibilite || null,
        max: property.finDisponibilite || null,
      });
    };

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/properties/${property.id}/availability`);
        const data = await res.json();
        if (!active) return;
        if (data.configured) {
          setUnavailable(new Set(data.unavailable || []));
          setBounds({ min: data.min, max: data.max });
        } else {
          fallback();
        }
      } catch {
        fallback();
      }
    })();

    return () => {
      active = false;
    };
  }, [property?.id]);

  return { unavailable, bounds };
}
