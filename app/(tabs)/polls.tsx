import { useState } from "react";
import {
  View, Text, TextInput, Pressable, Alert, StyleSheet, ScrollView, Platform
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { createPoll } from "../../services/polls";

export default function NewPollScreen() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [saving, setSaving] = useState(false);

  const [useClose, setUseClose] = useState(true);   // 👈 si tu backend lo requiere, déjalo true por default
  const [date, setDate] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000)); // +1h
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const addOption = () => setOptions(prev => [...prev, ""]);
  const removeOption = (idx: number) =>
    setOptions(prev => prev.filter((_, i) => i !== idx));
  const updateOption = (idx: number, val: string) =>
    setOptions(prev => prev.map((o, i) => (i === idx ? val : o)));

  const onPickDate = (_: any, d?: Date) => {
    setShowDate(false);
    if (d) {
      // conserva hora previa
      const newD = new Date(date);
      newD.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
      setDate(newD);
    }
  };
  const onPickTime = (_: any, d?: Date) => {
    setShowTime(false);
    if (d) {
      // conserva fecha previa
      const newD = new Date(date);
      newD.setHours(d.getHours(), d.getMinutes(), 0, 0);
      setDate(newD);
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      await createPoll({
        question,
        options,
        closesAt: useClose ? date : null,
        requireClose: useClose, // fuerza validación si lo marcaste
      });
      Alert.alert("Encuesta", "Encuesta creada correctamente.");
      router.back();
    } catch (e: any) {
      Alert.alert("Encuesta", e?.message || "No se pudo crear la encuesta.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nueva encuesta</Text>

      <Text style={styles.label}>Pregunta</Text>
      <TextInput
        placeholder="¿Qué opinas de…?"
        value={question}
        onChangeText={setQuestion}
        style={styles.input}
      />

      <Text style={[styles.label, { marginTop: 12 }]}>Opciones</Text>
      {options.map((opt, idx) => (
        <View key={idx} style={styles.optionRow}>
          <TextInput
            placeholder={`Opción ${idx + 1}`}
            value={opt}
            onChangeText={(t) => updateOption(idx, t)}
            style={[styles.input, { flex: 1 }]}
          />
          {options.length > 2 && (
            <Pressable onPress={() => removeOption(idx)} style={styles.removeBtn}>
              <Text style={{ color: "#ef4444", fontWeight: "700" }}>—</Text>
            </Pressable>
          )}
        </View>
      ))}

      <Pressable onPress={addOption} style={styles.addBtn}>
        <Text style={styles.addBtnText}>＋ Agregar opción</Text>
      </Pressable>

      {/* Fecha de cierre */}
      <View style={{ marginTop: 16, gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={styles.label}>Fecha de cierre</Text>
          <Pressable
            onPress={() => setUseClose(v => !v)}
            style={[styles.toggle, useClose ? styles.toggleOn : styles.toggleOff]}
          >
            <Text style={{ color: useClose ? "#fff" : "#0f172a", fontWeight: "700" }}>
              {useClose ? "ON" : "OFF"}
            </Text>
          </Pressable>
        </View>

        {useClose && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={() => setShowDate(true)} style={[styles.smallBtn, { flex: 1 }]}>
              <Text style={styles.smallBtnText}>
                {date.toLocaleDateString()}
              </Text>
            </Pressable>
            <Pressable onPress={() => setShowTime(true)} style={[styles.smallBtn, { width: 120 }]}>
              <Text style={styles.smallBtnText}>
                {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </Pressable>
          </View>
        )}

        {showDate && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={onPickDate}
          />
        )}
        {showTime && (
          <DateTimePicker
            value={date}
            mode="time"
            is24Hour
            display="default"
            onChange={onPickTime}
          />
        )}
      </View>

      <Pressable
        onPress={submit}
        style={[styles.saveBtn, saving && { opacity: 0.7 }]}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? "Guardando..." : "Crear encuesta"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 6, color: "#0f172a" },
  label: { fontWeight: "700", color: "#334155" },
  input: {
    borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff",
  },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  removeBtn: {
    width: 40, height: 44, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fff1f2", borderRadius: 10,
  },
  addBtn: {
    marginTop: 6, alignSelf: "flex-start",
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#e0ecff", borderWidth: 1, borderColor: "#bfdbfe",
  },
  addBtnText: { color: "#1d4ed8", fontWeight: "700" },
  // cierre
  toggle: {
    width: 64, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  toggleOn: { backgroundColor: "#2563eb", borderColor: "#1d4ed8" },
  toggleOff: { backgroundColor: "#f8fafc", borderColor: "#cbd5e1" },

  smallBtn: {
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#fff",
  },
  smallBtnText: { fontWeight: "700", color: "#0f172a" },

  saveBtn: {
    marginTop: 18, backgroundColor: "#2563eb", borderRadius: 12,
    paddingVertical: 12, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  saveBtnText: { color: "#fff", fontWeight: "800" },
});
