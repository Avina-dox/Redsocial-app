// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import React, { useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

type TabBarProps = React.ComponentProps<typeof Tabs>["tabBar"];

export default function RootLayout() {
  // Ocultamos la tabBar de react-navigation para usar la personalizada
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      {/* Nombres deben coincidir con tus archivos en app/(tabs) */}
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen name="new_post" options={{ title: "Nuevo" }} />
      <Tabs.Screen name="polls" options={{ title: "Encuestas" }} />
      <Tabs.Screen name="two" options={{ title: "Perfil" }} />
    </Tabs>
  );
}

const FloatingTabBar: TabBarProps = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomSafe = Math.max(insets.bottom, 12);

  const routes = state.routes;

  const ICONS = useMemo(
    () => ({
      index: "home",
      feed: "grid",
      new_post: "plus-circle",
      polls: "bar-chart-2",
      two: "user",
    }) as Record<string, React.ComponentProps<typeof Feather>["name"]>,
    []
  );

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        pointerEvents="box-none"
        style={[
          styles.wrapper,
          {
            paddingBottom: bottomSafe,
          },
        ]}
      >
        {/* Fondo borroso/flotante */}
        {Platform.OS === "ios" ? (
          <BlurView intensity={28} tint="systemChromeMaterialDark" style={styles.pill} />
        ) : (
          <View style={[styles.pill, styles.pillAndroid]} />
        )}

        {/* Botones */}
        <View style={styles.row}>
          {routes.map((route, index) => {
            const isFocused = state.index === index;
            const { options } = descriptors[route.key];

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            // icono
            const iconName =
              ICONS[route.name] || ("circle" as React.ComponentProps<typeof Feather>["name"]);

            // animaciones sutiles
            const scale = new Animated.Value(isFocused ? 1 : 0.96);
            const opacity = new Animated.Value(isFocused ? 1 : 0.7);
            Animated.spring(scale, { toValue: isFocused ? 1 : 0.96, useNativeDriver: true }).start();
            Animated.timing(opacity, { toValue: isFocused ? 1 : 0.7, duration: 200, useNativeDriver: true }).start();

            const bigCenter =
              route.name === "new_post"; // botón central más prominente

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[
                  styles.tabBtn,
                  bigCenter && styles.centerBtn,
                ]}
              >
                <Animated.View
                  style={[
                    styles.iconWrap,
                    bigCenter && styles.iconWrapCenter,
                    { transform: [{ scale }], opacity },
                  ]}
                >
                  <Feather
                    name={iconName}
                    size={bigCenter ? 30 : 22}
                    color={isFocused ? "#1d4ed8" : "#94a3b8"}
                  />
                </Animated.View>
                {!bigCenter && (
                  <Text
                    style={[
                      styles.label,
                      { color: isFocused ? "#1d4ed8" : "#94a3b8" },
                    ]}
                    numberOfLines={1}
                  >
                    {options.title ?? route.name}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  pill: {
    position: "absolute",
    bottom: 8,
    width: "90%",
    borderRadius: 28,
    height: 64,
  },
  pillAndroid: {
    backgroundColor: "rgba(17, 24, 39, 0.8)", // slate-900/80
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  row: {
    position: "relative",
    width: "90%",
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabBtn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
  },
  iconWrap: {
    width: 40,
    height: 34,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  // Botón central (nuevo post) más grande y elevado
  centerBtn: {
    transform: [{ translateY: -12 }],
  },
  iconWrapCenter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#eef2ff", // indigo-50
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
