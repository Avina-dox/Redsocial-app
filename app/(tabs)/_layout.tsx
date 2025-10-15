// app/(tabs)/_layout.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  useColorScheme,
  LayoutChangeEvent,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

// Gradiente opcional (hace fallback si no existe)
let LinearGradient: any = View;
try {
  LinearGradient = require("expo-linear-gradient").LinearGradient;
} catch {}

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen name="new_post" options={{ title: "Nuevo" }} />
      <Tabs.Screen name="polls" options={{ title: "Encuestas" }} />
      {/* Rutas auxiliares dentro del grupo de tabs que no deben aparecer en la barra */}
      <Tabs.Screen name="map" options={{ href: null }} />
      <Tabs.Screen name="new" options={{ href: null }} />
    </Tabs>
  );
}

// ---- TabBar líquida ----
function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  if (!state?.routes) return null; // paracaídas

  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const insets = useSafeAreaInsets();
  const bottomSafe = Math.max(insets.bottom, 10);

  const routes = state.routes;

  const ICONS = useMemo(
    () =>
      ({
        index: "home",
        feed: "grid",
        new_post: "plus-circle",
        polls: "bar-chart-2",
      }) as Record<string, React.ComponentProps<typeof Feather>["name"]>,
    []
  );

  // medidas por tab para mover el blob
  const widthsRef = useRef<number[]>(Array(routes.length).fill(0));
  const offsetsRef = useRef<number[]>(Array(routes.length).fill(0));

  // Animated Values fuera del map
  const blobX = useRef(new Animated.Value(0)).current; // translateX (nativo)
  const blobW = useRef(new Animated.Value(60)).current; // width (JS)

  const scales = useRef(
    routes.map((_: any, i: number) => new Animated.Value(state.index === i ? 1 : 0.96))
  ).current;
  const opacities = useRef(
    routes.map((_: any, i: number) => new Animated.Value(state.index === i ? 1 : 0.8))
  ).current;

  const animateBlobToIndex = (i: number) => {
    const x = offsetsRef.current[i] + widthsRef.current[i] / 2 - 30;
    Animated.parallel([
      Animated.spring(blobX, {
        toValue: x,
        useNativeDriver: true, // SIEMPRE true para translateX
        stiffness: 220,
        damping: 24,
        mass: 0.8,
      }),
      Animated.timing(blobW, {
        toValue: Math.max(60, Math.min(84, widthsRef.current[i] * 0.7)),
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false, // width no soporta driver nativo
      }),
    ]).start();
  };

  const nearestVisible = (idx: number) => {
    if (!routes.length) return 0;
    const total = routes.length;
    const safe = Math.max(0, Math.min(idx, total - 1));
    const check = (i: number) => descriptors[routes[i]?.key]?.options?.href === null;
    if (!check(safe)) return safe;
    for (let step = 1; step < total; step++) {
      const left = safe - step;
      if (left >= 0 && !check(left)) return left;
      const right = safe + step;
      if (right < total && !check(right)) return right;
    }
    return 0;
  };

  // primer posicionamiento
  useEffect(() => {
    const id = setTimeout(() => animateBlobToIndex(nearestVisible(state.index)), 0);
    return () => clearTimeout(id);
  }, []);

  // cambios de pestaña
  useEffect(() => {
    const j = nearestVisible(state.index);
    animateBlobToIndex(j);
    routes.forEach((_: any, i: number) => {
      Animated.spring(scales[i], {
        toValue: j === i ? 1 : 0.96,
        useNativeDriver: true,
        stiffness: 220,
        damping: 18,
      }).start();
      Animated.timing(opacities[i], {
        toValue: j === i ? 1 : 0.8,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  }, [state.index]);

  // paleta
  const C = {
    labelOn: dark ? "#e0d7c2ff" : "#1E3A8A",
    labelOff: dark ? "#A3A3A3" : "#94A3B8",
    pillBgAndroid: dark ? "rgba(83, 89, 100, 0.8)" : "rgba(255,255,255,0.85)",
    borderOut: dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.45)",
    blob: dark ? "rgba(233,193,108,0.18)" : "rgba(30,58,138,0.12)",
    blobBorder: dark ? "rgba(233,193,108,0.55)" : "rgba(106,44,117,0.45)",
    shineTop: dark
      ? ["rgba(255,255,255,0.10)", "rgba(255,255,255,0)"]
      : ["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"],
    shineEdge: dark
      ? ["rgba(255,255,255,0.08)", "rgba(255,255,255,0)"]
      : ["rgba(255,255,255,0.26)", "rgba(255,255,255,0)"],
  };

  const onTabLayout = (i: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    offsetsRef.current[i] = x;
    widthsRef.current[i] = width;
    const j = nearestVisible(state.index);
    if (i === j) animateBlobToIndex(i);
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View style={[styles.wrapper, { paddingBottom: bottomSafe }]} pointerEvents="box-none">
        {/* píldora de vidrio */}
        <View style={styles.pillWrap}>
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={28}
              tint={dark ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
              style={styles.pill}
            />
          ) : (
            <View style={[styles.pill, { backgroundColor: C.pillBgAndroid }]} />
          )}
          <View
            style={[
              styles.pill,
              { borderWidth: StyleSheet.hairlineWidth, borderColor: C.borderOut },
            ]}
            pointerEvents="none"
          />
          {/* brillo superior */}
          <LinearGradient
            colors={C.shineTop as any}
            pointerEvents="none"
            style={[
              styles.pill,
              {
                height: 18,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                overflow: "hidden",
              },
            ]}
          />
          {/* luz lateral */}
          <LinearGradient
            colors={C.shineEdge as any}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            pointerEvents="none"
            style={[styles.pill, { opacity: 0.7 }]}
          />
        </View>

        {/* botones + blob */}
        <View style={styles.row}>
          {/* Separar animaciones nativas (translateX) y JS (width) en nodos distintos */}
          <Animated.View
            pointerEvents="none"
            style={[styles.blobTranslate, { transform: [{ translateX: blobX }] }]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.blob,
                {
                  width: blobW as any, // JS
                  backgroundColor: C.blob,
                  borderColor: C.blobBorder,
                },
              ]}
            />
          </Animated.View>
          {routes.map((route: any, i: number) => {
            // omitir rutas ocultas (href: null)
            const d = descriptors[route.key];
            if (d?.options?.href === null) return null;
            const isFocused = state.index === i;
            const { options } = d;
            const iconName = ICONS[route.name] || ("circle" as const);
            const bigCenter = route.name === "new_post";

            const onPress = () => {
              const ev = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !ev.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                onLayout={(e) => onTabLayout(i, e)}
                onPress={onPress}
                onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
                style={[styles.tabBtn, bigCenter && styles.centerBtn]}
                android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
              >
                <Animated.View
                  style={[
                    styles.iconWrap,
                    bigCenter && styles.iconWrapCenter,
                    { transform: [{ scale: scales[i] }], opacity: opacities[i] },
                  ]}
                >
                  <Feather
                    name={iconName}
                    size={bigCenter ? 32 : 24}
                    color={isFocused ? C.labelOn : C.labelOff}
                  />
                </Animated.View>
                {!bigCenter && (
                  <Text
                    style={[styles.label, { color: isFocused ? C.labelOn : C.labelOff }]}
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
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center" },
  pillWrap: {
    position: "absolute",
    bottom: 8,
    width: "100%",
    height: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: { position: "absolute", width: "90%", height: 64, borderRadius: 28 },
  row: {
    position: "relative",
    width: "90%",
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  blobTranslate: {
    position: "absolute",
    left: 0,
    top: 10,
    height: 44,
  },
  blob: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 55,
    
    borderRadius: 22,
    borderWidth: 1,
  },
  tabBtn: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center", gap: 6 },
  label: { fontSize: 12, fontWeight: "700" },
  iconWrap: {
    width: 48,
    height: 32,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  centerBtn: { transform: [{ translateY: -14 }] },
  iconWrapCenter: {
    width: 64,
    height: 64,
    borderRadius: 33,
    backgroundColor: "rgba(255,255,255,0.85)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
