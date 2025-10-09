// components/LogoutCorner.tsx
import React from "react";
import { Pressable, View, StyleSheet, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

export default function LogoutCorner() {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  const onPress = () => {
    Alert.alert("Cerrar sesión", "¿Deseas salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          try { await logout(); } catch {}
        },
      },
    ]);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFill,
        { alignItems: "flex-end" },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.btn,
          {
            top: (insets.top || 10) + 10,
            right: 12,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Feather name="log-out" size={18} color="#1f2937" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.15 : 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
});
