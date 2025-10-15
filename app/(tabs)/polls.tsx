// app/(tabs)/polls.tsx
import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable, RefreshControl, Alert } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { listPolls, Poll } from "../../services/polls";

type StatusFilter = "all" | "open" | "closed";

export default function PollsList() {
  const [rows, setRows] = useState<Poll[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPage = async (pageNum: number, replace = false) => {
    setLoading(true);
    try {
      const params: any = { page: pageNum, per_page: 10 };
      if (status !== "all") params.status = status; // "open" o "closed"
      const { rows: newRows, meta: newMeta } = await listPolls(params);
      setMeta(newMeta);
      setRows((prev) => (replace ? newRows : [...prev, ...newRows]));
      setPage(pageNum);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "No se pudieron cargar las encuestas.";
      Alert.alert("Encuestas", msg);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPage(1, true);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (loading) return;
    const lastPage = meta?.last_page ?? 1;
    if (page < lastPage) fetchPage(page + 1);
  };

  useFocusEffect(
    useCallback(() => {
      fetchPage(1, true);
    }, [status])
  );

  const Row = ({ item }: { item: Poll }) => (
    <Pressable
      onPress={() => router.push(`/(tabs)/${item.id}`)}  // 👈 detalle dentro del grupo (tabs)
      style={{
        padding: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
      }}
    >
      <Text style={{ fontWeight: "700", fontSize: 16 }}>{item.title}</Text>
      {item.description ? <Text style={{ marginTop: 4, opacity: 0.8 }}>{item.description}</Text> : null}
      <View style={{ flexDirection: "row", marginTop: 8, gap: 12 }}>
        <Text style={{ opacity: 0.6 }}>{item.is_closed ? "Cerrada" : "Abierta"}</Text>
        <Text style={{ opacity: 0.6 }}>{item.options?.length ?? 0} opciones</Text>
      </View>
    </Pressable>
  );

  const Header = () => (
    <View style={{ padding: 16, gap: 8, flexDirection: "row" }}>
      {(["all", "open", "closed"] as StatusFilter[]).map((s) => {
        const active = status === s;
        return (
          <Pressable
            key={s}
            onPress={() => setStatus(s)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: active ? "#6A2C75" : "#e5e7eb",
              backgroundColor: active ? "#6A2C75" : "transparent",
            }}
          >
            <Text style={{ color: active ? "#fff" : "#111827", fontWeight: "600" }}>
              {s === "all" ? "Todas" : s === "open" ? "Abiertas" : "Cerradas"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const Empty = () => (
    <View style={{ padding: 24, alignItems: "center" }}>
      <Text style={{ opacity: 0.7, textAlign: "center" }}>
        {status === "open" ? "No hay encuestas abiertas."
          : status === "closed" ? "No hay encuestas cerradas."
          : "Aún no hay encuestas."}
      </Text>
      <Pressable
        onPress={onRefresh}
        style={{ marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderRadius: 10 }}
      >
        <Text>Recargar</Text>
      </Pressable>
    </View>
  );

  return (
    <FlatList
      data={rows}
      keyExtractor={(it) => String(it.id)}
      renderItem={Row}
      ListHeaderComponent={Header}
      ListEmptyComponent={!loading ? Empty : null}
      onEndReachedThreshold={0.4}
      onEndReached={loadMore}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListFooterComponent={loading ? <View style={{ padding: 16 }}><ActivityIndicator /></View> : null}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
}
