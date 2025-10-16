// app/auth/login.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import AnimatedBubble from "../../components/AnimatedBubble";
import SocialSecurityBg from "../../components/SocialSecurityBg";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const { login, loading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light"; // default a oscuro si es undefined
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isSmallHeight = height < 700;
  const isTablet = width >= 768;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Animación de entrada de la tarjeta
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // Fondo animado temático se maneja en SocialSecurityBg

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Login", "Ingresa email y contraseña.");
      return;
    }
    try {
      setBusy(true);
      await login(email.trim(), password);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Error";
      console.log("LOGIN ERROR:", msg, e?.response?.status);
      Alert.alert("Login", msg);
    } finally {
      setBusy(false);
    }
  };

  // Estados de UI
  const isLoading = busy || loading;
  const palette = useMemo(
    () => ({
      bg: isDark ? "#0a0a0f" : "#f7f7fb",
      text: isDark ? "#fff" : "#0a0a0f",
      subtext: isDark ? "rgba(255,255,255,0.6)" : "rgba(10,10,15,0.6)",
      cardBg: isDark ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.65)",
      border: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.08)",
      stroke: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.15)",
      fieldBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)",
      placeholder: isDark ? "rgba(255,255,255,0.5)" : "rgba(10,10,15,0.45)",
      buttonFill: isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.75)",
      buttonFillLoading: isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.6)",
      activityColor: isDark ? "#fff" : "#000",
      blurTint: (isDark ? "systemUltraThinMaterial" : "systemChromeMaterialLight") as any,
      overlayColors: isDark
        ? ["rgba(10,10,10,0.35)", "rgba(10,10,10,0.65)"]
        : ["rgba(255,255,255,0.65)", "rgba(255,255,255,0.25)"]
    }),
    [isDark]
  );
  const cardStyle = useMemo(
    () => [
      [
        styles.card,
        {
          backgroundColor: palette.cardBg,
          borderColor: palette.border,
          padding: isSmallHeight || isLandscape ? 16 : 20,
          maxWidth: isTablet ? 480 : undefined,
          alignSelf: "center",
        },
      ],
      {
        opacity: enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
        transform: [
          { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
          { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
        ],
      },
    ],
    [enter, palette, isSmallHeight, isLandscape, isTablet]
  );

  // Para el botón brillante (sweep al montar)
  const [sweepKey, setSweepKey] = useState(0);
  const [btnW, setBtnW] = useState<number | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setSweepKey((k) => k + 1), 500);
    return () => clearTimeout(t);
  }, []);

  // dimensiones responsivas
  const buttonHeight = isSmallHeight ? 44 : 48;
  const inputVPad = Platform.OS === "ios" ? (isSmallHeight ? 12 : 14) : isSmallHeight ? 10 : 12;
  const titleSize = isSmallHeight || isLandscape ? 24 : 28;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              {
                paddingHorizontal: isTablet ? 24 : 20,
                paddingVertical: isSmallHeight || isLandscape ? 12 : 24,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
      {/* Fondo animado temático de Seguridad Social */}
      <View style={StyleSheet.absoluteFill}>
        <SocialSecurityBg isDark={isDark} />
        <LinearGradient
          colors={palette.overlayColors}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Tarjeta de login tipo glass */}
      <Animated.View style={cardStyle}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={30} tint={palette.blurTint} style={StyleSheet.absoluteFill} />
        ) : null}

        {/* Borde sutil */}
        <View style={[styles.cardStroke, { borderColor: palette.stroke }]} pointerEvents="none" />

        <Text style={[styles.title, { color: palette.text, fontSize: titleSize }]}>Bienvenido Alerta App</Text>
        <Text style={[styles.subtitle, { color: palette.subtext }]}>
          Sistema de Seguridad Social • acceso seguro y verificado
        </Text>
        <Text style={[styles.caption, { color: palette.subtext }]}>Tus datos y beneficios protegidos con estándares modernos de privacidad.</Text>

        <View style={styles.field}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={palette.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={[styles.input, { color: palette.text, paddingVertical: inputVPad }]}
          />
        </View>
        <View style={styles.field}>
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor={palette.placeholder}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={[styles.input, { color: palette.text, paddingVertical: inputVPad }]}
          />
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={isLoading}
          style={[styles.buttonWrap, { height: buttonHeight }]}
          onLayout={(e) => setBtnW(e.nativeEvent.layout.width)}
        >
          {/* Fondo brillante tipo "liquid crystal" */}
          <AnimatedBubble
            width={(btnW ?? Math.min(width - 40, isTablet ? 440 : 340)) as number}
            height={buttonHeight}
            borderColor={palette.stroke}
            fillColor={isLoading ? palette.buttonFillLoading : palette.buttonFill}
            highlightBase="rgba(255,255,255,0.8)"
            innerStroke={isDark ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.55)"}
            isActive={!isLoading}
            sweepMode="trigger"
            sweepKey={sweepKey}
          />
          <Text style={[styles.buttonLabel, { color: palette.text, fontSize: isSmallHeight ? 14 : 16 }]}>{isLoading ? "Entrando…" : "Entrar"}</Text>
        </Pressable>

        {isLoading && (
          <View style={{ marginTop: 10, alignItems: "center" }}>
            <ActivityIndicator color={palette.activityColor} />
            <Text style={{ opacity: 0.7, color: palette.subtext, marginTop: 6 }}>Validando…</Text>
          </View>
        )}
      </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  scroll: {
    minHeight: "100%",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  // masas de color (blobs)
  blob: {},
  blobRight: {},
  blobBottom: {},
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  cardStroke: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    marginBottom: 16,
  },
  field: {
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    color: "#fff",
  },
  buttonWrap: {
    marginTop: 8,
    height: 48,
    borderRadius: 80,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    position: "absolute",
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
