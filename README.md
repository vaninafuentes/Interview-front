# Interview App - Frontend

Aplicación móvil **React Native + Expo** para practicar preguntas de entrevistas técnicas. Consume la API REST del backend Spring Boot.

---

## 🏗️ Arquitectura

El proyecto sigue una arquitectura limpia basada en el principio **"Divide y Vencerás"**, separando las responsabilidades en capas bien definidas.

### Estructura de carpetas (`src/`)

```
src/
├── app/            → Rutas de Expo Router (entry points)
│   ├── (auth)/     → Rutas protegidas de autenticación (login, register)
│   └── (tabs)/     → Rutas del menú principal (home, questions, profile)
│
├── components/     → Componentes UI reutilizables y composables via props
│   ├── app-button.tsx     → Botón con variantes (primary, secondary, danger)
│   └── question-card.tsx  → Tarjeta de pregunta de entrevista
│
├── constants/      → Strings y valores constantes centralizados
│   └── api.ts      → URL base y endpoints del backend (nunca hardcodear)
│
├── data/
│   └── api/        → Capa HTTP: funciones puras que llaman al backend via Axios
│       ├── questions-api.ts → GET /api/questions
│       └── auth-api.ts      → POST /login, POST /register
│
├── domain/         → Modelos de negocio (interfaces TypeScript, cero dependencias)
│   ├── question.ts → Tipo Question (espejo del modelo Question.java del backend)
│   └── auth.ts     → Tipos User, AuthSession, LoginPayload, RegisterPayload
│
├── hooks/          → Custom hooks con React Query (conectan data/ con la UI)
│   ├── use-questions.ts → Lista de preguntas con cache automático
│   └── use-auth.tsx     → Sesión del usuario, login, register, logout
│
├── i18n/           → Internacionalización (soporte multilenguaje)
│   ├── index.ts    → Configuración de i18next
│   ├── es.json     → Traducciones en Español (idioma por defecto)
│   └── en.json     → Traducciones en Inglés
│
├── lib/            → Inicialización de librerías de terceros (Singleton)
│   ├── axios.ts    → Cliente Axios configurado con interceptores
│   └── firebase.ts → Esqueleto de Firebase (listo para activar)
│
├── screens/        → Pantallas completas. Patrón Screen (lógica) + View (UI)
│   ├── home/
│   │   ├── home-screen.tsx   → Lógica: obtiene datos del hook, define handlers
│   │   └── home-view.tsx     → UI pura: recibe props, renderiza, usa i18n
│   └── questions/
│       ├── questions-screen.tsx → Lógica: useQuestions(), handlers
│       └── questions-view.tsx   → UI pura: lista de preguntas, estados
│
└── theme/
    └── index.ts    → Design system: Colors, Spacing, FontSize, BorderRadius
```

---

## 📐 Patrones de Código

### 1. Screen + View (Divide y Vencerás)
Cada pantalla se divide en dos archivos:
- **`*-screen.tsx`** → lógica: llama hooks, define handlers, no tiene styles
- **`*-view.tsx`** → UI pura: recibe props, renderiza, sin hooks de datos

```tsx
// ✅ Screen: solo lógica
export default function HomeScreen() {
  const { user, logout } = useAuth();
  return <HomeView user={user} onLogout={logout} />;
}

// ✅ View: solo UI, recibe todo por props
export const HomeView = ({ user, onLogout }: Props) => {
  const { t } = useTranslation();
  return <Text>{t('home.greeting', { name: user?.name })}</Text>;
};
```

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

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
t('questions.title')                          // → "Preguntas de Entrevista"
t('home.greeting', { name: 'Juan' })         // → "Hola, Juan"
t('questions.subtitle_other', { count: 5 }) // → "5 preguntas disponibles"
```

Para agregar un idioma nuevo: crear `src/i18n/pt.json` y registrarlo en `src/i18n/index.ts`.

---

## 🧰 Stack Tecnológico

| Herramienta | Uso |
|---|---|
| **Expo** (~54) | Runner multiplataforma (Android, iOS, Web) |
| **React Native** (0.81) | Framework UI mobile |
| **Expo Router** | Navegación basada en archivos (file-based routing) |
| **TanStack Query v5** | Cache y fetching de datos del servidor |
| **Axios** | Cliente HTTP con interceptores |
| **NativeWind** | Clases Tailwind CSS en React Native |
| **react-i18next** | Internacionalización (ES / EN) |
| **Firebase** | Esqueleto preparado (Auth, Firestore) |
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
- **Emulador Android:** `http://10.0.2.2:8080`
- **iOS Simulator / Web:** `http://localhost:8080`
- **Dispositivo físico:** `http://<TU_IP_LOCAL>:8080`
