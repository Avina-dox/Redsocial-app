// /app/(tabs)/new.tsx  (o /app/(tabs)/new-poll.tsx)
import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView, Platform } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { createPoll } from "../../services/polls";
import { router } from "expo-router";

export default function NewPoll() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [closesAt, setClosesAt] = useState<Date | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [busy, setBusy] = useState(false);

  const setOpt = (i: number, val: string) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  const addOpt = () => setOptions((prev) => (prev.length < 10 ? [...prev, ""] : prev));

  const submit = async () => {
    if (!title.trim()) return Alert.alert("Encuesta", "Pon un título.");
    const opts = options.map((o) => o.trim()).filter(Boolean).slice(0, 10);
    if (opts.length < 2) return Alert.alert("Encuesta", "Mínimo 2 opciones.");
    setBusy(true);
    try {
      await createPoll({
        question: title.trim(),
        options: opts,
        description: description.trim() || null,
        closesAt: closesAt ?? null,
        requireClose: Boolean(closesAt),
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "No se pudo crear");
    } finally {
      setBusy(false);
    }
  };

  // ---- ANDROID: usar API imperativa (no await) para evitar issues en unmount
  const openAndroidPicker = (mode: "date" | "time") => {
    if (!DateTimePickerAndroid || typeof DateTimePickerAndroid.open !== "function") {
      Alert.alert("Fecha", "Selector no disponible.");
      if (mode === "date") setShowDate(false);
      if (mode === "time") setShowTime(false);
      return;
    }

    const base = closesAt || new Date(Date.now() + 3600 * 1000);

    DateTimePickerAndroid.open({
      value: base,
      mode,
      is24Hour: true,
      onChange: (_event, selected) => {
        if (!selected) {
          if (mode === "date") setShowDate(false);
          if (mode === "time") setShowTime(false);
          return;
        }
        const d = new Date(closesAt || new Date());
        if (mode === "date") {
          d.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        } else {
          d.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        }
        setClosesAt(d);
        if (mode === "date") setShowDate(false);
        if (mode === "time") setShowTime(false);
      },
    });
  };

  useEffect(() => {
    if (Platform.OS === "android" && showDate) openAndroidPicker("date");
  }, [showDate]);

  useEffect(() => {
    if (Platform.OS === "android" && showTime) openAndroidPicker("time");
  }, [showTime]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>Nueva encuesta</Text>

      <Text>Título</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Pregunta..."
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12 }}
      />

      <Text>Descripción (opcional)</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Detalles..."
        multiline
        numberOfLines={3}
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12 }}
      />

      <Text>Fecha de cierre (opcional)</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={() => setShowDate(true)}
          style={{ flex: 1, padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, alignItems: "center" }}
        >
          <Text>{closesAt ? closesAt.toLocaleDateString() : "Elegir fecha"}</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowTime(true)}
          style={{ width: 140, padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, alignItems: "center" }}
        >
          <Text>
            {closesAt ? closesAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Elegir hora"}
          </Text>
        </Pressable>
      </View>

      {Platform.OS === "ios" && showDate && (
        <DateTimePicker
          value={closesAt || new Date(Date.now() + 3600 * 1000)}
          mode="date"
          display="inline"
          onChange={(_e, d) => {
            setShowDate(false);
            if (d) {
              const base = closesAt || new Date();
              const nd = new Date(base);
              nd.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
              setClosesAt(nd);
            }
          }}
        />
      )}

      {Platform.OS === "ios" && showTime && (
        <DateTimePicker
          value={closesAt || new Date(Date.now() + 3600 * 1000)}
          mode="time"
          display="spinner"
          onChange={(_e, d) => {
            setShowTime(false);
            if (d) {
              const base = closesAt || new Date();
              const nd = new Date(base);
              nd.setHours(d.getHours(), d.getMinutes(), 0, 0);
              setClosesAt(nd);
            }
          }}
        />
      )}

      <Text>Opciones</Text>
      {options.map((o, idx) => (
        <TextInput
          key={idx}
          value={o}
          onChangeText={(t) => setOpt(idx, t)}
          placeholder={`Opción ${idx + 1}`}
          style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 8 }}
        />
      ))}
      <Pressable
        onPress={addOpt}
        style={{ padding: 12, borderWidth: 1, borderColor: "#6A2C75", borderRadius: 10, alignItems: "center" }}
      >
        <Text>+ Agregar opción</Text>
      </Pressable>

      <Pressable
        disabled={busy}
        onPress={submit}
        style={{ padding: 14, backgroundColor: "#6A2C75", borderRadius: 12, alignItems: "center", opacity: busy ? 0.7 : 1 }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>Crear encuesta</Text>
      </Pressable>
    </ScrollView>
  );
}
