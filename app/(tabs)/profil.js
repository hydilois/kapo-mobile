import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import { useAuth } from "@/context/AuthContext";
import { uploadUserAvatar, deleteStorageObject } from "@/lib/storage";
import { updateUserAvatar } from "@/lib/data/profile";
import { sendVerificationEmail } from "@/lib/api";
import RequireAuth from "@/components/layout/RequireAuth";
import Button from "@/components/ui/Button";
import { colors, fonts, radius } from "@/theme";

export default function ProfileScreen() {
  return (
    <RequireAuth message="Connectez-vous pour accéder à votre profil." next="/(tabs)/profil">
      <ProfileContent />
    </RequireAuth>
  );
}

function MenuItem({ icon, label, onPress, badge }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Feather name={icon} size={17} color={colors.navy} />
      <Text style={styles.menuLabel}>{label}</Text>
      {badge ? <View style={styles.menuBadge}>{badge}</View> : null}
      <Feather name="chevron-right" size={17} color={colors.muted} />
    </Pressable>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { user, profile, logout, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [verifSent, setVerifSent] = useState(false);

  // Recharge le profil au retour des écrans d'édition
  useFocusEffect(
    useCallback(() => {
      refreshProfile?.();
    }, [user?.uid])
  );

  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    user?.displayName ||
    "Utilisateur Kapo";
  const avatar = profile?.imageUrl || user?.photoURL;

  async function changeAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploading(true);
    try {
      const previousPath = profile?.imagePath;
      const { url, path } = await uploadUserAvatar(user.uid, result.assets[0].uri);
      await updateUserAvatar(user.uid, url, path);
      if (previousPath) deleteStorageObject(previousPath);
      await refreshProfile();
    } catch (err) {
      Alert.alert(
        "Photo de profil",
        err?.message?.includes("Storage")
          ? "Le stockage de fichiers n'est pas activé sur ce projet (forfait Blaze requis)."
          : err?.message || "L'envoi de la photo a échoué. Réessayez."
      );
    } finally {
      setUploading(false);
    }
  }

  async function resendVerification() {
    try {
      await sendVerificationEmail();
      setVerifSent(true);
    } catch (err) {
      Alert.alert("Vérification", err?.message || "L'envoi a échoué. Réessayez.");
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
      {/* Carte identité */}
      <View style={styles.card}>
        <Pressable style={styles.avatarWrap} onPress={changeAvatar} disabled={uploading}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.avatarEdit}>
            <Feather name={uploading ? "loader" : "camera"} size={12} color={colors.white} />
          </View>
        </Pressable>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {profile?.ville ? <Text style={styles.email}>{profile.ville}</Text> : null}
      </View>

      {/* Bannière e-mail non vérifié */}
      {user && !user.emailVerified ? (
        <View style={styles.verifyBanner}>
          <Feather name="alert-circle" size={16} color={colors.secondaryDark} />
          <Text style={styles.verifyText}>
            {verifSent
              ? "E-mail de vérification renvoyé — vérifiez votre boîte de réception."
              : "Votre adresse e-mail n'est pas vérifiée."}
          </Text>
          {!verifSent ? (
            <Pressable onPress={resendVerification}>
              <Text style={styles.verifyLink}>Renvoyer</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Bascule Espace hôte */}
      <Pressable style={styles.hostBanner} onPress={() => router.push("/hote")}>
        <View style={styles.hostIcon}>
          <Feather name="home" size={18} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.hostTitle}>Espace hôte</Text>
          <Text style={styles.hostSub}>Gérer mes annonces, réservations et versements</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.secondary} />
      </Pressable>

      {/* Menu */}
      <View style={styles.menu}>
        <MenuItem
          icon="user"
          label="Mes informations"
          onPress={() => router.push("/compte/modifier")}
        />
        <MenuItem
          icon="lock"
          label="Mot de passe"
          onPress={() => router.push("/compte/mot-de-passe")}
        />
        <MenuItem icon="message-circle" label="Messagerie" onPress={() => router.push("/messages")} />
        <MenuItem icon="bell" label="Notifications" onPress={() => router.push("/notifications")} />
        <MenuItem
          icon="heart"
          label="Mes favoris"
          onPress={() => router.push("/(tabs)/favoris")}
        />
        <MenuItem
          icon="calendar"
          label="Mes réservations"
          onPress={() => router.push("/(tabs)/reservations")}
        />
      </View>

      <Button title="Se déconnecter" variant="outline" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: {
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    padding: 22,
  },
  avatarWrap: { marginBottom: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: {
    backgroundColor: "#FDEDF0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.heading, fontSize: 30, color: colors.primary },
  avatarEdit: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.ink },
  email: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  verifyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF7ED",
    borderRadius: radius.kapo,
    padding: 12,
  },
  verifyText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: colors.secondaryDark },
  verifyLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.secondaryDark,
    textDecorationLine: "underline",
  },
  hostBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#FCE3C4",
    backgroundColor: "#FFF8EF",
    borderRadius: radius.kapo,
    padding: 14,
  },
  hostIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  hostTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.navy },
  hostSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  menu: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.kapo,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  menuBadge: { marginRight: 4 },
});
