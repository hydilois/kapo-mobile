// Édition du profil utilisateur (côté client). Le doc `users/{uid}` est
// modifiable par son propriétaire (cf. firestore.rules).

import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";

// Met à jour les informations du profil + synchronise le displayName Auth.
export async function updateUserProfile(uid, data) {
  if (!db) throw new Error("Firebase n'est pas configuré (voir CLAUDE.md).");
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), { ...data, updatedAt: serverTimestamp() });

  const name = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
  if (name && auth?.currentUser) {
    const { updateProfile } = await import("firebase/auth");
    await updateProfile(auth.currentUser, { displayName: name }).catch(() => {});
  }
}

// Met à jour la photo de profil (URL Storage) + photoURL Auth.
export async function updateUserAvatar(uid, imageUrl, imagePath) {
  if (!db) throw new Error("Firebase n'est pas configuré (voir CLAUDE.md).");
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    imageUrl,
    imagePath: imagePath || null,
    updatedAt: serverTimestamp(),
  });
  if (auth?.currentUser) {
    const { updateProfile } = await import("firebase/auth");
    await updateProfile(auth.currentUser, { photoURL: imageUrl }).catch(() => {});
  }
}

// Change le mot de passe (ré-authentification requise par Firebase).
export async function changePassword(currentPassword, newPassword) {
  if (!auth?.currentUser) throw new Error("Vous devez être connecté.");
  const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import("firebase/auth");
  const user = auth.currentUser;
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  try {
    await reauthenticateWithCredential(user, cred);
  } catch {
    throw new Error("Mot de passe actuel incorrect.");
  }
  await updatePassword(user, newPassword);
}
