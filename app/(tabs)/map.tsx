import MapView, { Marker, MapPressEvent } from "react-native-maps";
import { useEffect, useState } from "react";
import { View, TextInput, Button, Alert, Modal, Text } from "react-native";
import { listReports, createReport, Report } from "../../services/reports";

export default function ReportsMap() {
  const [reports, setReports] = useState<Report[]>([]);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);

  const load = async () => {
    try { setReports(await listReports()); }
    catch { Alert.alert("Error", "No se pudieron cargar los reportes."); }
  };
  useEffect(() => { load(); }, []);

  const onLongPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setDraft({ lat: latitude, lng: longitude });
    setModal(true);
  };

  const submit = async () => {
    if (!draft || !title.trim()) return;
    try {
      await createReport({ title: title.trim(), description: desc.trim(), lat: draft.lat, lng: draft.lng });
      setModal(false);
      setTitle(""); setDesc(""); setDraft(null);
      await load();
    } catch {
      Alert.alert("Error", "No se pudo crear el reporte.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{ latitude: 19.4326, longitude: -99.1332, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
        onLongPress={onLongPress}
      >
        {reports.map(r => (
          <Marker key={r.id} coordinate={{ latitude: r.lat, longitude: r.lng }} title={r.title} />
        ))}
      </MapView>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={{ flex:1, backgroundColor: "#0006", justifyContent:"center", padding: 16 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "700" }}>Nuevo reporte</Text>
            <TextInput placeholder="Título" value={title} onChangeText={setTitle} style={{ borderWidth:1, borderRadius:8, padding:10 }} />
            <TextInput placeholder="Descripción (opcional)" value={desc} onChangeText={setDesc} style={{ borderWidth:1, borderRadius:8, padding:10 }} />
            <Button title="Guardar" onPress={submit} />
            <Button title="Cancelar" onPress={() => setModal(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
