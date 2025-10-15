// app/(tabs)/new_post.tsx
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Alert,
  ScrollView,
  StyleSheet,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { createPost } from "../../services/posts";

// Gradiente opcional (hace fallback si no está instalado)
let LinearGradient: any = View;
try { LinearGradient = require("expo-linear-gradient").LinearGradient; } catch {}

export default function NewPost() {
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  

  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const C = useMemo(() => ({
    bg: dark ? "#0B0E19" : "#F5F7FB",
    card: dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
    border: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    text: dark ? "#E5E7EB" : "#0F172A",
    sub: dark ? "#A3A3A3" : "#64748B",
    accent: "#E9C16C",
    brand1: "#1E3A8A",
    brand2: "#6A2C75",
    chip: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
  }), [dark]);

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsMultipleSelection: true, // iOS 14+, en Android el picker puede limitar
        selectionLimit: 10,
      });
      if (!res.canceled) {
        const uris = ("assets" in res ? res.assets : [])
          .map(a => a.uri)
          .filter(Boolean) as string[];
        setImages(prev => [...prev, ...uris]);
      }
    } catch (e) {
      Alert.alert("Imágenes", "No se pudo abrir la galería.");
    }
  };

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    if (!body.trim() && images.length === 0) {
      return Alert.alert("Post", "Escribe algo o agrega al menos una imagen.");
    }
    setBusy(true);
    try {
      await createPost(body.trim(), images);
      setBody("");
      setImages([]);
      Alert.alert("Post", "Publicado 👍");
    } catch (e) {
      console.log(e);
      Alert.alert("Post", "No se pudo publicar.");
    } finally {
      setBusy(false);
    }
  };

  const remain = 500 - body.length;
  const overLimit = remain < 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header “cristal” */}
      <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 }}>
        <LinearGradient
          colors={dark ? ["#14192B", "#0F1220"] : [C.brand1, C.brand2]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={{ color: "#131111ff", fontWeight: "800", fontSize: 18 }}>Nueva publicación</Text>
          <Text style={{ color: "rgba(17, 15, 15, 0.9)", marginTop: 4, fontSize: 13 }}>
            Comparte novedades .
          </Text>
        </LinearGradient>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Tarjeta de vidrio */}
          <LinearGradient
            colors={dark ? ["#1a1f33", "#0f1220"] : ["#ffffff", "#f7f7fb"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 1.2 }}
          >
            <BlurView intensity={dark ? 30 : 15} tint={dark ? "dark" : "light"} style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
              {/* Caja de texto */}
              <View style={[styles.inputWrap, { borderColor: C.border, backgroundColor: dark ? "rgba(255,255,255,0.02)" : "#fff" }]}>
                <TextInput
                  placeholder="¿Qué está pasando?"
                  placeholderTextColor={dark ? "#9CA3AF" : "#94A3B8"}
                  value={body}
                  onChangeText={setBody}
                  multiline
                  maxLength={500}
                  style={[styles.textInput, { color: C.text }]}
                />
                <Text style={{ position: "absolute", right: 10, bottom: 8, fontSize: 12, color: overLimit ? "#ef4444" : C.sub }}>
                  {Math.max(remain, 0)}
                </Text>
              </View>

              {/* Acciones rápidas */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Chip icon="image" label="Añadir imagen" onPress={pickImage} dark={dark} />
                <Chip icon="hash" label="#Etiqueta" onPress={() => setBody(v => v + (v.endsWith(" ") || v.length === 0 ? "#barrio " : " #barrio "))} dark={dark} />
              </View>

              {/* Grid de imágenes */}
              {!!images.length && (
                <View style={styles.grid}>
                  {images.map((uri, i) => (
                    <View key={i} style={styles.thumb}>
                      <Image source={{ uri }} style={styles.img} />
                      <Pressable onPress={() => removeImage(i)} style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.8 : 1 }]}>
                        <Feather name="x" size={14} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* CTA publicar */}
              <Pressable
                onPress={submit}
                disabled={busy || overLimit}
                style={({ pressed }) => [
                  styles.cta,
                  {
                    backgroundColor: busy || overLimit ? "rgba(0,0,0,0.15)" : C.accent,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
                android_ripple={{ color: "rgba(0,0,0,0.08)" }}
                accessibilityRole="button"
                accessibilityLabel="Publicar"
              >
                <Text style={{ color: "#1F2937", fontWeight: "800" }}>
                  {busy ? "Publicando..." : "Publicar"}
                </Text>
              </Pressable>
            </BlurView>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- UI helpers ---------- */

function Chip({
  label,
  icon,
  onPress,
  dark,
}: {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
  dark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
    >
      <Feather name={icon} size={14} color={dark ? "#E5E7EB" : "#334155"} />
      <Text style={{ color: dark ? "#E5E7EB" : "#334155", fontWeight: "700", fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  hero: {
    marginTop: 60,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  inputWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 10,
    minHeight: 120,
  },
  textInput: {
    minHeight: 100,
    fontSize: 15,
    lineHeight: 22,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  thumb: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  img: { width: "100%", height: "100%" },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    marginTop: 4,
    alignSelf: "flex-end",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
  },
});
