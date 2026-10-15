/**
 * src/screens/interview/components/audio-recorder.tsx
 * ----------------------------------------------------
 * Versión MÓVIL (Android / iOS) del AudioRecorder.
 *
 * Si expo-speech-recognition está disponible (custom dev build / prebuild),
 * activa la transcripción nativa en vivo.
 * Si se ejecuta dentro de Expo Go (donde módulos nativos de terceros no están
 * compilados en el binario), muestra una tarjeta orientativa indicando cómo
 * dictar usando el micrófono nativo del teclado del celular (Apple / Gboard).
 */

import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontSize, BorderRadius, Spacing } from '@/src/theme';
import { SoundwaveVisualizer } from './soundwave-visualizer';
import { useTranslation } from 'react-i18next';

let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;

try {
  const mod = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch {
  // expo-speech-recognition no disponible en este entorno
}

type AudioRecorderProps = {
  onTranscriptReady: (text: string) => void;
  disabled?: boolean;
};

export const AudioRecorder = ({ onTranscriptReady, disabled = false }: AudioRecorderProps) => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);

  // Verificar disponibilidad del reconocimiento de voz nativo
  useEffect(() => {
    const checkAvailability = async () => {
      if (!ExpoSpeechRecognitionModule) {
        setIsAvailable(false);
        return;
      }
      try {
        const available = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
        setIsAvailable(available);
      } catch {
        setIsAvailable(false);
      }
    };
    checkAvailability();
  }, []);

  const useEvent = useSpeechRecognitionEvent ?? (() => {});

  useEvent('result', (event: any) => {
    const text = event?.results?.[0]?.transcript ?? '';
    setTranscript(text);
    if (event?.isFinal) {
      onTranscriptReady(text);
      setIsRecording(false);
    }
  });

  useEvent('end', () => {
    setIsRecording(false);
  });

  useEvent('error', () => {
    setIsRecording(false);
  });

  const handleToggle = async () => {
    if (!ExpoSpeechRecognitionModule || !isAvailable) return;

    if (isRecording) {
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
      if (transcript) onTranscriptReady(transcript);
    } else {
      setTranscript('');
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      ExpoSpeechRecognitionModule.start({
        lang: 'es-AR',
        interimResults: true,
        continuous: false,
      });
      setIsRecording(true);
    }
  };

  // Si el módulo nativo compilado no está disponible (ej: Expo Go):
  // Mostramos una tarjeta amigable que enseña a dictar con el teclado del teléfono
  if (!isAvailable) {
    return (
      <View style={styles.dictationGuideCard}>
        <View style={styles.dictationIconRow}>
          <Text style={styles.dictationEmoji}>🎙️</Text>
          <Text style={styles.dictationTitle}>{t('interview.dictation_title')}</Text>
        </View>
        <Text style={styles.dictationDesc}>
          {t('interview.dictation_desc_prefix')}{' '}
          <Text style={styles.dictationHighlight}>[ 🎙️ ]</Text>{' '}
          {t('interview.dictation_desc_suffix')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.micButton,
          isRecording && styles.micButtonActive,
          disabled && styles.micButtonDisabled,
        ]}
        onPress={handleToggle}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
      </TouchableOpacity>

      {/* Onda animada de voz mientras graba */}
      <SoundwaveVisualizer isRecording={isRecording} />

      <Text style={[styles.label, isRecording && { color: Colors.primaryLight }]}>
        {isRecording ? t('interview.stop_recording') : t('interview.tap_to_speak')}
      </Text>

      {isRecording && transcript.length > 0 && (
        <Text style={styles.transcript} numberOfLines={2}>
          {`"${transcript}"`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  micButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
  },
  micButtonDisabled: {
    opacity: 0.4,
  },
  micIcon: {
    fontSize: 24,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  transcript: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 200,
  },
  // Tarjeta orientativa cuando se ejecuta en Expo Go
  dictationGuideCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    gap: 4,
  },
  dictationIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dictationEmoji: {
    fontSize: 14,
  },
  dictationTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  dictationDesc: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  dictationHighlight: {
    fontWeight: '800',
    color: Colors.primary,
  },
});
