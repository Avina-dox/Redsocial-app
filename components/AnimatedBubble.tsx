// app/components/AnimatedBubble.tsx
import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

type SweepMode = "loop" | "trigger";

export default function AnimatedBubble({
  width,
  height = 44,
  borderColor,
  fillColor,
  highlightBase = "rgba(255,255,255,0.55)",
  highlightFade = "rgba(255,255,255,0)",
  innerStroke = "rgba(255,255,255,0.25)",
  // NUEVO:
  isActive = true,
  sweepMode = "loop",
  sweepKey,
}: {
  width: Animated.Value | number;
  height?: number;
  borderColor: string;
  fillColor: string;
  highlightBase?: string;
  highlightFade?: string;
  innerStroke?: string;
  isActive?: boolean;
  sweepMode?: SweepMode;
  sweepKey?: any; // cambia para disparar una pasada cuando sweepMode="trigger"
}) {
  const wAnim = useRef(new Animated.Value(60)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const sweepLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Sincroniza width (JS-driver)
  useEffect(() => {
    if (width instanceof Animated.Value) {
      const id = width.addListener(({ value }) => wAnim.setValue(value));
      return () => width.removeListener(id);
    } else {
      wAnim.setValue(width as number);
    }
  }, [width]);

  // ---- BARRIDO (sweep) ----
  // a) Modo loop: corre solo si isActive=true
  useEffect(() => {
    if (sweepMode !== "loop") return;
    // detener si existía
    sweepLoopRef.current?.stop();
    if (!isActive) {
      sweep.stopAnimation();
      sweep.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    );
    sweepLoopRef.current = loop;
    loop.start();
    return () => {
      loop.stop();
    };
  }, [isActive, sweepMode]);

  // b) Modo trigger: una sola pasada cuando cambia sweepKey (si isActive=true)
  useEffect(() => {
    if (sweepMode !== "trigger") return;
    // si no activo, resetea
    if (!isActive) {
      sweep.stopAnimation();
      sweep.setValue(0);
      return;
    }
    // una pasada (0 -> 1 -> 0)
    sweep.stopAnimation();
    sweep.setValue(0);
    Animated.sequence([
      Animated.timing(sweep, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(sweep, {
        toValue: 0,
        duration: 0,
        useNativeDriver: false,
      }),
    ]).start();
  }, [sweepKey, isActive, sweepMode]);

  // ---- PULSO (native) — solo si activo ----
  useEffect(() => {
    // detén cualquier loop previo
    pulseLoopRef.current?.stop();

    if (!isActive) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoopRef.current = loop;
    loop.start();

    return () => {
      loop.stop();
    };
  }, [isActive]);

  const scaleY = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] });
  const translateY = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, -0.5] });

  return (
    // Padre: solo tamaño (JS). No meter transforms aquí.
    <Animated.View style={{ height, width: wAnim, pointerEvents: "none" }}>
      {/* Hijo: transforms nativas */}
      <Animated.View style={{ flex: 1, transform: [{ translateY }, { scaleY }] }}>
        {/* Blur */}
        {Platform.OS === "ios" ? (
          <BlurView intensity={20} tint="systemChromeMaterial" style={styles.blur} />
        ) : (
          <View style={[styles.blur, { backgroundColor: "transparent" }]} />
        )}

        {/* Base */}
        <View style={[styles.base, { backgroundColor: fillColor, borderColor }]} />

        {/* Borde interior */}
        <View style={[styles.inner, { borderColor: innerStroke }]} />

        {/* Barrido de brillo */}
        <Animated.View
          style={[
            styles.sweep,
            {
              transform: [
                {
                  translateX: sweep.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 100],
                  }),
                },
                { skewX: "-12deg" },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[highlightFade, highlightBase, highlightFade]}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 0.7 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Brillo superior */}
        <LinearGradient
          colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.topShine}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  blur: {
    position: "absolute",
    inset: 0,
    borderRadius: 80,
  },
  base: {
    position: "absolute",
    inset: 0,
    borderRadius: 80,
    borderWidth: 1.9,
  },
  inner: {
    position: "absolute",
    inset: 1.5,
    borderRadius: 80,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sweep: {
    position: "absolute",
    inset: 0,
    borderRadius: 80,
    overflow: "hidden",
  },
  topShine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 18,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
  },
});
