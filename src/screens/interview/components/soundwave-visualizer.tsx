/**
 * src/screens/interview/components/soundwave-visualizer.tsx
 * ---------------------------------------------------------
 * Visualizador animado de ondas de voz mientras se graba con el micrófono.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Colors } from '@/src/theme';

export const SoundwaveVisualizer = ({ isRecording }: { isRecording: boolean }) => {
  const barHeights = useRef([
    new Animated.Value(10),
    new Animated.Value(24),
    new Animated.Value(38),
    new Animated.Value(18),
    new Animated.Value(32),
    new Animated.Value(14),
    new Animated.Value(28),
  ]).current;

  useEffect(() => {
    if (!isRecording) {
      barHeights.forEach((b) => b.setValue(10));
      return;
    }

    const animations = barHeights.map((anim, index) => {
      const minHeight = 8 + (index % 3) * 4;
      const maxHeight = 28 + ((index * 7) % 20);
      const duration = 250 + ((index * 80) % 200);

      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: maxHeight,
            duration,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: minHeight,
            duration,
            useNativeDriver: false,
          }),
        ])
      );
    });

    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [isRecording]);

  if (!isRecording) return null;

  return (
    <View style={styles.container}>
      {barHeights.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: anim,
              backgroundColor: i % 2 === 0 ? Colors.primary : Colors.primaryLight,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 44,
    marginVertical: 4,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});
