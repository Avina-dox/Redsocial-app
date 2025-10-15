// app/(tabs)/[id].tsx
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { getPoll, votePoll } from "../../services/polls";

export default function PollDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const pollId = Number(id);
  const [poll, setPoll] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!pollId) return;
    const data = await getPoll(pollId);
    setPoll(data);
  };

  useEffect(() => { load(); }, [pollId]);

  const handleVote = async (optionId: number) => {
    if (poll.is_closed) return Alert.alert("Encuesta", "Esta encuesta está cerrada.");
    setBusy(true);
    try {
      await votePoll(poll.id, optionId);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "No se pudo votar.");
    } finally {
      setBusy(false);
    }
  };

  if (!poll) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>{poll.title}</Text>
      {poll.description ? <Text style={{ opacity: 0.7, marginTop: 4 }}>{poll.description}</Text> : null}
      {poll.closes_at ? (
        <Text style={{ opacity: 0.6, marginTop: 6 }}>
          Cierra: {new Date(poll.closes_at).toLocaleString()}
        </Text>
      ) : null}

      <View style={{ marginTop: 16, gap: 8 }}>
        {poll.options.map((opt: any) => {
          const selected = poll.user_vote_option_id === opt.id;
          return (
            <Pressable
              key={opt.id}
              disabled={busy}
              onPress={() => handleVote(opt.id)}
              style={{
                padding: 12,
                borderWidth: 1,
                borderColor: selected ? "#6A2C75" : "#ddd",
                borderRadius: 10,
                backgroundColor: selected ? "#6A2C7510" : "#fff",
              }}
            >
              <Text style={{ fontWeight: "600" }}>{opt.text}</Text>
              <Text style={{ opacity: 0.6 }}>Votos: {opt.votes_count ?? 0}</Text>
              {selected ? <Text style={{ marginTop: 4 }}>✅ Tu voto</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
