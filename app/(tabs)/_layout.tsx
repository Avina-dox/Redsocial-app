// app/(tabs)/_layout.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import AnimatedBubble from "../../components/AnimatedBubble";

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

// Gradiente opcional (fallback si no existe)
let LinearGradient: any = View;
try {
  LinearGradient = require("expo-linear-gradient").LinearGradient;
} catch {}

export default function RootLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(p) => <FloatingTabBar {...p} />}>
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen name="new_post" options={{ title: "Nuevo" }} />
      <Tabs.Screen name="polls" options={{ title: "Encuestas" }} />
      {/* Rutas auxiliares (ocultas en tab bar) */}
      <Tabs.Screen name="map" options={{ href: null }} />
      <Tabs.Screen name="new" options={{ href: null }} />
    </Tabs>
  );
}

// ---- TabBar líquida con toggle ----
function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  if (!state?.routes) return null;

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

  // ---- Animación mostrar/ocultar barra ----
  const [hidden, setHidden] = useState(false);
  const barY = useRef(new Animated.Value(0)).current; // 0 visible / 1 oculto
  const toggleBar = () => {
    const to = hidden ? 0 : 1;
    setHidden(!hidden);
    Animated.timing(barY, {
      toValue: to,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };
  const barTranslate = barY.interpolate({ inputRange: [0, 1], outputRange: [0, 110] });
  const barOpacity = barY.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  // medidas por tab para mover el blob
  const widthsRef = useRef<number[]>(Array(routes.length).fill(0));
  const offsetsRef = useRef<number[]>(Array(routes.length).fill(0));

  // Animated Values blob (posición y ancho) — ambos JS-driven
  const blobX = useRef(new Animated.Value(20)).current;  // centro del tab (JS)
  const blobW = useRef(new Animated.Value(60)).current;  // ancho variable (JS)

  const scales = useRef(routes.map((_: any, i: number) => new Animated.Value(state.index === i ? 1 : 0.75))).current;
  const opacities = useRef(routes.map((_: any, i: number) => new Animated.Value(state.index === i ? 1 : 0.8))).current;

  // --- Visibilidad y mediciones ---
  const visibleIdxs = useMemo(
    () => routes.map((_, i) => i).filter(i => descriptors[routes[i]?.key]?.options?.href !== null),
    [routes, descriptors]
  );
  const measuredFlags = useRef<boolean[]>(Array(routes.length).fill(false));
  const initDone = useRef(false); // ya hicimos la animación inicial con medidas

  const allVisibleMeasured = () => visibleIdxs.every(i => measuredFlags.current[i]);

  // helper: clamp ancho objetivo
  const clampWidth = (w: number) => Math.max(60, Math.min(96, w));

  // 🎯 Animación principal + “squish”
  const animateBlobToIndex = (i: number, overshoot = 18) => {
    const centerX = offsetsRef.current[i] + widthsRef.current[i] / 2;
    const targetW = clampWidth(widthsRef.current[i] * 0.7);
    const stretchW = clampWidth(targetW + overshoot);

    Animated.sequence([
      // Estira rápido (squish)
      Animated.timing(blobW, {
        toValue: stretchW,
        duration: 110,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      // Mueve al centro y vuelve al ancho objetivo
      Animated.parallel([
        Animated.spring(blobX, {
          toValue: centerX,
          useNativeDriver: false, // JS para combinar con blobW en subtract(...)
          stiffness: 200,
          damping: 10,
          mass: 0.8,
        }),
        Animated.timing(blobW, {
          toValue: targetW,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  };

  const nearestVisible = (idx: number) => {
    if (!routes.length) return 0;
    const total = routes.length;
    const safe = Math.max(0, Math.min(idx, total - 1));
    const isHidden = (i: number) => descriptors[routes[i]?.key]?.options?.href === null;
    if (!isHidden(safe)) return safe;
    for (let step = 1; step < total; step++) {
      const left = safe - step;
      if (left >= 0 && !isHidden(left)) return left;
      const right = safe + step;
      if (right < total && !isHidden(right)) return right;
    }
    return 0;
  };

  // cambios de pestaña (después de medir)
  useEffect(() => {
    if (!initDone.current) return;
    const j = nearestVisible(state.index);
    // Overshoot un poco mayor si es el botón central
    const isCenter = routes[j]?.name === "new_post";
    animateBlobToIndex(j, isCenter ? 22 : 18);

    routes.forEach((_: any, i: number) => {
      Animated.spring(scales[i], {
        toValue: j === i ? 1 : 0.75,
        useNativeDriver: true,
        stiffness: 190,
        damping: 18,
      }).start();
      Animated.timing(opacities[i], {
        toValue: j === i ? 1 : 0.8,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  // --- PALETA con Liquid Glass ---
  const C = {
    labelOn: dark ? "#e0d7c2ff" : "#1E3A8A",
    labelOff: dark ? "#A3A3A3" : "#94A3B8",
    pillBgAndroid: dark ? "rgba(83, 89, 100, 0.8)" : "rgba(255,255,255,0.85)",
    borderOut: dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.45)",
    blob: dark ? "rgba(233,193,108,0.18)" : "rgba(30,58,138,0.12)",
    blobBorder: dark ? "rgba(233,193,108,0.55)" : "rgba(71, 78, 70, 0.45)",
    shineTop: dark ? ["rgba(255,255,255,0.10)", "rgba(255,255,255,0)"] : ["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"],
    shineEdge: dark ? ["rgba(255,255,255,0.08)", "rgba(255,255,255,0)"] : ["rgba(255,255,255,0.26)", "rgba(255,255,255,0)"],
    glassFill: dark
      ? ["rgba(30,32,38,0.70)", "rgba(30,32,38,0.38)", "rgba(30,32,38,0.22)"]
      : ["rgba(255,255,255,0.66)", "rgba(255,255,255,0.34)", "rgba(255,255,255,0.16)"],
    glassIridescence: dark
      ? ["rgba(99,102,241,0.20)", "rgba(236,72,153,0.12)", "rgba(20,184,166,0.10)"]
      : ["rgba(59,130,246,0.14)", "rgba(244,114,182,0.10)", "rgba(45,212,191,0.10)"],
    glassStrokeInner: dark ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.75)",
    brandHalo: dark ? ["rgba(233,193,108,0.20)", "rgba(233,193,108,0)"] : ["rgba(30,58,138,0.18)", "rgba(30,58,138,0)"],
  };

  const onTabLayout = (i: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    offsetsRef.current[i] = x;
    widthsRef.current[i] = width;
    measuredFlags.current[i] = true;

    // Si ya medimos todos los visibles, hacemos el primer posicionamiento (con squish)
    if (!initDone.current && allVisibleMeasured()) {
      initDone.current = true;
      const j = nearestVisible(state.index);
      const isCenter = routes[j]?.name === "new_post";
      animateBlobToIndex(j, isCenter ? 22 : 18);

      // Ajustamos escalas/opacidades iniciales
      routes.forEach((_: any, idx: number) => {
        const on = j === idx;
        scales[idx].setValue(on ? 1 : 0.75);
        opacities[idx].setValue(on ? 1 : 0.8);
      });
    }
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {/* Botón flotante para RE-abrir cuando está oculta */}
      {hidden && (
        <View pointerEvents="box-none" style={[styles.reopenWrap, { bottom: bottomSafe + 8 }]}>
          <Pressable onPress={toggleBar} style={styles.reopenBtn}>
            {Platform.OS === "ios" ? (
              <BlurView intensity={26} tint={dark ? "systemChromeMaterialDark" : "systemChromeMaterialLight"} style={styles.reopenInner} />
            ) : (
              <View style={[styles.reopenInner, { backgroundColor: C.pillBgAndroid }]} />
            )}
            <LinearGradient colors={C.glassFill as any} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.reopenInner} pointerEvents="none" />
            <LinearGradient colors={C.glassIridescence as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.reopenInner} pointerEvents="none" />
            <Feather name="chevrons-up" size={22} color={dark ? "#e0d7c2ff" : "#1E3A8A"} style={styles.reopenIcon} />
          </Pressable>
        </View>
      )}

      {/* Contenedor animado de la barra */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.wrapper, { paddingBottom: bottomSafe, transform: [{ translateY: barTranslate }], opacity: barOpacity }]}
      >
        {/* Píldora de vidrio */}
        <View style={styles.pillWrap}>
          {Platform.OS === "ios" ? (
            <BlurView intensity={28} tint={dark ? "systemChromeMaterialDark" : "systemChromeMaterialLight"} style={styles.pill} />
          ) : (
            <View style={[styles.pill, { backgroundColor: C.pillBgAndroid }]} />
          )}

          <LinearGradient colors={C.glassFill as any} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} pointerEvents="none" style={styles.pill} />
          <LinearGradient colors={C.glassIridescence as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={styles.pill} />

          <View style={[styles.pill, { borderWidth: StyleSheet.hairlineWidth, borderColor: C.borderOut }]} pointerEvents="none" />
          <View style={[styles.pillInset, { borderWidth: StyleSheet.hairlineWidth, borderColor: C.glassStrokeInner }]} pointerEvents="none" />

          <LinearGradient colors={C.brandHalo as any} start={{ x: 0.5, y: 0.1 }} end={{ x: 0.5, y: 0.9 }} pointerEvents="none" style={styles.pill} />
          <LinearGradient
            colors={dark ? ["rgba(255,255,255,0.10)", "rgba(255,255,255,0)"] : ["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]}
            pointerEvents="none"
            style={[styles.pill, { height: 18, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, overflow: "hidden" }]}
          />
          <LinearGradient colors={C.shineEdge as any} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} pointerEvents="none" style={[styles.pill, { opacity: 0.7 }]} />

          {/* Botón de ocultar/mostrar (ícono de ojo) */}
          <Pressable onPress={toggleBar} hitSlop={12} style={styles.hideBtn}>
            <Feather name={hidden ? "eye" : "eye-off"} size={18} color={dark ? "#e0d7c2ff" : "#1E3A8A"} />
          </Pressable>
        </View>

        {/* botones + burbuja */}
        <View
          style={styles.row}
          onLayout={() => {
            // invalidamos mediciones ante rotación/cambio tamaño
            measuredFlags.current = Array(routes.length).fill(false);
            initDone.current = false;
          }}
        >
          {/* Burbuja centrada: translateX = centerX - (width/2) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.blobTranslate,
              { transform: [{ translateX: Animated.subtract(blobX, Animated.divide(blobW, 2)) }] },
            ]}
          >
            <AnimatedBubble
              width={blobW}
              height={44}
              fillColor={C.blob}
              borderColor={C.blobBorder}
              innerStroke={dark ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.70)"}
              highlightBase={dark ? "rgba(255, 255, 255, 0)" : "rgba(255, 255, 255, 0)"}
              // controla brillo/pulso
              isActive={!hidden}
              sweepMode="trigger"
              sweepKey={state.index}
            />
          </Animated.View>

          {routes.map((route: any, i: number) => {
            const d = descriptors[route.key];
            if (d?.options?.href === null) return null;
            const isFocused = state.index === i;
            const { options } = d;
            const iconName = ICONS[route.name] || ("circle" as const);
            const bigCenter = route.name === "new_post";

            const onPress = () => {
              const ev = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!isFocused && !ev.defaultPrevented) navigation.navigate(route.name, route.params);
            };

            return (
              <Pressable
                key={route.key}
                onLayout={(e) => onTabLayout(i, e)}
                onPress={onPress}
                onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
                style={[styles.tabBtn, bigCenter && styles.centerBtn]}
                android_ripple={{ color: "rgba(211, 40, 40, 0.06)", borderless: true }}
              >
                <Animated.View
                  style={[
                    styles.iconWrap,
                    bigCenter && {
                      ...styles.iconWrapCenter,
                      backgroundColor: dark ? "rgba(83, 89, 100, 0.8)" : "rgba(255,255,255,0.85)",
                      borderColor: dark ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.75)",
                    },
                    { transform: [{ scale: scales[i] }], opacity: opacities[i] },
                  ]}
                >
                  <Feather name={iconName} size={bigCenter ? 32 : 24} color={isFocused ? C.labelOn : C.labelOff} />
                </Animated.View>
                {!bigCenter && (
                  <Text style={[styles.label, { color: isFocused ? C.labelOn : C.labelOff }]} numberOfLines={1}>
                    {options.title ?? route.name}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", left: 0, right: 0, bottom: 15, alignItems: "center" },

  // Botón flotante para re-abrir
  reopenWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  reopenBtn: { width: 54, height: 54, borderRadius: 28, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  reopenInner: { ...StyleSheet.absoluteFillObject, borderRadius: 28 },
  reopenIcon: { position: "absolute" },

  pillWrap: { position: "absolute", bottom: 8, width: "100%", height: 70, alignItems: "center", justifyContent: "center" },
  pill: { position: "absolute", width: "90%", height: 80, borderRadius: 28 },
  pillInset: { position: "absolute", width: "89%", height: 72, borderRadius: 24 },

  // Botón de ocultar (esquina superior derecha de la píldora)
  hideBtn: { position: "absolute", right: "8%", top: -59, width: 28, height: 28, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  row: { position: "relative", width: "90%", height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },

  // contenedor de la burbuja
  blobTranslate: { position: "absolute", left: 0, top: 10, height: 44 },

  tabBtn: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center", gap: 6 },
  label: { fontSize: 12, fontWeight: "700" },
  iconWrap: { width: 48, height: 48, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  centerBtn: { transform: [{ translateY: -14 }] },
  iconWrapCenter: {
    width: 64,
    height: 64,
    borderRadius: 33,
    shadowColor: "#0a0a0aa6",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
