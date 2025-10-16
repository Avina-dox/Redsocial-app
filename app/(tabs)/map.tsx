// app/(tabs)/map.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, Pressable, Alert, TextInput, Modal, ScrollView, ActivityIndicator } from "react-native";
import MapView, { Marker, MapPressEvent, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import { createReport, listReports, Report, TTL_TOKENS } from "../../services/reports";

type Coords = { lat: number; lng: number };

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [hasPerms, setHasPerms] = useState<boolean | null>(null);
  const [myLoc, setMyLoc] = useState<Coords | null>(null);

  // Puntos existentes
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Punto a crear
  const [point, setPoint] = useState<Coords | null>(null);

  // Panel crear
  const [open, setOpen] = useState(false);
  const [ttlToken, setTtlToken] = useState<typeof TTL_TOKENS[number]["token"]>("24h");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  // Permisos + centrado
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPerms(status === "granted");
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setMyLoc(coords);
        mapRef.current?.animateCamera({
          center: { latitude: coords.lat, longitude: coords.lng },
          zoom: 15,
        });
      }
    })();
  }, []);

  // Cargar reportes
  const fetchReports = useCallback(async () => {
    try {
      setLoadingReports(true);
      const rows = await listReports();
      setReports(rows);
    } catch (e: any) {
      console.log("load reports error", e?.message);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const onRegionChangeComplete = (_region: Region) => {
    // si tuvieras bbox en el backend, aquí podrías recargar por zona
  };

  const onLongPressMap = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPoint({ lat: latitude, lng: longitude });
    setOpen(true);
  };

  const moveToMe = async () => {
    try {
      if (!hasPerms) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setHasPerms(status === "granted");
        if (status !== "granted") return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setMyLoc(coords);
      mapRef.current?.animateCamera({
        center: { latitude: coords.lat, longitude: coords.lng },
        zoom: 16,
      });
    } catch {
      Alert.alert("Ubicación", "No se pudo obtener tu ubicación.");
    }
  };

  const sendReport = async () => {
    if (!point) return Alert.alert("Reporte", "Selecciona un punto (mantén presionado en el mapa).");
    if (!title.trim()) return Alert.alert("Reporte", "Escribe un título.");

    setBusy(true);
    try {
      const newRep = await createReport({
        title: title.trim(),
        description: description.trim() || null,
        lat: point.lat,
        lng: point.lng,
        ttl: ttlToken, // 👈 token string requerido por backend
      });

      setReports((prev) => [newRep, ...prev]);

      // Reset UI
      setOpen(false);
      setTitle("");
      setDescription("");
      setTtlToken("24h");
      // setPoint(null); // si quieres limpiar el pin
      Alert.alert("Listo", "Reporte creado.");
    } catch (e: any) {
      Alert.alert("Error", String(e?.message || "No se pudo crear el reporte."));
    } finally {
      setBusy(false);
    }
  };

  if (hasPerms === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Preparando mapa…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        onLongPress={onLongPressMap}
        onRegionChangeComplete={onRegionChangeComplete}
        initialRegion={{
          latitude: myLoc?.lat ?? 19.432608,
          longitude: myLoc?.lng ?? -99.133209,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Mi ubicación */}
        {myLoc ? (
          <Marker
            coordinate={{ latitude: myLoc.lat, longitude: myLoc.lng }}
            title="Mi ubicación"
            pinColor="#0ea5e9"
          />
        ) : null}

        {/* Reportes existentes */}
        {reports.map((r) => (
          <Marker
            key={`rep-${r.id}`}
            coordinate={{ latitude: r.lat, longitude: r.lng }}
            title={r.title}
            description={r.description ?? undefined}
          />
        ))}

        {/* Punto para crear */}
        {point ? (
          <Marker
            coordinate={{ latitude: point.lat, longitude: point.lng }}
            title="Nuevo reporte"
            description="Arrástrame para ajustar"
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setPoint({ lat: latitude, lng: longitude });
            }}
          />
        ) : null}
      </MapView>

      {/* Botón centrar */}
      <Pressable
        onPress={moveToMe}
        style={{
          position: "absolute",
          right: 12,
          bottom: 100,
          backgroundColor: "#fff",
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          elevation: 2,
        }}
      >
        <Text style={{ fontWeight: "600" }}>📍 Centrar</Text>
      </Pressable>

      {/* Hint */}
      {!point ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 100,
            backgroundColor: "#111827cc",
            padding: 10,
            borderRadius: 10,
            animationDuration
: 100,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>
            Mantén presionado en el mapa para seleccionar el punto del reporte.
          </Text>
        </View>
      ) : null}

      {/* Panel crear */}
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#00000055" }}>
          <View
            style={{
              backgroundColor: "#fff",
              padding: 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "80%",
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              <View style={{ width: 40, height: 5, backgroundColor: "#e5e7eb", borderRadius: 999 }} />
            </View>

            <ScrollView contentContainerStyle={{ gap: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: "700" }}>Nuevo reporte</Text>
              {point ? (
                <Text style={{ opacity: 0.7 }}>
                  Ubicación: {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                </Text>
              ) : null}

              <Text>Título</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Robo / Incidente…"
                style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 10 }}
              />

              <Text>Descripción (opcional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Detalles…"
                multiline
                numberOfLines={3}
                style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 10 }}
              />

              <Text>Duración (TTL)</Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {TTL_TOKENS.map((p) => {
                  const active = ttlToken === p.token;
                  return (
                    <Pressable
                      key={p.token}
                      onPress={() => setTtlToken(p.token)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: active ? "#6A2C75" : "#ddd",
                        backgroundColor: active ? "#6A2C75" : "#fff",
                      }}
                    >
                      <Text style={{ color: active ? "#fff" : "#111827", fontWeight: "600" }}>{p.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                <Pressable
                  onPress={() => setOpen(false)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    alignItems: "center",
                  }}
                >
                  <Text>Cancelar</Text>
                </Pressable>

                <Pressable
                  disabled={busy}
                  onPress={sendReport}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: busy ? "#a78bfa" : "#6A2C75",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {busy ? "Enviando…" : "Crear reporte"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
