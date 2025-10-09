// components/PostCard.tsx
import { useMemo } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Post } from "../services/posts";

const screenW = Dimensions.get("window").width;
const CARD_HPAD = 14;
const mediaRadius = 14;

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "justo ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString();
}

function MediaGrid({ images }: { images: string[] }) {
  // 1 imagen: grande
  // 2-3 imágenes: grid 2 columnas
  // 4+: grid 2 columnas con overlay de "+n" en la última
  const data = images.slice(0, 4);
  const remaining = Math.max(0, images.length - 4);
  const twoCols = images.length >= 2;

  const size = useMemo(() => {
    if (!twoCols) return { w: screenW - CARD_HPAD * 2 - 2, h: 220 };
    const w = (screenW - CARD_HPAD * 2 - 8) / 2;
    return { w, h: w };
  }, [twoCols]);

  return (
    <View style={{ gap: 8 }}>
      {!twoCols ? (
        <Image
          source={{ uri: images[0] }}
          style={{ width: size.w, height: size.h, borderRadius: mediaRadius }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ gap: 8, flex: 1 }}>
            {data.filter((_, i) => i % 2 === 0).map((uri, i) => (
              <Image
                key={`L${i}`}
                source={{ uri }}
                style={{ width: size.w, height: size.h, borderRadius: mediaRadius }}
                resizeMode="cover"
              />
            ))}
          </View>
          <View style={{ gap: 8, flex: 1 }}>
            {data.filter((_, i) => i % 2 === 1).map((uri, i) => {
              const isLast = remaining > 0 && i === data.filter((_, j) => j % 2 === 1).length - 1;
              return (
                <View key={`R${i}`}>
                  <Image
                    source={{ uri }}
                    style={{ width: size.w, height: size.h, borderRadius: mediaRadius }}
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
      )}
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
  const images = (post.images || []).filter((u) => typeof u === "string" && u.length > 0);
  const avatarLetter = (post.user?.name?.[0] || "U").toUpperCase();

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{post.user?.name ?? "Usuario"}</Text>
          <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
        </View>
        <Feather name="more-horizontal" size={20} color="#94a3b8" />
      </View>

      {/* Body */}
      {!!post.body && <Text style={styles.body}>{post.body}</Text>}

      {/* Media */}
      {!!images.length && <MediaGrid images={images} />}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => onToggleLike(post)}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
        >
          <Feather
            name={post.liked ? "heart" : "heart"}
            size={20}
            color={post.liked ? "#ef4444" : "#334155"}
          />
          <Text style={[styles.actionText, post.liked && { color: "#ef4444" }]}>
            {post.likes_count || 0}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onOpenComments(post)}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
        >
          <Feather name="message-circle" size={20} color="#334155" />
          <Text style={styles.actionText}>{post.comments_count || 0}</Text>
        </Pressable>

        <Pressable
          onPress={() => onShare(post)}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
        >
          <Feather name="share-2" size={20} color="#334155" />
          <Text style={styles.actionText}>Compartir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: CARD_HPAD,
    backgroundColor: "#fff",
    borderRadius: 18,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#e0ecff",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#1d4ed8", fontWeight: "800" },
  name: { fontWeight: "700", color: "#0f172a" },
  time: { color: "#64748b", fontSize: 12 },
  body: { color: "#0f172a", lineHeight: 20 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 8, borderRadius: 10 },
  actionText: { color: "#334155", fontWeight: "700" },
  pressed: { backgroundColor: "#f1f5f9" },
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: mediaRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayText: { color: "#fff", fontWeight: "800", fontSize: 20 },
});
