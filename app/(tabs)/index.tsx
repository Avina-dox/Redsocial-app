import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>¡Bienvenido!</Text> 
        
        <Text style={styles.subtitle}>
          Hola {user?.name ?? "vecino"}, esta es la pantalla principal de la app.
        </Text>
        <Text style={styles.paragraph}>
          Usa las pestañas inferiores para navegar por las distintas secciones: revisa
          las últimas publicaciones del barrio, crea nuevos avisos o participa en
          las encuestas comunitarias. Mantente pendiente de las alertas y recuerda
          que puedes cerrar sesión desde el ícono superior derecho.
        </Text>
        <Text style={styles.paragraph}>
          Si acabas de instalar la aplicación y no ves contenido aún, dirígete al
          tab "Feed" para sincronizarte con el servidor. También puedes crear tu
          primera publicación desde el botón central.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    gap: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    marginTop:100,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 16,
    color: "#334155",
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
  },
});