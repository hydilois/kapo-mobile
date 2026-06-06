// Messages d'erreur Firebase Auth en français.
export function authErrorMessage(err) {
  if (!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
    return "Firebase n'est pas configuré (variables EXPO_PUBLIC_* manquantes).";
  }
  const code = err?.code || "";
  const map = {
    "auth/email-already-in-use": "Cette adresse e-mail est déjà utilisée.",
    "auth/invalid-email": "Adresse e-mail invalide.",
    "auth/weak-password": "Mot de passe trop faible (6 caractères minimum).",
    "auth/operation-not-allowed":
      "L'inscription par e-mail n'est pas activée. Activez-la dans Firebase Console → Authentication → Sign-in method → E-mail/Mot de passe.",
    "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
    "auth/wrong-password": "E-mail ou mot de passe incorrect.",
    "auth/user-not-found": "E-mail ou mot de passe incorrect.",
    "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
    "auth/network-request-failed": "Problème de connexion réseau. Réessayez.",
    "permission-denied":
      "Accès refusé par les règles Firestore. Vérifiez que les règles sont déployées.",
  };
  if (map[code]) return map[code];
  // À défaut, on affiche le message brut pour faciliter le diagnostic
  return err?.message ? `Erreur : ${err.message}` : "Une erreur est survenue. Réessayez.";
}
