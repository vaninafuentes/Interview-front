/**
 * src/screens/interview/components/ai-evaluating-orb.tsx
 * ------------------------------------------------------
 * Animación futurista del núcleo de IA evaluando la respuesta.
 */

import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { Colors, BorderRadius, FontSize } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Claves de traducción de las fases de evaluación (se traducen en el render)
const EVALUATION_PHASE_KEYS = [
  'interview.eval_phase_processing',
  'interview.eval_phase_evaluating',
  'interview.eval_phase_clarity',
  'interview.eval_phase_structure',
  'interview.eval_phase_comparing',
  'interview.eval_phase_consolidating',
];

export const AiEvaluatingOrb = () => {
  const { t } = useTranslation();
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    // Animación de pulso continuo
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.25,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.45,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();

    // Rotación de fases
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % EVALUATION_PHASE_KEYS.length);
    }, 1800);

    return () => {
      pulse.stop();
      clearInterval(interval);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.orbWrapper}>
        <Animated.View
          style={[
            styles.glowRing,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
        <View style={styles.coreOrb}>
          <Feather name="cpu" size={32} color={Colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>{t('interview.evaluator_active_title')}</Text>
      <View style={styles.phaseBadge}>
        <Text style={styles.phaseText}>{t(EVALUATION_PHASE_KEYS[phaseIndex])}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 14,
  },
  orbWrapper: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
  },
  coreOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  phaseBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  phaseText: {
    fontSize: FontSize.xs,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
});
