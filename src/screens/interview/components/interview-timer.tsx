/**
 * src/screens/interview/components/interview-timer.tsx
 * ----------------------------------------------------
 * HUD de cronómetro compacto y ultra-llamativo con estética Amber/Coral.
 *
 * Características:
 *   - Diseño compacto en una sola tarjeta para ahorrar espacio en pantalla móvil.
 *   - Color ámbar / dorado vibrante que destaca inmediatamente sobre el fondo.
 *   - Transición a naranja/rojo y pulso animado cuando queda poco tiempo.
 *   - Controles rápidos integrados (+30s y Pausar/Reanudar).
 */

import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { BorderRadius, FontSize } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type InterviewTimerProps = {
  timeLeft: number;
  totalTime?: number;
  isTimerEnabled: boolean;
  onToggleTimer: () => void;
  onAddExtraTime?: () => void;
};

export const InterviewTimer = ({
  timeLeft,
  totalTime = 120,
  isTimerEnabled,
  onToggleTimer,
  onAddExtraTime,
}: InterviewTimerProps) => {
  const { t } = useTranslation();
  const isExpired = timeLeft === 0;
  const isUrgent = timeLeft <= 15;
  const isWarning = timeLeft <= 30;

  // Animación de pulso para cuando el tiempo es crítico o finalizado
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if ((isWarning || isExpired) && isTimerEnabled) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isWarning, isExpired, isTimerEnabled]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

  const progressFraction = Math.max(0, Math.min(1, timeLeft / totalTime));

  // Paleta de colores llamativa (Ámbar / Naranja / Rojo según urgencia)
  let themeBg = '#FFFBEB'; // Ámbar suave
  let themeBorder = '#FDE68A'; // Borde dorado
  let themeText = '#B45309'; // Texto ámbar intenso
  let themeAccent = '#D97706'; // Acento principal
  let themeBar = '#F59E0B'; // Barra ámbar viva
  let statusLabel = t('interview.timer_status_estimated');

  if (!isTimerEnabled) {
    themeBg = '#F3F4F6';
    themeBorder = '#E5E7EB';
    themeText = '#6B7280';
    themeAccent = '#9CA3AF';
    themeBar = '#D1D5DB';
    statusLabel = t('interview.timer_status_paused');
  } else if (isExpired) {
    themeBg = '#FEF2F2';
    themeBorder = '#FCA5A5';
    themeText = '#B91C1C';
    themeAccent = '#DC2626';
    themeBar = '#EF4444';
    statusLabel = t('interview.timer_status_expired');
  } else if (isUrgent) {
    themeBg = '#FEF2F2';
    themeBorder = '#FECACA';
    themeText = '#DC2626';
    themeAccent = '#EF4444';
    themeBar = '#EF4444';
    statusLabel = t('interview.timer_status_urgent', { seconds: timeLeft });
  } else if (isWarning) {
    themeBg = '#FFF7ED';
    themeBorder = '#FED7AA';
    themeText = '#C2410C';
    themeAccent = '#EA580C';
    themeBar = '#F97316';
    statusLabel = t('interview.timer_status_warning', { seconds: timeLeft });
  }

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: themeBg,
          borderColor: themeBorder,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Lado izquierdo: Estado y Dígitos compactos */}
        <View style={styles.leftCol}>
          <View style={styles.metaRow}>
            <View style={[styles.statusDot, { backgroundColor: themeAccent }]} />
            <Text style={[styles.statusLabel, { color: themeText }]}>{statusLabel}</Text>
          </View>
          <View style={styles.digitsRow}>
            <Text style={[styles.digitsText, { color: themeText }]}>
              {formattedMinutes}:{formattedSeconds}
            </Text>
            <Text style={[styles.totalTimeText, { color: themeText }]}>
              / {Math.floor(totalTime / 60)}:00 min
            </Text>
          </View>
        </View>

        {/* Lado derecho: Botones rápidos (+30s y Pausar/Reanudar) */}
        <View style={styles.actionsRow}>
          {onAddExtraTime && (
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: themeBorder, backgroundColor: '#FFFFFF' }]}
              onPress={onAddExtraTime}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={13} color={themeAccent} />
              <Text style={[styles.actionBtnText, { color: themeAccent }]}>+30s</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { borderColor: themeBorder, backgroundColor: '#FFFFFF' },
              !isTimerEnabled && styles.actionBtnResume,
            ]}
            onPress={onToggleTimer}
            activeOpacity={0.7}
          >
            <Feather
              name={isTimerEnabled ? 'pause' : 'play'}
              size={12}
              color={!isTimerEnabled ? '#059669' : themeText}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: !isTimerEnabled ? '#059669' : themeText },
              ]}
            >
              {isTimerEnabled ? t('interview.timer_pause') : t('interview.timer_resume')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mini barra de progreso inferior integrada */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progressFraction * 100}%` as any,
              backgroundColor: themeBar,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderWidth: 1.5,
    shadowColor: '#D97706',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftCol: {
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  digitsText: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  totalTimeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    opacity: 0.75,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  actionBtnResume: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
