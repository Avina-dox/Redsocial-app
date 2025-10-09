// app/_layout.tsx
import { Slot, Redirect, usePathname } from "expo-router";
import { View, Text } from "react-native";
import AuthProvider, { useAuth } from "../context/AuthContext";
import LogoutCorner from "../components/LogoutCorner";

function Gate() {
  const { loading, user } = useAuth();
  const path = usePathname();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Cargando…</Text>
      </View>
    );
  }

  if (!user && !path.startsWith("/auth")) return <Redirect href="/auth/login" />;
  if (user && path.startsWith("/auth")) return <Redirect href="/" />;

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      {/* Botón de cerrar sesión solo cuando hay usuario y no estamos en /auth */}
      {user && !path.startsWith("/auth") && <LogoutCorner />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
