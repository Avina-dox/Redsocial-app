// components/SocialSecurityBg.tsx (no SVG)
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  isDark: boolean;
};

export default function SocialSecurityBg({ isDark }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ])
    );
    bob.start();
    return () => {
      loop.stop();
      bob.stop();
    };
  }, []);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  const colors = isDark
    ? {
        node: "rgba(255,255,255,0.4)",
        ring: "rgba(255,255,255,0.7)",
        ringSoft: "rgba(255,255,255,0.35)",
        orb: "rgba(52,199,89,0.35)", // verde salud
        orb2: "rgba(0,212,255,0.35)",
      }
    : {
        node: "rgba(0,0,0,0.35)",
        ring: "rgba(0,0,0,0.75)",
        ringSoft: "rgba(0,0,0,0.3)",
        orb: "rgba(52,199,89,0.28)",
        orb2: "rgba(0,212,255,0.28)",
      };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY }] }]} pointerEvents="none">
      {/* Glow central en forma de círculo (pulso) */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: colors.orb,
            transform: [{ scale }],
          },
        ]}
      />

      {/* Segundo glow azulado */}
      <Animated.View
        style={[
          styles.glowSmall,
          {
            backgroundColor: colors.orb2,
            transform: [{ scale }],
          },
        ]}
      />

      {/* "Escudos" abstractos: diamantes con borde */}
      <View style={[styles.diamond, { borderColor: colors.ringSoft, left: 24, top: 140 }]} />
      <View style={[styles.diamond, { borderColor: colors.ring, right: 28, top: 180, transform: [{ rotate: "45deg" }, { scale: 1.2 }] }]} />

      {/* Nodos laterales */}
      <View style={[styles.node, { backgroundColor: colors.node, left: 38, top: 420 }]} />
      <View style={[styles.nodeSmall, { backgroundColor: colors.node, left: 72, top: 392 }]} />
      <View style={[styles.node, { backgroundColor: colors.node, right: 40, top: 420 }]} />
      <View style={[styles.nodeSmall, { backgroundColor: colors.node, right: 72, top: 392 }]} />

      {/* Degradado suave vertical para profundidad */}
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.08)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 160,
    top: 140,
    left: "50%",
    marginLeft: -120,
    opacity: 0.5,
  },
  glowSmall: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 100,
    top: 220,
    left: "50%",
    marginLeft: -70,
    opacity: 0.45,
  },
  diamond: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    transform: [{ rotate: "45deg" }],
    opacity: 0.8,
  },
  node: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.9,
  },
  nodeSmall: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.8,
  },
});
