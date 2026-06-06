import { Stack } from "expo-router";
import { colors, fonts } from "@/theme";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.navy,
        headerTitleStyle: { fontFamily: fonts.headingSemiBold, color: colors.navy },
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
