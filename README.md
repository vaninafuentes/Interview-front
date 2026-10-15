# Interview App - Frontend

Aplicación móvil **React Native + Expo** para practicar entrevistas de trabajo con IA: simulacros con voz y cronómetro, banco de preguntas, análisis de CV y búsqueda de empleo. Consume la API REST del backend Spring Boot.

---

## 🏗️ Arquitectura

El proyecto sigue una arquitectura limpia basada en el principio **"Divide y Vencerás"**, separando las responsabilidades en capas bien definidas.

### Estructura de carpetas (`app/` + `src/`)

`app/` (Expo Router) está en la **raíz del repo**, no dentro de `src/`.

```
app/                → Rutas de Expo Router (entry points)
├── _layout.tsx     → Providers globales (TanStack Query + Auth) y redirección según sesión
├── index.tsx       → Redirige a /home o /login según el estado de autenticación
├── (auth)/         → Rutas de autenticación (login, register)
└── (tabs)/         → Menú principal: home, interview, jobs y profile
                      (questions existe como ruta pero está oculta del tab bar → href: null)

src/                → Lógica y UI de la aplicación
├── components/     → Componentes UI reutilizables y composables via props
│   ├── app-button.tsx     → Botón con variantes (primary, secondary, danger)
│   ├── app-input.tsx      → Input con label y mensaje de error
│   └── question-card.tsx  → Tarjeta de pregunta de entrevista
│
├── constants/      → Strings y valores constantes centralizados
│   └── api.ts      → URL base y endpoints del backend (nunca hardcodear)
│
├── data/
│   └── api/        → Capa HTTP: funciones puras que llaman al backend via Axios
│       ├── questions-api.ts → GET /api/questions, GET /api/questions/:id
│       ├── auth-api.ts      → POST /api/auth/login, POST /api/auth/register
│       ├── interview-api.ts → POST /api/interview/generate, /evaluate, /hint
│       │                      + GET /api/interview/history, /stats
│       └── cv-api.ts        → POST /api/cv/analyze (PDF, multipart)
│
├── domain/         → Modelos de negocio (interfaces TypeScript, cero dependencias)
│   ├── question.ts → Tipo Question (espejo del modelo Question.java del backend)
│   ├── auth.ts     → Tipos User, AuthSession, LoginPayload, RegisterPayload
│   ├── interview.ts → Tipos del simulacro (preguntas generadas, feedback, estadísticas)
│   └── cv.ts       → Tipo CvAnalysisResponse (análisis del CV)
│
├── hooks/          → Custom hooks con React Query (conectan data/ con la UI)
│   ├── use-auth.tsx     → Sesión del usuario, login, register, logout
│   ├── use-questions.ts → Lista de preguntas con cache automático
│   ├── use-interview.ts + use-generate-questions.ts → Generar preguntas y evaluar respuestas
│   ├── use-interview-history.ts + use-interview-stats.ts → Historial y racha/estadísticas
│   └── use-analyze-cv.ts → Análisis del CV en PDF con IA
│
├── i18n/           → Internacionalización (soporte multilenguaje)
│   ├── index.ts    → Configuración de i18next
│   ├── es.json     → Traducciones en Español (idioma por defecto)
│   └── en.json     → Traducciones en Inglés
│
├── lib/            → Inicialización de librerías de terceros (Singleton)
│   ├── axios.ts    → Cliente Axios configurado con interceptores (401 → logout)
│   └── auth-events.ts → Canal de eventos que desacopla axios de use-auth
│
├── screens/        → Pantallas completas. Patrón Screen (lógica) + View (UI)
│   ├── home/       → home-screen.tsx + home-view.tsx
│   ├── questions/  → questions-screen.tsx + questions-view.tsx
│   ├── interview/  → interview-screen.tsx + interview-view.tsx
│   │                  (+ components/ con grabadora de voz, cronómetro y visualizador)
│   ├── auth/       → login-screen.tsx, register-screen.tsx
│   ├── jobs/       → jobs-screen.tsx (CV + links de postulación)
│   └── profile/    → profile-screen.tsx (perfil, racha y logout)
│
└── theme/
    └── index.ts    → Design system: Colors, Spacing, FontSize, BorderRadius
```

---

## 📐 Patrones de Código

### 1. Screen + View (Divide y Vencerás)
Las pantallas del flujo principal (home, questions, interview) se dividen en dos archivos:
- **`*-screen.tsx`** → lógica: llama hooks, define handlers, no tiene styles
- **`*-view.tsx`** → UI pura: recibe props, renderiza, sin hooks de datos

```tsx
// ✅ Screen: solo lógica
export default function HomeScreen() {
  const { user } = useAuth();
  const { stats, isLoading: isStatsLoading, refetch: refetchStats } = useInterviewStats();
  return (
    <HomeView
      user={user}
      stats={stats}
      isStatsLoading={isStatsLoading}
      onRefreshStats={refetchStats}
    />
  );
}

// ✅ View: solo UI, recibe todo por props
export const HomeView = ({ user, stats, isStatsLoading, onRefreshStats }: HomeViewProps) => {
  const { t } = useTranslation();
  return <Text>{t('home.hero_heading')}</Text>;
};
```

auth, jobs y profile concentran lógica y UI en un único `*-screen.tsx` (el logout, por ejemplo, vive en `profile-screen.tsx`).

### 2. Condicionales limpios
```tsx
// ✅ && para renderizado condicional simple
isLoading && <ActivityIndicator />;

// ✅ Ternario para if/else
isError ? <ErrorView /> : <QuestionsList />;

// ❌ Evitar if blocks para condicionales de UI simples
```

### 3. Composición por Props
```tsx
// ✅ El componente se configura desde afuera via props
<AppButton title="Guardar" variant="primary" isLoading={isSaving} onPress={save} />
<QuestionCard question={item} onPress={handlePress} />
```

### 4. Programación Funcional (sin clases)
```tsx
// ✅ Solo funciones, .map, .filter, .reduce
const filtered = questions.filter((q) => q.category === 'React');
const ids = questions.map((q) => q.id);

// ❌ Sin clases
```

### 5. Axios (Patrón Facade)
```tsx
// src/lib/axios.ts → instancia única y configurada
// src/data/api/questions-api.ts → usa el cliente, devuelve tipos del dominio

export const fetchQuestions = (): Promise<Question[]> =>
  axiosClient.get<Question[]>(API_ENDPOINTS.questions.getAll).then((res) => res.data);
```

---

## 🌍 Internacionalización (i18n)

Todos los textos de la app están en `src/i18n/es.json` y `src/i18n/en.json`.
La migración está completa: **341 claves** en español, en paridad exacta con inglés, y todo el texto de la UI se renderiza via `t()`.

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
t('questions.title')                                  // → "Banco de Preguntas"
t('interview.question_of', { current: 1, total: 5 })  // → "Pregunta 1 de 5"
t('questions.subtitle', { count: 5 })                 // → "5 preguntas disponibles para practicar"
```

Para agregar un idioma nuevo: crear `src/i18n/pt.json` y registrarlo en `src/i18n/index.ts`.

---

## 🧰 Stack Tecnológico

| Herramienta | Uso |
|---|---|
| **Expo** (~57.0.0) | Runner multiplataforma (Android, iOS, Web) |
| **React Native** (0.86.3) | Framework UI mobile |
| **Expo Router** | Navegación basada en archivos (file-based routing) |
| **TanStack Query v5** | Cache y fetching de datos del servidor |
| **Axios** | Cliente HTTP con interceptores |
| **NativeWind** | Integración de Tailwind CSS (el estilado actual usa `src/theme` + StyleSheet) |
| **react-i18next** | Internacionalización (ES / EN) |
| **expo-speech / expo-speech-recognition** | Lectura de la pregunta en voz alta y dictado de respuestas |
| **expo-document-picker** | Selección del CV en PDF para el análisis con IA |
| **AsyncStorage** | Persistencia local (sesión de usuario) |
| **TypeScript** | Tipado estático end-to-end |

---

## 🚀 Cómo ejecutar

```bash
# Instalar dependencias
npm install

# Iniciar en Android
npm run android

# Iniciar en iOS
npm run ios

# Iniciar en Web
npm run web
```

---

## 🔗 Backend

La API REST está en `Interview-back` (Spring Boot + MySQL).

URL base configurada en `src/constants/api.ts`:
- **Web:** `http://localhost:8080`
- **Expo Go (dispositivo físico o emulador):** la IP se detecta automáticamente desde Metro (`Constants.expoConfig.hostUri`); la PC y el celular deben estar en la misma red WiFi
- **Fallback sin Expo Go:** emulador Android `http://10.0.2.2:8080`, iOS Simulator `http://localhost:8080`
