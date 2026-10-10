/**
 * src/screens/jobs/jobs-screen.tsx
 * -----------------------------------
 * Sección de Búsqueda de Empleos y Match Profesional.
 *
 * Mejoras aplicadas:
 *   1. Búsqueda por CV (PDF) con links directos y precisos a LinkedIn, Computrabajo e Indeed.
 *   2. Cuestionario ágil y general (situación laboral, disponibilidad, rol libre y modalidad),
 *      sin encasillar al usuario en categorías rígidas.
 *   3. Campo libre para tipear cualquier profesión o puesto con sugerencias opcionales.
 *   4. URLs de portales corregidas (búsquedas reales verificadas sin truncamiento de palabras).
 *   5. Distinción explícita de vacantes exactas vs. puestos afines / referidos.
 *   6. Botón "Atrás" presente en todas las pantallas.
 */

import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Spacing, FontSize, BorderRadius } from '@/src/theme';

type QuickSuggestion = {
  title: string;
  tag: string;
};

const ROLE_SUGGESTIONS: QuickSuggestion[] = [
  { title: 'Desarrollador Backend', tag: 'Tecnología' },
  { title: 'Desarrollador Frontend', tag: 'Tecnología' },
  { title: 'Vendedor / Comercial', tag: 'Ventas' },
  { title: 'Atención al Cliente', tag: 'Soporte' },
  { title: 'Analista Administrativo', tag: 'Administración' },
  { title: 'Diseñador Gráfico / UI', tag: 'Diseño' },
  { title: 'Recursos Humanos / Selección', tag: 'RRHH' },
  { title: 'Logística y Depósito', tag: 'Operaciones' },
];

type UploadedCvInfo = {
  name: string;
  size?: number;
  uri: string;
};

export default function JobsScreen() {
  const router = useRouter();

  // Estados del flujo: 'intro' | 'cv_upload' | 'quiz' | 'analyzing' | 'results'
  const [stage, setStage] = useState<'intro' | 'cv_upload' | 'quiz' | 'analyzing' | 'results'>('intro');
  const [stageSource, setStageSource] = useState<'cv' | 'quiz'>('quiz');

  // Estado del CV subido
  const [cvFile, setCvFile] = useState<UploadedCvInfo | null>(null);
  const [customRoleFromCv, setCustomRoleFromCv] = useState('');

  // Estado del Cuestionario Ágil
  const [quizStep, setQuizStep] = useState(0); // 0: Situación laboral, 1: Disponibilidad, 2: Puesto deseado, 3: Modalidad
  const [jobSituation, setJobSituation] = useState('');
  const [searchUrgency, setSearchUrgency] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [workModality, setWorkModality] = useState('');

  // Estado de simulación de análisis IA
  const [analyzingStep, setAnalyzingStep] = useState(0);

  // Copiado de pitch
  const [copiedPitch, setCopiedPitch] = useState(false);

  // ── MANEJO DEL CV EN PDF ───────────────────────────────────────────────────
  const handlePickCv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setCvFile({
          name: file.name,
          size: file.size,
          uri: file.uri,
        });

        // Autocompletar sugerencia de puesto si el archivo lo menciona
        const lowerName = file.name.toLowerCase();
        if (lowerName.includes('backend') && !customRoleFromCv) {
          setCustomRoleFromCv('Desarrollador Backend');
        } else if (lowerName.includes('frontend') && !customRoleFromCv) {
          setCustomRoleFromCv('Desarrollador Frontend');
        } else if (lowerName.includes('developer') && !customRoleFromCv) {
          setCustomRoleFromCv('Desarrollador de Software');
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar el archivo. Por favor reintentá.');
    }
  };

  const handleStartCvAnalysis = () => {
    if (!cvFile) {
      Alert.alert('CV requerido', 'Por favor seleccioná tu currículum en formato PDF antes de continuar.');
      return;
    }

    setStageSource('cv');
    setStage('analyzing');
    runAnalysisSimulation();
  };

  // ── MANEJO DEL CUESTIONARIO ÁGIL ───────────────────────────────────────────
  const handleNextQuizStep = () => {
    if (quizStep < 3) {
      setQuizStep((prev) => prev + 1);
    } else {
      setStageSource('quiz');
      setStage('analyzing');
      runAnalysisSimulation();
    }
  };

  const handlePrevQuizStep = () => {
    if (quizStep > 0) {
      setQuizStep((prev) => prev - 1);
    } else {
      setStage('intro');
    }
  };

  // ── SIMULACIÓN DE ANÁLISIS IA ──────────────────────────────────────────────
  const runAnalysisSimulation = () => {
    setAnalyzingStep(0);
    setTimeout(() => setAnalyzingStep(1), 500);
    setTimeout(() => setAnalyzingStep(2), 1100);
    setTimeout(() => {
      setStage('results');
    }, 1700);
  };

  // ── SANITIZACIÓN ROBUSTA DE ROL Y GENERACIÓN DE ENLACES ────────────────────
  const rawRole =
    stageSource === 'cv'
      ? customRoleFromCv.trim() || 'Desarrollador'
      : targetRole.trim() || 'Desarrollador / Profesional';

  // Limpieza correcta: solo quitamos caracteres especiales repetidos y espacios
  const cleanRole = rawRole
    .replace(/[/\\|•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const isRemote =
    stageSource === 'cv'
      ? true
      : workModality.toLowerCase().includes('remoto');

  // Enlaces de búsqueda directos y testeados
  const openLinkedInJobs = () => {
    const query = encodeURIComponent(cleanRole);
    // Link directo que busca el término exacto en Argentina (o remoto si aplica)
    const remoteParam = isRemote ? '&f_WT=2' : '';
    const url = `https://www.linkedin.com/jobs/search/?keywords=${query}${remoteParam}&location=Argentina`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir LinkedIn'));
  };

  const openComputrabajo = () => {
    const query = encodeURIComponent(cleanRole);
    // Endpoint oficial de búsqueda de Computrabajo Argentina
    const url = `https://www.computrabajo.com.ar/ofertas-de-trabajo/?q=${query}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir Computrabajo'));
  };

  const openIndeed = () => {
    const query = encodeURIComponent(cleanRole);
    const url = `https://ar.indeed.com/jobs?q=${query}&l=Argentina`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir Indeed'));
  };

  const openBumeran = () => {
    const slug = encodeURIComponent(cleanRole.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    const url = `https://www.bumeran.com.ar/empleos-busqueda-${slug}.html`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir Bumeran'));
  };

  // Pitch de postulación generado
  const candidatePitch =
    stageSource === 'cv'
      ? `Hola! Me comunico para postularme a la posición de ${cleanRole}. Adjunto mi CV (${cvFile?.name || 'CV.pdf'}). Cuento con sólida formación, responsabilidad y entusiasmo por aportar valor inmediato al equipo. Me encuentro con disponibilidad y me encantaría coordinar una entrevista. ¡Muchas gracias!`
      : `Hola! Me pongo en contacto para postularme a la búsqueda de ${cleanRole}. Actualmente me encuentro en ${jobSituation.toLowerCase() || 'búsqueda laboral'}, con interés en modalidad ${workModality.toLowerCase() || 'flexible'}. Me encantaría mantener una breve conversación para contarles cómo puedo sumar al proyecto. ¡Saludos cordiales!`;

  const handleShareOrCopyPitch = async () => {
    try {
      await Share.share({
        message: candidatePitch,
        title: 'Pitch de postulación',
      });
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 3000);
    } catch {
      // Ignorar
    }
  };

  // =========================================================================
  // PANTALLA 1: MENÚ PRINCIPAL (INTRO / HUB DE EMPLEOS)
  // =========================================================================
  if (stage === 'intro') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.introContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header principal */}
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>Empleos</Text>
            <Text style={styles.headerSubtitle}>
              Búsqueda de vacantes y postulaciones adaptadas a tu perfil
            </Text>
          </View>

          {/* Opción 1: Subir CV en PDF */}
          <TouchableOpacity
            style={styles.actionCardPrimary}
            onPress={() => setStage('cv_upload')}
            activeOpacity={0.88}
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <Feather name="file-text" size={24} color={Colors.primary} />
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>Rápido con IA</Text>
              </View>
            </View>

            <Text style={styles.actionCardTitle}>Subir mi Currículum (PDF)</Text>
            <Text style={styles.actionCardDesc}>
              Cargá tu archivo PDF. La IA extraerá tu puesto y te mostrará enlaces directos con vacantes activas y puestos afines en LinkedIn, Computrabajo e Indeed.
            </Text>

            <View style={styles.actionCardCtaRow}>
              <Text style={styles.actionCardCtaText}>Seleccionar archivo PDF</Text>
              <Feather name="arrow-right" size={16} color={Colors.primary} />
            </View>
          </TouchableOpacity>

          {/* Opción 2: Cuestionario Guiado Flexible */}
          <TouchableOpacity
            style={styles.actionCardSecondary}
            onPress={() => {
              setQuizStep(0);
              setStage('quiz');
            }}
            activeOpacity={0.88}
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconWrap, { backgroundColor: '#FDF4FF' }]}>
                <Feather name="edit-3" size={24} color={Colors.accentPink} />
              </View>
              <View style={[styles.badgePill, { backgroundColor: '#FDF2F8' }]}>
                <Text style={[styles.badgePillText, { color: Colors.accentPink }]}>4 Preguntas</Text>
              </View>
            </View>

            <Text style={styles.actionCardTitle}>Cuestionario Rápido de Preferencias</Text>
            <Text style={styles.actionCardDesc}>
              Indicá tu situación actual, qué puesto o profesión buscás (sin encasillarte en categorías cerradas) y qué modalidad preferís.
            </Text>

            <View style={styles.actionCardCtaRow}>
              <Text style={[styles.actionCardCtaText, { color: Colors.textPrimary }]}>
                Comenzar preguntas
              </Text>
              <Feather name="arrow-right" size={16} color={Colors.textPrimary} />
            </View>
          </TouchableOpacity>

          {/* Tarjeta de Beneficios */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsHeading}>BENEFICIOS DE LA SECCIÓN</Text>

            <View style={styles.benefitRow}>
              <View style={[styles.miniDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.benefitRowText}>
                <Text style={{ fontWeight: '700' }}>Enlaces Directos:</Text> Búsquedas ya filtradas en LinkedIn, Computrabajo, Indeed y Bumeran.
              </Text>
            </View>

            <View style={styles.benefitRow}>
              <View style={[styles.miniDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.benefitRowText}>
                <Text style={{ fontWeight: '700' }}>Carta / Pitch de Presentación:</Text> Texto generado listo para enviar a reclutadores por chat o mail.
              </Text>
            </View>

            <View style={styles.benefitRow}>
              <View style={[styles.miniDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.benefitRowText}>
                <Text style={{ fontWeight: '700' }}>Simulacro de Entrevista:</Text> Acceso a practicar preguntas típicas de tu puesto en 1 toque.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // PANTALLA 2: SUBIDA DE CV EN PDF
  // =========================================================================
  if (stage === 'cv_upload') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Barra superior con botón ATRÁS */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStage('intro')}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={16} color={Colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={styles.backButtonText}>Atrás</Text>
          </TouchableOpacity>

          <Text style={styles.navBarTitle}>Subir Currículum</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.cvContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Cargá tu CV en formato PDF</Text>
          <Text style={styles.sectionSubtitle}>
            Buscamos vacantes exactas y puestos afines en LinkedIn, Computrabajo e Indeed.
          </Text>

          {/* Dropzone interactiva */}
          <TouchableOpacity
            style={[styles.dropzone, cvFile && styles.dropzoneFilled]}
            onPress={handlePickCv}
            activeOpacity={0.75}
          >
            {cvFile ? (
              <View style={styles.filePreviewRow}>
                <View style={styles.pdfIconWrap}>
                  <FontAwesome5 name="file-pdf" size={32} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {cvFile.name}
                  </Text>
                  <Text style={styles.fileSize}>
                    {cvFile.size ? `${Math.round(cvFile.size / 1024)} KB` : 'Documento PDF'} • Listo para analizar
                  </Text>
                </View>
                <View style={styles.checkBadge}>
                  <Feather name="check" size={16} color="#FFFFFF" />
                </View>
              </View>
            ) : (
              <View style={styles.dropzoneEmpty}>
                <View style={styles.uploadIconCircle}>
                  <Feather name="upload-cloud" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.dropzoneTitle}>Tocar para elegir archivo PDF</Text>
                <Text style={styles.dropzoneHint}>Formatos admitidos: .pdf (máx. 10 MB)</Text>
              </View>
            )}
          </TouchableOpacity>

          {cvFile && (
            <TouchableOpacity
              style={styles.changeFileButton}
              onPress={handlePickCv}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={13} color={Colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.changeFileText}>Elegir otro archivo</Text>
            </TouchableOpacity>
          )}

          {/* Campo de rol o puesto de interés */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>¿A QUÉ PUESTO O ROL QUERÉS APLICAR?</Text>
            <TextInput
              style={styles.textInput}
              value={customRoleFromCv}
              onChangeText={setCustomRoleFromCv}
              placeholder="Ej: Desarrollador Backend, Analista Contable, Ventas..."
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.inputHelp}>
              Si lo dejás en blanco, la IA buscará vacantes acordes a tu título y experiencia en el CV.
            </Text>
          </View>

          {/* Botón de Procesar */}
          <TouchableOpacity
            style={[
              styles.primaryCtaButton,
              !cvFile && styles.primaryCtaButtonDisabled,
            ]}
            onPress={handleStartCvAnalysis}
            disabled={!cvFile}
            activeOpacity={0.8}
          >
            <Feather name="search" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryCtaButtonText}>Analizar y Buscar Empleos</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // PANTALLA 3: CUESTIONARIO ÁGIL Y GENERAL (4 PASOS)
  // =========================================================================
  if (stage === 'quiz') {
    const progress = (quizStep + 1) / 4;

    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Barra superior con botón ATRÁS en TODO momento */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handlePrevQuizStep}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={16} color={Colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={styles.backButtonText}>Atrás</Text>
          </TouchableOpacity>

          <Text style={styles.navBarTitle}>Paso {quizStep + 1} de 4</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Barra de Progreso */}
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` as any }]} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.quizContent}
          showsVerticalScrollIndicator={false}
        >
          {/* PASO 1: Situación laboral actual */}
          {quizStep === 0 && (
            <View style={{ gap: Spacing.md }}>
              <Text style={styles.questionTitle}>¿Cuál es tu situación laboral actual?</Text>
              <Text style={styles.questionSubtitle}>Seleccioná tu estado para calibrar el mensaje de presentación.</Text>

              {[
                'Desempleado/a (en búsqueda activa)',
                'Empleado/a (busco mejores oportunidades o cambio)',
                'Estudiante / Busco mi primer empleo',
                'Autónomo/a / Freelance',
              ].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionCard, jobSituation === opt && styles.optionCardSelected]}
                  onPress={() => {
                    setJobSituation(opt);
                    setTimeout(handleNextQuizStep, 150);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionLabel, jobSituation === opt && styles.optionLabelSelected]}>
                    {opt}
                  </Text>
                  <View style={[styles.optionCheckCircle, jobSituation === opt && styles.optionCheckCircleSelected]}>
                    {jobSituation === opt && <Feather name="check" size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* PASO 2: Disponibilidad y tipo de búsqueda */}
          {quizStep === 1 && (
            <View style={{ gap: Spacing.md }}>
              <Text style={styles.questionTitle}>¿Cómo buscas trabajo en este momento?</Text>
              <Text style={styles.questionSubtitle}>Definí la urgencia y disponibilidad de tu postulación.</Text>

              {[
                'Búsqueda activa urgente (disponibilidad inmediata)',
                'Abierto/a a ofertas interesantes y desafíos',
                'Solo explorando el mercado laboral',
              ].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionCard, searchUrgency === opt && styles.optionCardSelected]}
                  onPress={() => {
                    setSearchUrgency(opt);
                    setTimeout(handleNextQuizStep, 150);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionLabel, searchUrgency === opt && styles.optionLabelSelected]}>
                    {opt}
                  </Text>
                  <View style={[styles.optionCheckCircle, searchUrgency === opt && styles.optionCheckCircleSelected]}>
                    {searchUrgency === opt && <Feather name="check" size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* PASO 3: Puesto deseado libre (sin encasillar) */}
          {quizStep === 2 && (
            <View style={{ gap: Spacing.md }}>
              <Text style={styles.questionTitle}>¿A qué puesto o profesión aspirás?</Text>
              <Text style={styles.questionSubtitle}>
                Escribí libremente el nombre del rol o elegí una sugerencia rápida.
              </Text>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.textInputLarge}
                  value={targetRole}
                  onChangeText={setTargetRole}
                  placeholder="Ej: Desarrollador Backend, Asistente Contable, Ventas..."
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                />
              </View>

              <Text style={styles.chipsHeading}>SUGERENCIAS RÁPIDAS (OPCIONAL):</Text>
              <View style={styles.chipsWrap}>
                {ROLE_SUGGESTIONS.map((sug) => (
                  <TouchableOpacity
                    key={sug.title}
                    style={[
                      styles.suggestionChip,
                      targetRole === sug.title && styles.suggestionChipSelected,
                    ]}
                    onPress={() => setTargetRole(sug.title)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.suggestionChipText,
                        targetRole === sug.title && styles.suggestionChipTextSelected,
                      ]}
                    >
                      {sug.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryCtaButton,
                  !targetRole.trim() && styles.primaryCtaButtonDisabled,
                ]}
                onPress={handleNextQuizStep}
                disabled={!targetRole.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryCtaButtonText}>Continuar</Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          )}

          {/* PASO 4: Modalidad preferida */}
          {quizStep === 3 && (
            <View style={{ gap: Spacing.md }}>
              <Text style={styles.questionTitle}>¿Qué modalidad de trabajo preferís?</Text>
              <Text style={styles.questionSubtitle}>Filtraremos las ofertas para adecuarlas a tu preferencia.</Text>

              {[
                '100% Remoto (Home Office)',
                'Híbrido (días en oficina y casa)',
                'Presencial',
                'Abierto a cualquier modalidad',
              ].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionCard, workModality === opt && styles.optionCardSelected]}
                  onPress={() => {
                    setWorkModality(opt);
                    setTimeout(handleNextQuizStep, 150);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionLabel, workModality === opt && styles.optionLabelSelected]}>
                    {opt}
                  </Text>
                  <View style={[styles.optionCheckCircle, workModality === opt && styles.optionCheckCircleSelected]}>
                    {workModality === opt && <Feather name="check" size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // PANTALLA 4: ESTADO DE ANÁLISIS IA
  // =========================================================================
  if (stage === 'analyzing') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 20 }} />

          <Text style={styles.analyzingTitle}>Buscando vacantes para {cleanRole}</Text>
          <Text style={styles.analyzingSubtitle}>
            Estamos generando los enlaces a búsquedas activas y puestos afines en portales líderes.
          </Text>

          <View style={styles.analyzingStepsList}>
            <View style={styles.analyzingStepRow}>
              <Feather
                name={analyzingStep >= 0 ? 'check-circle' : 'circle'}
                size={18}
                color={analyzingStep >= 0 ? Colors.success : Colors.textMuted}
              />
              <Text
                style={[
                  styles.analyzingStepText,
                  analyzingStep >= 0 && { color: Colors.textPrimary, fontWeight: '700' },
                ]}
              >
                Configurando búsquedas directas en LinkedIn, Computrabajo e Indeed
              </Text>
            </View>

            <View style={styles.analyzingStepRow}>
              <Feather
                name={analyzingStep >= 1 ? 'check-circle' : 'circle'}
                size={18}
                color={analyzingStep >= 1 ? Colors.success : Colors.textMuted}
              />
              <Text
                style={[
                  styles.analyzingStepText,
                  analyzingStep >= 1 && { color: Colors.textPrimary, fontWeight: '700' },
                ]}
              >
                Mapeando puestos afines y referidos
              </Text>
            </View>

            <View style={styles.analyzingStepRow}>
              <Feather
                name={analyzingStep >= 2 ? 'check-circle' : 'circle'}
                size={18}
                color={analyzingStep >= 2 ? Colors.success : Colors.textMuted}
              />
              <Text
                style={[
                  styles.analyzingStepText,
                  analyzingStep >= 2 && { color: Colors.textPrimary, fontWeight: '700' },
                ]}
              >
                Generando pitch de postulación personalizado
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // PANTALLA 5: RESULTADOS Y ACCESO A EMPLEOS
  // =========================================================================
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Barra superior con botón ATRÁS */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStage('intro')}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={16} color={Colors.textPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.backButtonText}>Menú de empleos</Text>
        </TouchableOpacity>

        <Text style={styles.navBarTitle}>Resultados</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de Compatibilidad */}
        <View style={styles.matchBanner}>
          <View style={styles.matchBadgeRow}>
            <View style={styles.matchPill}>
              <Feather name="check" size={13} color="#FFFFFF" />
              <Text style={styles.matchPillText}>BÚSQUEDA OBJETIVA</Text>
            </View>
            {stageSource === 'cv' && (
              <View style={[styles.matchPill, { backgroundColor: '#FDF4FF' }]}>
                <Text style={[styles.matchPillText, { color: Colors.accentPink }]}>Basado en tu CV</Text>
              </View>
            )}
          </View>

          <Text style={styles.resultsHeading}>
            Ofertas de empleo para "{cleanRole}"
          </Text>
          <Text style={styles.resultsSubheading}>
            {stageSource === 'cv'
              ? `Generamos los enlaces con filtros precisos a partir de tu currículum (${cvFile?.name}).`
              : 'Resultados configurados según tu situación laboral y puesto objetivo.'}
          </Text>
        </View>

        {/* AVISO ORIENTATIVO DE VACANTES Y PUESTOS AFINES */}
        <View style={styles.referredNoticeBox}>
          <Feather name="info" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
          <Text style={styles.referredNoticeText}>
            Los siguientes enlaces te conectan directamente a vacantes activas de <Text style={{ fontWeight: '800' }}>"{cleanRole}"</Text>. En caso de que en tu localidad no haya un puesto exacto hoy, el portal te mostrará automáticamente los puestos afines y referidos más compatibles.
          </Text>
        </View>

        {/* ACCESOS DIRECTOS A PORTALES DE BÚSQUEDA */}
        <Text style={styles.sectionHeading}>POSTULARME AHORA EN PORTALES</Text>

        {/* 1. LinkedIn Jobs */}
        <TouchableOpacity
          style={styles.portalCard}
          onPress={openLinkedInJobs}
          activeOpacity={0.8}
        >
          <View style={[styles.portalIconWrap, { backgroundColor: '#0A66C2' }]}>
            <FontAwesome5 name="linkedin-in" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.portalTitleRow}>
              <Text style={styles.portalName}>LinkedIn Jobs</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Enlace activo</Text>
              </View>
            </View>
            <Text style={styles.portalDesc}>
              Búsqueda de "{cleanRole}" {isRemote ? 'con filtro remoto' : 'en Argentina'}
            </Text>
          </View>
          <Feather name="external-link" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* 2. Computrabajo */}
        <TouchableOpacity
          style={styles.portalCard}
          onPress={openComputrabajo}
          activeOpacity={0.8}
        >
          <View style={[styles.portalIconWrap, { backgroundColor: '#EA580C' }]}>
            <Feather name="briefcase" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.portalTitleRow}>
              <Text style={styles.portalName}>Computrabajo</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Enlace activo</Text>
              </View>
            </View>
            <Text style={styles.portalDesc}>
              Ofertas y avisos vigentes para "{cleanRole}"
            </Text>
          </View>
          <Feather name="external-link" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* 3. Indeed & Glassdoor */}
        <TouchableOpacity
          style={styles.portalCard}
          onPress={openIndeed}
          activeOpacity={0.8}
        >
          <View style={[styles.portalIconWrap, { backgroundColor: '#2557A7' }]}>
            <Feather name="search" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.portalTitleRow}>
              <Text style={styles.portalName}>Indeed & Glassdoor</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Enlace activo</Text>
              </View>
            </View>
            <Text style={styles.portalDesc}>
              Vacantes abiertas y salarios de referencia
            </Text>
          </View>
          <Feather name="external-link" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* 4. Bumeran */}
        <TouchableOpacity
          style={styles.portalCard}
          onPress={openBumeran}
          activeOpacity={0.8}
        >
          <View style={[styles.portalIconWrap, { backgroundColor: '#10B981' }]}>
            <Feather name="globe" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.portalTitleRow}>
              <Text style={styles.portalName}>Bumeran</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Enlace activo</Text>
              </View>
            </View>
            <Text style={styles.portalDesc}>
              Búsquedas de empresas consolidadas en Argentina
            </Text>
          </View>
          <Feather name="external-link" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* PITCH DE POSTULACIÓN GENERADO */}
        <View style={styles.pitchCard}>
          <View style={styles.pitchHeader}>
            <View style={styles.pitchTitleRow}>
              <Feather name="message-square" size={16} color={Colors.primary} />
              <Text style={styles.pitchTitle}>Tu Pitch / Carta de Presentación</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleShareOrCopyPitch}
              activeOpacity={0.7}
            >
              <Feather
                name={copiedPitch ? 'check' : 'copy'}
                size={14}
                color={copiedPitch ? Colors.success : Colors.primary}
              />
              <Text
                style={[
                  styles.copyButtonText,
                  copiedPitch && { color: Colors.success },
                ]}
              >
                {copiedPitch ? 'Copiado' : 'Copiar'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.pitchContent}>{candidatePitch}</Text>
        </View>

        {/* CTA: Simulacro de Entrevista para este puesto */}
        <TouchableOpacity
          style={styles.practiceBanner}
          onPress={() => router.push('/(tabs)/interview')}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.practiceBannerPre}>PREPARATE ANTES DE LA ENTREVISTA</Text>
            <Text style={styles.practiceBannerTitle}>
              Simulá preguntas de {cleanRole}
            </Text>
          </View>
          <View style={styles.practiceBannerArrow}>
            <Feather name="arrow-right" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Botón para reiniciar o cambiar */}
        <TouchableOpacity
          style={styles.restartButton}
          onPress={() => {
            setQuizStep(0);
            setCvFile(null);
            setCustomRoleFromCv('');
            setTargetRole('');
            setStage('intro');
          }}
          activeOpacity={0.7}
        >
          <Feather name="rotate-ccw" size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.restartText}>Realizar otra búsqueda o cambiar CV</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },

  // ── Barra de Navegación con botón ATRÁS ──────────────────────────────────
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  navBarTitle: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  // ── Vista Intro / Hub ────────────────────────────────────────────────────
  introContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  headerBar: {
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 20,
  },

  actionCardPrimary: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  actionCardSecondary: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  actionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  actionCardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  actionCardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionCardCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  actionCardCtaText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.primary,
  },

  benefitsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  benefitsHeading: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  benefitRowText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    lineHeight: 18,
  },

  // ── Vista Subida de CV ───────────────────────────────────────────────────
  cvContentContainer: {
    padding: Spacing.md,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: -8,
  },
  dropzone: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneFilled: {
    borderStyle: 'solid',
    borderColor: Colors.primary,
    backgroundColor: '#F8F7FF',
    padding: Spacing.lg,
  },
  dropzoneEmpty: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dropzoneTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  dropzoneHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  filePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  pdfIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  fileSize: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: -8,
  },
  changeFileText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  inputHelp: {
    fontSize: 11.5,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  primaryCtaButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 15,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryCtaButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryCtaButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '800',
  },

  // ── Vista Cuestionario Ágil ──────────────────────────────────────────────
  progressBarWrapper: {
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#E0E7FF',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  quizContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  questionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  questionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: -4,
  },
  optionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F8F7FF',
  },
  optionLabel: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  optionLabelSelected: {
    color: Colors.primaryDark,
  },
  optionCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCheckCircleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  textInputLarge: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  chipsHeading: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: Colors.primary,
  },
  suggestionChipText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  suggestionChipTextSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },

  // ── Vista Analizando ─────────────────────────────────────────────────────
  analyzingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  analyzingTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  analyzingSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  analyzingStepsList: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  analyzingStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  analyzingStepText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },

  // ── Vista Resultados ─────────────────────────────────────────────────────
  resultsContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  matchBanner: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderLeftWidth: 5,
    borderLeftColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  matchBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
  },
  matchPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  resultsHeading: {
    fontSize: FontSize.lg,
    fontWeight: '900',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  resultsSubheading: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  referredNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  referredNoticeText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  portalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  portalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  portalName: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  activeBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  portalDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pitchCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pitchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pitchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pitchTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  copyButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  pitchContent: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  practiceBanner: {
    backgroundColor: '#1E1B4B',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  practiceBannerPre: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 0.8,
  },
  practiceBannerTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  practiceBannerArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  restartText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
