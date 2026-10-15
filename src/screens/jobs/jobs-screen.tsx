/**
 * src/screens/jobs/jobs-screen.tsx
 * -----------------------------------
 * Sección de Búsqueda de Empleos y Match Profesional.
 *
 * Flujo:
 *   1. Subida REAL del CV en PDF → POST /api/cv/analyze (multipart) → la IA extrae
 *      el rol, el seniority, las skills y un resumen del documento.
 *   2. Con ese rol real se arman los links a LinkedIn, Computrabajo, Indeed y Bumeran
 *      + el pitch de postulación.
 *   3. Alternativa sin CV: cuestionario ágil y general (situación laboral, disponibilidad,
 *      rol libre y modalidad), sin encasillar al usuario en categorías rígidas. Se resuelve
 *      localmente, sin llamada a la IA.
 *   4. Validación local del archivo (PDF y máx. 10 MB) y mensajes de error específicos
 *      para cada respuesta del backend (400 / 422 / 429 / red).
 *   5. Distinción explícita de vacantes exactas vs. puestos afines / referidos.
 *   6. Botón "Atrás" presente en todas las pantallas.
 */

import { useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import {
  CV_ALLOWED_MIME_TYPE,
  CvAnalysisError,
  MAX_CV_FILE_SIZE_BYTES,
  type CvUploadFile,
} from '@/src/data/api/cv-api';
import { useAnalyzeCv } from '@/src/hooks/use-analyze-cv';
import { BackButton } from '@/src/components/back-button';
import type { CvAnalysisResponse } from '@/src/domain/cv';

type QuickSuggestion = {
  title: string;
  tag: string;
};

type UploadedCvInfo = CvUploadFile & {
  /** Tamaño en bytes informado por el picker (puede faltar en algunos orígenes) */
  size?: number;
};

export default function JobsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // Mutación real contra POST /api/cv/analyze (sube el PDF y espera el perfil extraído)
  const { analyzeCv, isPending: isAnalyzingCv, reset: resetCvAnalysis } = useAnalyzeCv();

  // Sugerencias rápidas de puesto (traducidas al idioma activo)
  const roleSuggestions: QuickSuggestion[] = [
    { title: t('jobs.role_developer_backend'), tag: t('jobs.tag_technology') },
    { title: t('jobs.role_developer_frontend'), tag: t('jobs.tag_technology') },
    { title: t('jobs.role_sales'), tag: t('jobs.tag_sales') },
    { title: t('jobs.role_customer_service'), tag: t('jobs.tag_support') },
    { title: t('jobs.role_admin_analyst'), tag: t('jobs.tag_administration') },
    { title: t('jobs.role_graphic_designer'), tag: t('jobs.tag_design') },
    { title: t('jobs.role_hr'), tag: t('jobs.tag_hr') },
    { title: t('jobs.role_logistics'), tag: t('jobs.tag_operations') },
  ];

  // Estados del flujo: 'intro' | 'cv_upload' | 'quiz' | 'analyzing' | 'results'
  const [stage, setStage] = useState<'intro' | 'cv_upload' | 'quiz' | 'analyzing' | 'results'>('intro');
  const [stageSource, setStageSource] = useState<'cv' | 'quiz'>('quiz');

  // Estado del CV subido y del perfil que devuelve la IA
  const [cvFile, setCvFile] = useState<UploadedCvInfo | null>(null);
  const [cvAnalysis, setCvAnalysis] = useState<CvAnalysisResponse | null>(null);
  const [customRoleFromCv, setCustomRoleFromCv] = useState('');

  // Estado del Cuestionario Ágil
  const [quizStep, setQuizStep] = useState(0); // 0: Situación laboral, 1: Disponibilidad, 2: Puesto deseado, 3: Modalidad
  const [jobSituation, setJobSituation] = useState('');
  const [searchUrgency, setSearchUrgency] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [workModality, setWorkModality] = useState('');

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
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
          file: file.file,
        });

        // El perfil anterior ya no corresponde al archivo nuevo
        setCvAnalysis(null);
        resetCvAnalysis();
      }
    } catch {
      Alert.alert(t('common.error'), t('jobs.cv_pick_error'));
    }
  };

  /** Un archivo es PDF si el picker lo reporta así o si el nombre termina en .pdf */
  const isPdfFile = (file: UploadedCvInfo) =>
    file.mimeType === CV_ALLOWED_MIME_TYPE || file.name.toLowerCase().endsWith('.pdf');

  /** Traduce el error del backend a un mensaje accionable para el usuario */
  const showCvAnalysisError = (error: unknown) => {
    if (error instanceof CvAnalysisError) {
      switch (error.code) {
        // 400 → el archivo no sirve (formato o peso)
        case 'INVALID_FILE':
          return Alert.alert(t('common.error'), t('jobs.cv_error_type'));
        // 422 → el PDF no tiene texto: la IA no puede extraer nada
        case 'NO_TEXT':
          return Alert.alert(t('common.error'), t('jobs.cv_error_no_text'));
        // 429 → la IA está saturada: vale la pena reintentar
        case 'AI_BUSY':
          return Alert.alert(t('common.error'), t('jobs.cv_error_ai_busy'));
        // Red caída, timeout, 401 o 5xx: el interceptor de axios ya tradujo el mensaje
        case 'NETWORK':
          return Alert.alert(t('common.error'), error.message || t('jobs.cv_error_analysis'));
        // 502 (fallo de la IA) y cualquier otro caso
        default:
          return Alert.alert(t('common.error'), t('jobs.cv_error_analysis'));
      }
    }

    // Error inesperado fuera de la API de CV
    Alert.alert(
      t('common.error'),
      error instanceof Error ? error.message : t('jobs.cv_error_analysis')
    );
  };

  const handleStartCvAnalysis = async () => {
    if (!cvFile) {
      Alert.alert(t('jobs.cv_required_title'), t('jobs.cv_required_msg'));
      return;
    }

    // Validaciones locales: la UI promete un PDF de hasta 10 MB
    if (!isPdfFile(cvFile)) {
      Alert.alert(t('common.error'), t('jobs.cv_error_type'));
      return;
    }
    if (cvFile.size !== undefined && cvFile.size > MAX_CV_FILE_SIZE_BYTES) {
      Alert.alert(t('common.error'), t('jobs.cv_error_size'));
      return;
    }

    setStageSource('cv');
    setStage('analyzing');

    try {
      // Llamada real: la IA lee el PDF y devuelve rol, seniority, skills y resumen
      const analysis = await analyzeCv(cvFile);
      setCvAnalysis(analysis);
      setStage('results');
    } catch (error) {
      // Volvemos a la pantalla de carga para que el usuario pueda cambiar el CV o reintentar
      setStage('cv_upload');
      showCvAnalysisError(error);
    }
  };

  // ── MANEJO DEL CUESTIONARIO ÁGIL ───────────────────────────────────────────
  const handleNextQuizStep = () => {
    if (quizStep < 3) {
      setQuizStep((prev) => prev + 1);
    } else {
      // El cuestionario se resuelve localmente (links + pitch): mostramos los resultados directo
      setStageSource('quiz');
      setStage('results');
    }
  };

  const handlePrevQuizStep = () => {
    if (quizStep > 0) {
      setQuizStep((prev) => prev - 1);
    } else {
      setStage('intro');
    }
  };

  // ── SANITIZACIÓN ROBUSTA DE ROL Y GENERACIÓN DE ENLACES ────────────────────
  // Rol real detectado por la IA en el CV (vacío mientras no se haya analizado)
  const cvDetectedRole = cvAnalysis?.role?.trim() || '';

  // Si el usuario escribió un rol a mano, manda su elección; si no, usamos el que
  // detectó la IA en el CV y, como último recurso, el fallback traducido.
  const rawRole =
    stageSource === 'cv'
      ? customRoleFromCv.trim() || cvDetectedRole || t('jobs.default_role')
      : targetRole.trim() || t('jobs.default_role_full');

  // Limpieza correcta: solo quitamos caracteres especiales repetidos y espacios
  const cleanRole = rawRole
    .replace(/[/\\|•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const isRemote =
    stageSource === 'cv'
      ? true
      : workModality === t('jobs.modality_remote');

  // Enlaces de búsqueda directos y testeados
  const openLinkedInJobs = () => {
    const query = encodeURIComponent(cleanRole);
    // Link directo que busca el término exacto en Argentina (o remoto si aplica)
    const remoteParam = isRemote ? '&f_WT=2' : '';
    const url = `https://www.linkedin.com/jobs/search/?keywords=${query}${remoteParam}&location=Argentina`;
    Linking.openURL(url).catch(() => Alert.alert(t('common.error'), t('jobs.open_linkedin_error')));
  };

  const openComputrabajo = () => {
    const query = encodeURIComponent(cleanRole);
    // Endpoint oficial de búsqueda de Computrabajo Argentina
    const url = `https://www.computrabajo.com.ar/ofertas-de-trabajo/?q=${query}`;
    Linking.openURL(url).catch(() => Alert.alert(t('common.error'), t('jobs.open_computrabajo_error')));
  };

  const openIndeed = () => {
    const query = encodeURIComponent(cleanRole);
    const url = `https://ar.indeed.com/jobs?q=${query}&l=Argentina`;
    Linking.openURL(url).catch(() => Alert.alert(t('common.error'), t('jobs.open_indeed_error')));
  };

  const openBumeran = () => {
    const slug = encodeURIComponent(cleanRole.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    const url = `https://www.bumeran.com.ar/empleos-busqueda-${slug}.html`;
    Linking.openURL(url).catch(() => Alert.alert(t('common.error'), t('jobs.open_bumeran_error')));
  };

  // Pitch de postulación generado
  const candidatePitch =
    stageSource === 'cv'
      ? t('jobs.pitch_cv', {
          role: cleanRole,
          fileName: cvFile?.name || t('jobs.pitch_cv_file_fallback'),
        })
      : t('jobs.pitch_quiz', {
          role: cleanRole,
          situation: jobSituation.toLowerCase() || t('jobs.job_situation_fallback'),
          modality: workModality.toLowerCase() || t('jobs.work_modality_fallback'),
        });

  const handleShareOrCopyPitch = async () => {
    try {
      await Share.share({
        message: candidatePitch,
        title: t('jobs.share_pitch_title'),
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <BackButton />
              <Text style={styles.headerTitle}>{t('jobs.header_title')}</Text>
            </View>
            <Text style={styles.headerSubtitle}>{t('jobs.header_subtitle')}</Text>
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
                <Text style={styles.badgePillText}>{t('jobs.badge_quick_ai')}</Text>
              </View>
            </View>

            <Text style={styles.actionCardTitle}>{t('jobs.upload_cv_title')}</Text>
            <Text style={styles.actionCardDesc}>{t('jobs.upload_cv_desc')}</Text>

            <View style={styles.actionCardCtaRow}>
              <Text style={styles.actionCardCtaText}>{t('jobs.select_pdf')}</Text>
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
                <Text style={[styles.badgePillText, { color: Colors.accentPink }]}>
                  {t('jobs.badge_four_questions')}
                </Text>
              </View>
            </View>

            <Text style={styles.actionCardTitle}>{t('jobs.quiz_title')}</Text>
            <Text style={styles.actionCardDesc}>{t('jobs.quiz_desc')}</Text>

            <View style={styles.actionCardCtaRow}>
              <Text style={[styles.actionCardCtaText, { color: Colors.textPrimary }]}>
                {t('jobs.start_questions')}
              </Text>
              <Feather name="arrow-right" size={16} color={Colors.textPrimary} />
            </View>
          </TouchableOpacity>

          {/* Tarjeta de Beneficios */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsHeading}>{t('jobs.benefits_heading')}</Text>

            <View style={styles.benefitRow}>
              <View style={[styles.miniDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.benefitRowText}>
                <Text style={{ fontWeight: '700' }}>{t('jobs.benefit_links_label')}</Text>{' '}
                {t('jobs.benefit_links_text')}
              </Text>
            </View>

            <View style={styles.benefitRow}>
              <View style={[styles.miniDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.benefitRowText}>
                <Text style={{ fontWeight: '700' }}>{t('jobs.benefit_pitch_label')}</Text>{' '}
                {t('jobs.benefit_pitch_text')}
              </Text>
            </View>

            <View style={styles.benefitRow}>
              <View style={[styles.miniDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.benefitRowText}>
                <Text style={{ fontWeight: '700' }}>{t('jobs.benefit_interview_label')}</Text>{' '}
                {t('jobs.benefit_interview_text')}
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
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>

          <Text style={styles.navBarTitle}>{t('jobs.upload_cv_nav')}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.cvContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>{t('jobs.cv_section_title')}</Text>
          <Text style={styles.sectionSubtitle}>{t('jobs.cv_section_subtitle')}</Text>

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
                    {cvFile.size ? `${Math.round(cvFile.size / 1024)} KB` : t('jobs.pdf_document')} •{' '}
                    {t('jobs.ready_to_analyze')}
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
                <Text style={styles.dropzoneTitle}>{t('jobs.dropzone_title')}</Text>
                <Text style={styles.dropzoneHint}>{t('jobs.dropzone_hint')}</Text>
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
              <Text style={styles.changeFileText}>{t('jobs.change_file')}</Text>
            </TouchableOpacity>
          )}

          {/* Campo de rol o puesto de interés */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('jobs.target_role_label')}</Text>
            <TextInput
              style={styles.textInput}
              value={customRoleFromCv}
              onChangeText={setCustomRoleFromCv}
              placeholder={t('jobs.target_role_placeholder')}
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.inputHelp}>{t('jobs.target_role_help')}</Text>
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
            <Text style={styles.primaryCtaButtonText}>{t('jobs.analyze_button')}</Text>
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
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>

          <Text style={styles.navBarTitle}>
            {t('jobs.step_of', { current: quizStep + 1, total: 4 })}
          </Text>
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
              <Text style={styles.questionTitle}>{t('jobs.q1_title')}</Text>
              <Text style={styles.questionSubtitle}>{t('jobs.q1_subtitle')}</Text>

              {[
                t('jobs.situation_unemployed'),
                t('jobs.situation_employed'),
                t('jobs.situation_student'),
                t('jobs.situation_freelance'),
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
              <Text style={styles.questionTitle}>{t('jobs.q2_title')}</Text>
              <Text style={styles.questionSubtitle}>{t('jobs.q2_subtitle')}</Text>

              {[
                t('jobs.urgency_active'),
                t('jobs.urgency_open'),
                t('jobs.urgency_exploring'),
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
              <Text style={styles.questionTitle}>{t('jobs.q3_title')}</Text>
              <Text style={styles.questionSubtitle}>{t('jobs.q3_subtitle')}</Text>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.textInputLarge}
                  value={targetRole}
                  onChangeText={setTargetRole}
                  placeholder={t('jobs.desired_role_placeholder')}
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                />
              </View>

              <Text style={styles.chipsHeading}>{t('jobs.quick_suggestions')}</Text>
              <View style={styles.chipsWrap}>
                {roleSuggestions.map((sug) => (
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
                <Text style={styles.primaryCtaButtonText}>{t('jobs.continue')}</Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          )}

          {/* PASO 4: Modalidad preferida */}
          {quizStep === 3 && (
            <View style={{ gap: Spacing.md }}>
              <Text style={styles.questionTitle}>{t('jobs.q4_title')}</Text>
              <Text style={styles.questionSubtitle}>{t('jobs.q4_subtitle')}</Text>

              {[
                t('jobs.modality_remote'),
                t('jobs.modality_hybrid'),
                t('jobs.modality_onsite'),
                t('jobs.modality_any'),
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
  // PANTALLA 4: ESTADO DE ANÁLISIS IA (mientras corre la llamada real al backend)
  // =========================================================================
  if (stage === 'analyzing') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 20 }} />

          <Text style={styles.analyzingTitle}>{t('jobs.analyzing_title_cv')}</Text>
          <Text style={styles.analyzingSubtitle}>{t('jobs.analyzing_subtitle')}</Text>

          <View style={styles.analyzingStepsList}>
            {/* Paso en curso: subida del PDF + lectura con IA (el spinner refleja la llamada real) */}
            <View style={styles.analyzingStepRow}>
              {isAnalyzingCv ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Feather name="check-circle" size={18} color={Colors.success} />
              )}
              <Text
                style={[
                  styles.analyzingStepText,
                  { color: Colors.textPrimary, fontWeight: '700' },
                ]}
              >
                {t('jobs.analyzing_step_reading_cv')}
              </Text>
            </View>

            {/* Pasos siguientes: quedan pendientes hasta que responde la IA (ahí pasamos a resultados) */}
            <View style={styles.analyzingStepRow}>
              <Feather name="circle" size={18} color={Colors.textMuted} />
              <Text style={styles.analyzingStepText}>{t('jobs.analyzing_step_2')}</Text>
            </View>

            <View style={styles.analyzingStepRow}>
              <Feather name="circle" size={18} color={Colors.textMuted} />
              <Text style={styles.analyzingStepText}>{t('jobs.analyzing_step_3')}</Text>
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
          <Text style={styles.backButtonText}>{t('jobs.menu_jobs')}</Text>
        </TouchableOpacity>

        <Text style={styles.navBarTitle}>{t('jobs.results_title')}</Text>
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
              <Text style={styles.matchPillText}>{t('jobs.objective_search_badge')}</Text>
            </View>
            {stageSource === 'cv' && (
              <View style={[styles.matchPill, { backgroundColor: '#FDF4FF' }]}>
                <Text style={[styles.matchPillText, { color: Colors.accentPink }]}>
                  {t('jobs.based_on_cv')}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.resultsHeading}>
            {t('jobs.results_heading', { role: cleanRole })}
          </Text>
          <Text style={styles.resultsSubheading}>
            {stageSource === 'cv'
              ? t('jobs.results_subheading_cv', { fileName: cvFile?.name })
              : t('jobs.results_subheading_quiz')}
          </Text>
        </View>

        {/* PERFIL REAL EXTRAÍDO POR LA IA DEL PDF */}
        {stageSource === 'cv' && cvAnalysis && (
          <View style={styles.aiProfileCard}>
            <View style={styles.aiProfileHeader}>
              <Feather name="cpu" size={15} color={Colors.primary} />
              <Text style={styles.aiProfileTitle}>{t('jobs.ai_profile_title')}</Text>
            </View>

            <Text style={styles.aiProfileRole}>{cvAnalysis.role}</Text>

            {!!cvAnalysis.seniority && (
              <Text style={styles.aiProfileMeta}>
                <Text style={styles.aiProfileMetaLabel}>{t('jobs.ai_seniority_label')}: </Text>
                {cvAnalysis.seniority}
              </Text>
            )}

            {cvAnalysis.skills.length > 0 && (
              <View style={styles.aiProfileSkillsBlock}>
                <Text style={styles.aiProfileMetaLabel}>{t('jobs.ai_skills_label')}:</Text>
                <View style={styles.aiSkillsWrap}>
                  {cvAnalysis.skills.map((skill, index) => (
                    <View key={`${index}-${skill}`} style={styles.aiSkillChip}>
                      <Text style={styles.aiSkillChipText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {!!cvAnalysis.summary && (
              <Text style={styles.aiProfileSummary}>{cvAnalysis.summary}</Text>
            )}
          </View>
        )}

        {/* AVISO ORIENTATIVO DE VACANTES Y PUESTOS AFINES */}
        <View style={styles.referredNoticeBox}>
          <Feather name="info" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
          <Text style={styles.referredNoticeText}>
            {t('jobs.referred_notice_prefix')}{' '}
            <Text style={{ fontWeight: '800' }}>{`"${cleanRole}"`}</Text>
            {t('jobs.referred_notice_suffix')}
          </Text>
        </View>

        {/* ACCESOS DIRECTOS A PORTALES DE BÚSQUEDA */}
        <Text style={styles.sectionHeading}>{t('jobs.apply_now_heading')}</Text>

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
                <Text style={styles.activeBadgeText}>{t('jobs.active_link')}</Text>
              </View>
            </View>
            <Text style={styles.portalDesc}>
              {isRemote
                ? t('jobs.linkedin_desc_remote', { role: cleanRole })
                : t('jobs.linkedin_desc_local', { role: cleanRole })}
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
                <Text style={styles.activeBadgeText}>{t('jobs.active_link')}</Text>
              </View>
            </View>
            <Text style={styles.portalDesc}>
              {t('jobs.computrabajo_desc', { role: cleanRole })}
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
                <Text style={styles.activeBadgeText}>{t('jobs.active_link')}</Text>
              </View>
            </View>
            <Text style={styles.portalDesc}>{t('jobs.indeed_desc')}</Text>
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
                <Text style={styles.activeBadgeText}>{t('jobs.active_link')}</Text>
              </View>
            </View>
            <Text style={styles.portalDesc}>{t('jobs.bumeran_desc')}</Text>
          </View>
          <Feather name="external-link" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* PITCH DE POSTULACIÓN GENERADO */}
        <View style={styles.pitchCard}>
          <View style={styles.pitchHeader}>
            <View style={styles.pitchTitleRow}>
              <Feather name="message-square" size={16} color={Colors.primary} />
              <Text style={styles.pitchTitle}>{t('jobs.pitch_card_title')}</Text>
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
                {copiedPitch ? t('jobs.copied') : t('jobs.copy')}
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
            <Text style={styles.practiceBannerPre}>{t('jobs.practice_pre')}</Text>
            <Text style={styles.practiceBannerTitle}>
              {t('jobs.practice_title', { role: cleanRole })}
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
            setCvAnalysis(null);
            resetCvAnalysis();
            setCustomRoleFromCv('');
            setTargetRole('');
            setStage('intro');
          }}
          activeOpacity={0.7}
        >
          <Feather name="rotate-ccw" size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.restartText}>{t('jobs.restart')}</Text>
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

  // ── Tarjeta con el perfil extraído por la IA del CV ──────────────────────
  aiProfileCard: {
    backgroundColor: '#F8F7FF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  aiProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiProfileTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
    flex: 1,
  },
  aiProfileRole: {
    fontSize: FontSize.lg,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  aiProfileMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  aiProfileMetaLabel: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.4,
  },
  aiProfileSkillsBlock: {
    gap: 6,
  },
  aiSkillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  aiSkillChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  aiSkillChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  aiProfileSummary: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
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
