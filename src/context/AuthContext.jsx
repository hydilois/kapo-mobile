// État d'authentification global — adaptation mobile de src/context/AuthContext.jsx
// du site web : mêmes fonctions (login/register/logout/refreshProfile), sans les
// cookies kapoAuth/kapoRole (spécifiques au middleware Next.js) et avec des
// imports statiques (pas de code-splitting nécessaire sous Metro).
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";
import { COLLECTIONS, ROLES } from "@/lib/constants";
import { registerForPush } from "@/lib/push";
import { loginApi } from "@/lib/api";

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isHost: false,
  isAdmin: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

async function loadProfile(uid) {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const p = await loadProfile(fbUser.uid).catch(() => null);
        // SÉCURITÉ : un compte banni est immédiatement déconnecté (le serveur
        // applique aussi la règle aux réservations via assertNotBanned).
        if (p?.isBanned) {
          await signOut(auth).catch(() => {});
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        setUser(fbUser);
        setProfile(p);
        // Synchronise le statut vérifié dans Firestore (pour le badge admin)
        if (fbUser.emailVerified && p && !p.isVerified) {
          updateDoc(doc(db, COLLECTIONS.USERS, fbUser.uid), { isVerified: true }).catch(() => {});
        }
        // Enregistre le jeton push de l'appareil (best-effort, standalone uniquement)
        registerForPush(fbUser.uid).catch(() => {});
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(email, password) {
    // Connexion via le proxy serveur (throttling non contournable + contrôle
    // de bannissement). Renvoie un jeton personnalisé à échanger côté client.
    const { token } = await loginApi({ email, password });
    return signInWithCustomToken(auth, token);
  }

  async function register({ email, password, firstName, lastName, phoneNumber }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: `${firstName} ${lastName}`.trim() });
    await setDoc(doc(db, COLLECTIONS.USERS, cred.user.uid), {
      email,
      firstName: firstName || "",
      lastName: lastName || "",
      phoneNumber: phoneNumber || "",
      roles: [ROLES.USER],
      isHost: false,
      isVerified: false,
      enabled: true,
      createdAt: serverTimestamp(),
    });
    return cred;
  }

  function logout() {
    return signOut(auth);
  }

  async function refreshProfile() {
    if (!user) return;
    const p = await loadProfile(user.uid).catch(() => null);
    setProfile(p);
    return p;
  }

  const roles = profile?.roles || [];
  const value = {
    user,
    profile,
    loading,
    isHost: Boolean(profile?.isHost) || roles.includes(ROLES.HOST),
    isAdmin: roles.includes(ROLES.ADMIN) || roles.includes(ROLES.SUPER_ADMIN),
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
