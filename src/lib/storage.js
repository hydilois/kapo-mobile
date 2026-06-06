// Upload d'images vers Firebase Storage (mobile).
// Adaptation de src/lib/storage.js du web : en React Native on reçoit une URI
// locale (expo-image-picker) qu'on convertit en Blob avant uploadBytes.
// ⚠️ Storage nécessite le forfait Blaze : si non activé sur le projet,
// l'upload échoue avec un message explicite (comme sur le web).
import { storage } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

async function uriToBlob(uri) {
  const res = await fetch(uri);
  const blob = await res.blob();
  if (blob.size > MAX_SIZE) throw new Error("Image trop volumineuse (max 5 Mo).");
  return blob;
}

function stamp() {
  return Date.now().toString(36);
}

// Téléverse une photo de profil et retourne { url, path }.
export async function uploadUserAvatar(uid, uri) {
  if (!storage) throw new Error("Firebase Storage non configuré.");
  const blob = await uriToBlob(uri);
  const ext = (uri.split(".").pop() || "jpg").toLowerCase().slice(0, 4);
  const path = `users/${uid}/${stamp()}-avatar.${ext}`;
  const objectRef = ref(storage, path);
  await uploadBytes(objectRef, blob, { contentType: blob.type || "image/jpeg" });
  const url = await getDownloadURL(objectRef);
  return { url, path };
}

// Supprime un objet Storage à partir de son chemin (silencieux si absent).
export async function deleteStorageObject(path) {
  if (!storage || !path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch {
    /* objet déjà absent : on ignore */
  }
}
