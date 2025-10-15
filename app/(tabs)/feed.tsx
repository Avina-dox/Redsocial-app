import { useCallback, useEffect, useState } from "react";
import {
  View, Text, FlatList, RefreshControl, Modal,
  TextInput, Button, Alert, Share, StyleSheet
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import PostCard from "../../components/PostCard";
import {
  Post, listPosts, toggleLike,
  listComments, addComment, Comment
} from "../../services/posts";

export default function Feed() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initial, setInitial] = useState(true);

  // comentarios
  const [showComments, setShowComments] = useState(false);
  const [selected, setSelected] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState("");

  const load = useCallback(async () => {
    if (loading || !user) return;
    setRefreshing(true);
    try {
      const data = await listPosts();
      setItems(data);
    } catch (e) {
      console.log("Feed error:", e);
      Alert.alert("Error", "No se pudo cargar el feed.");
    } finally {
      setRefreshing(false);
      setInitial(false);
    }
  }, [loading, user]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onToggleLike = async (p: Post) => {
    // Optimista
    setItems(prev => prev.map(x =>
      x.id === p.id ? {
        ...x,
        liked: !x.liked,
        likes_count: x.liked ? x.likes_count - 1 : x.likes_count + 1
      } : x
    ));
    try { await toggleLike(p.id, p.liked); }
    catch {
      // revertir
      setItems(prev => prev.map(x =>
        x.id === p.id ? { ...x, liked: p.liked, likes_count: p.likes_count } : x
      ));
      Alert.alert("Error", "No se pudo cambiar el like.");
    }
  };

  const onOpenComments = async (p: Post) => {
    setSelected(p);
    setShowComments(true);
    try {
      const data = await listComments(p.id);
      setComments(data);
    } catch {
      setComments([]);
    }
  };

  const onShare = async (p: Post) => {
    try {
      await Share.share({
        title: "Compartir publicación",
        message: p.body || "Mira esta publicación",
      });
    } catch {}
  };

  const sendComment = async () => {
    if (!selected || !commentBody.trim()) return;
    try {
      await addComment(selected.id, commentBody.trim());
      setCommentBody("");
      const data = await listComments(selected.id);
      setComments(data);
      setItems(prev => prev.map(x =>
        x.id === selected.id ? { ...x, comments_count: data.length } : x
      ));
    } catch {
      Alert.alert("Error", "No se pudo comentar.");
    }
  };

  const Skeleton = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skelHeader}>
        <View style={styles.skelAvatar} />
        <View style={{ gap: 6, flex: 1 }}>
          <View style={styles.skelLineW80} />
          <View style={styles.skelLineW40} />
        </View>
      </View>
      <View style={styles.skelLineW100} />
      <View style={styles.skelLineW90} />
      <View style={styles.skelMedia} />
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 12, gap: 12, marginTop:25 }}>
      {initial && (
        <View style={{ gap: 12 }}>
          <Skeleton />
          <Skeleton />
        </View>
      )}

      {!initial && (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onToggleLike={onToggleLike}
              onOpenComments={onOpenComments}
              onShare={onShare}
            />
          )}
          ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 24 }}>Sin publicaciones aún</Text>}
        />
      )}

      {/* Modal comentarios */}
      <Modal visible={showComments} animationType="slide" onRequestClose={() => setShowComments(false)}>
        <View style={{ padding: 12, gap: 12, flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>Comentarios</Text>
          <FlatList
            data={comments}
            keyExtractor={(c) => String(c.id)}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <View style={styles.commentCard}>
                <Text style={{ fontWeight: "600" }}>{item.user?.name ?? "Usuario"}</Text>
                <Text>{item.body}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 12 }}>Sé el primero en comentar</Text>}
          />
          <TextInput
            placeholder="Escribe un comentario"
            value={commentBody}
            onChangeText={setCommentBody}
            style={styles.commentInput}
          />
          <Button title="Enviar" onPress={sendComment} />
          <Button title="Cerrar" onPress={() => setShowComments(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // skeletons
  skeletonCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  skelHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  skelAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e5e7eb" },
  skelLineW80: { height: 10, width: "60%", backgroundColor: "#e5e7eb", borderRadius: 6 },
  skelLineW40: { height: 10, width: "30%", backgroundColor: "#e5e7eb", borderRadius: 6 },
  skelLineW100: { height: 10, width: "100%", backgroundColor: "#e5e7eb", borderRadius: 6 },
  skelLineW90: { height: 10, width: "90%", backgroundColor: "#e5e7eb", borderRadius: 6 },
  skelMedia: { height: 180, width: "100%", backgroundColor: "#e5e7eb", borderRadius: 14 },

  commentCard: {
    padding: 10, backgroundColor: "#fff", borderRadius: 10, gap: 6,
  },
  commentInput: {
    borderWidth: 1, borderRadius: 10, padding: 10, borderColor: "#cbd5e1", backgroundColor: "#fff",
  },
});
