// components/PostCard.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  useColorScheme,
  Animated,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Post } from "../services/posts";

let BlurView: any = View;
try { BlurView = require("expo-blur").BlurView; } catch {}
let LinearGradient: any = View;
try { LinearGradient = require("expo-linear-gradient").LinearGradient; } catch {}
let Haptics: any = { impactAsync: async () => {} };
try { Haptics = require("expo-haptics"); } catch {}

const screenW = Dimensions.get("window").width;
const PAD = 14;
const MEDIA_RADIUS = 14;
const BODY_MAX_LINES = 3;

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "justo ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString();
}

function usePalette() {
  const dark = useColorScheme() === "dark";
  return {
    dark,
    bg: dark ? "#0B0E19" : "#F5F7FB",
    card: dark ? "#000" : "rgba(255, 255, 255, 0.9)",
    border: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    text: dark ? "#e9ecf1ff" : "#0F172A",
    sub: dark ? "#A3A3A3" : "#64748B",
    muted: dark ? "#B8B8C2" : "#475569",
    accent: "#E9C16C",
    brand1: "#1E3A8A",
    brand2: "#6A2C75",
    likeOn: "#ef4444",
    chip: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
    skeleton: dark ? "rgba(255,255,255,0.08)" : "#E5E7EB",
  };
}

function MediaGrid({ images }: { images: string[] }) {
  const data = images.slice(0, 4);
  const remaining = Math.max(0, images.length - 4);
  const twoCols = images.length >= 2;

  const size = useMemo(() => {
    if (!twoCols) return { w: screenW - PAD * 2 - 2, h: 220 };
    const w = (screenW - PAD * 2 - 8) / 2;
    return { w, h: w };
  }, [twoCols]);

  if (!images.length) return null;

  if (!twoCols) {
    return (
      <Image
        source={{ uri: images[0] }}
        style={{ width: size.w, height: size.h, borderRadius: MEDIA_RADIUS }}
        resizeMode="cover"
      />
    );
  }

  const left = data.filter((_, i) => i % 2 === 0);
  const right = data.filter((_, i) => i % 2 === 1);

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <View style={{ gap: 8, flex: 1 }}>
        {left.map((uri, i) => (
          <Image
            key={`L${i}`}
            source={{ uri }}
            style={{ width: "100%", height: size.h, borderRadius: MEDIA_RADIUS }}
            resizeMode="cover"
          />
        ))}
      </View>
      <View style={{ gap: 8, flex: 1 }}>
        {right.map((uri, i) => {
          const isLast = remaining > 0 && i === right.length - 1;
          return (
            <View key={`R${i}`}>
              <Image
                source={{ uri }}
                style={{ width: "100%", height: size.h, borderRadius: MEDIA_RADIUS }}
                resizeMode="cover"
              />
              {isLast && (
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>+{remaining}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function PostCard({
  post,
  onToggleLike,
  onOpenComments,
  onShare,
}: {
  post: Post;
  onToggleLike: (p: Post) => void;
  onOpenComments: (p: Post) => void;
  onShare: (p: Post) => void;
}) {
  const C = usePalette();
  const images = (post.images || []).filter((u) => typeof u === "string" && u.length > 0);
  const avatarLetter = (post.user?.name?.[0] || "U").toUpperCase();

  const [expanded, setExpanded] = useState(false);

  // Like pulse animation
  const likeScale = useRef(new Animated.Value(1)).current;
  const pulse = () => {
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.15, useNativeDriver: true, speed: 20, bounciness: 6 }),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
    ]).start();
  };

  const handleLike = async () => {
    pulse();
    try { await Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle?.Light); } catch {}
    onToggleLike(post);
  };

  return (
    // Borde con gradiente + glass interior
    <LinearGradient
      colors={C.dark ? ["#1a1f33", "#0f1220"] : ["#ffffff", "#f7f7fb"]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[
        styles.cardOuter,
        { borderRadius: 20, padding: 1.2, shadowColor: C.dark ? "#000" : "#000" },
      ]}
    >
      <BlurView
        intensity={C.dark ? 30 : 15}
        tint={C.dark ? "dark" : "light"}
        style={[
          styles.card,
          {
            backgroundColor: C.card,
            borderColor: C.border,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: C.chip }]}>
            <Text style={[styles.avatarText, { color: C.text }]}>{avatarLetter}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
                {post.user?.name ?? "Usuario"}
              </Text>
              {!!post.location && (
                <View style={[styles.badge, { backgroundColor: C.chip }]}>
                  <Feather name="map-pin" size={11} color={C.sub} />
                  <Text style={{ color: C.sub, fontSize: 11 }} numberOfLines={1}>
                    {post.location}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.time, { color: C.sub }]}>{timeAgo(post.created_at)}</Text>
          </View>
          <Pressable hitSlop={8} onPress={() => {}}>
            <Feather name="more-horizontal" size={20} color={C.sub} />
          </Pressable>
        </View>

        {/* Body */}
        {!!post.body && (
          <Text
            style={[styles.body, { color: C.text }]}
            numberOfLines={expanded ? 0 : BODY_MAX_LINES}
          >
            {post.body}
          </Text>
        )}
        {!!post.body && post.body.length > 120 && (
          <Pressable onPress={() => setExpanded(!expanded)}>
            <Text style={{ color: C.muted, fontWeight: "700" }}>
              {expanded ? "ver menos" : "ver más"}
            </Text>
          </Pressable>
        )}

        {/* Media */}
        {!!images.length && <MediaGrid images={images} />}

        {/* Métricas compactas */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="heart" size={14} color={post.liked ? C.likeOn : C.sub} />
            <Text style={[styles.metaText, { color: post.liked ? C.likeOn : C.sub }]}>
              {post.likes_count || 0}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="message-circle" size={14} color={C.sub} />
            <Text style={[styles.metaText, { color: C.sub }]}>{post.comments_count || 0}</Text>
          </View>
          {!!post.views_count && (
            <View style={styles.metaItem}>
              <Feather name="eye" size={14} color={C.sub} />
              <Text style={[styles.metaText, { color: C.sub }]}>{post.views_count}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={[styles.actions, { borderTopColor: C.border }]}>
          <Pressable
            onPress={handleLike}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            android_ripple={{ color: "rgba(0,0,0,0.06)" }}
            accessibilityRole="button"
            accessibilityLabel="Me gusta"
          >
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Feather
                name="heart"
                size={20}
                color={post.liked ? C.likeOn : C.text}
              />
            </Animated.View>
            <Text
              style={[
                styles.actionText,
                { color: post.liked ? C.likeOn : C.text },
              ]}
            >
              Me gusta
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onOpenComments(post)}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            android_ripple={{ color: "rgba(0,0,0,0.06)" }}
            accessibilityRole="button"
            accessibilityLabel="Comentarios"
          >
            <Feather name="message-circle" size={20} color={C.text} />
            <Text style={[styles.actionText, { color: C.text }]}>Comentar</Text>
          </Pressable>

          <Pressable
            onPress={() => onShare(post)}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            android_ripple={{ color: "rgba(0,0,0,0.06)" }}
            accessibilityRole="button"
            accessibilityLabel="Compartir"
          >
            <Feather name="share-2" size={20} color={C.text} />
            <Text style={[styles.actionText, { color: C.text }]}>Compartir</Text>
          </Pressable>
        </View>
      </BlurView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    borderRadius: 20,
    padding: 1,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: PAD,
    gap: 10,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontWeight: "800" },
  name: { fontWeight: "800", fontSize: 15 },
  time: { fontSize: 12, marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  body: { lineHeight: 20, fontSize: 15 },
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: MEDIA_RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayText: { color: "#fff", fontWeight: "800", fontSize: 20 },

  metaRow: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 2,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontWeight: "700", fontSize: 12 },

  actions: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 12,
  },
  actionText: { fontWeight: "800" },
  pressed: { opacity: Platform.OS === "ios" ? 0.7 : 1, backgroundColor: "rgba(127,127,127,0.08)" },
});
