/**
 * src/screens/interview/components/audio-recorder.web.tsx
 * --------------------------------------------------------
 * Versión WEB del AudioRecorder usando Web Speech API nativa del navegador.
 *
 * Compatible con Google Chrome, Microsoft Edge, Safari y Opera.
 * No requiere librerías externas ni servidores de audio adicionales.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, BorderRadius, Spacing } from '@/src/theme';
import { SoundwaveVisualizer } from './soundwave-visualizer';

type AudioRecorderProps = {
  onTranscriptReady: (text: string) => void;
  disabled?: boolean;
};

export const AudioRecorder = ({ onTranscriptReady, disabled = false }: AudioRecorderProps) => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setIsSupported(true);
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'es-ES';

        recog.onresult = (event: any) => {
          let current = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
          onTranscriptReady(current);
        };

        recog.onerror = () => {
          setIsRecording(false);
        };

        recog.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recog);
      }
    }
  }, [onTranscriptReady]);

  const handleToggle = () => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      try {
        recognition.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('SpeechRecognition start error:', err);
      }
    }
  };

  if (!isSupported) {
    return null;
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
        {isRecording
          ? t('interview.stop_recording', 'Escuchando... Tocá para pausar')
          : t('interview.tap_to_speak', 'Tocar para responder por voz')}
      </Text>

      {isRecording && transcript.length > 0 && (
        <Text style={styles.transcript} numberOfLines={2}>
          "{transcript}"
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
    maxWidth: 240,
  },
});
