// app/auth/login.tsx
import React, { useState } from "react";
import { View, Text, Button, TextInput, Alert, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Login", "Ingresa email y contraseña.");
      return;
    }
    try {
      setBusy(true);
      await login(email.trim(), password); // el Gate redirige a "/"
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Error";
      console.log("LOGIN ERROR:", msg, e?.response?.status);
      Alert.alert("Login", msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, gap: 12, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Login</Text>
      <Text style={{ opacity: 0.6 }}>{process.env.EXPO_PUBLIC_API_URL}</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}
      />
      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderRadius: 8, padding: 12 }}
      />

      <Button title={busy || loading ? "Entrando..." : "Entrar"} onPress={onSubmit} disabled={busy || loading} />

      {(busy || loading) && (
        <View style={{ marginTop: 12, alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={{ opacity: 0.6, marginTop: 6 }}>Validando…</Text>
        </View>
      )}
    </View>
  );
}
