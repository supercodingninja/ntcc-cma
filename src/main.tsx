/**
 * ============================================
 * This Area Of Code Is: Module Imports & Dependencies
 * ============================================
 *
 * Explanation:
 * Imports React 18+ root API, React Router for SPA navigation, all Unity
 * Solution services, global context providers, Supabase client, and PWA
 * service worker utilities. This is the single entry point that bootstraps
 * the entire NTCC Music App with Adoración + Unity integration.
 *
 * In Other Words:
 * This is the "ignition key" — it gathers every engine part, every wire,
 * and every dashboard gauge, then turns the key to start the whole car.
 * ============================================
 */

import React, { StrictMode, Suspense, lazy, Component, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// ─── Unity Solution Services ───
import UnityMediaPipe from "./services/UnityMediaPipe";
import UnityConductor from "./services/UnityConductor";
import { UnityMidi } from "./services/UnityMidi";
import { UnityAudio } from "./services/UnityAudio";
import { BeatDetector } from "./lib/beatDetector";
import { instrumentMap } from "./lib/instrumentMap";

// ─── Types & Config ───
import { WORSHIP_DEFAULTS } from "./config/worship";
import type { SongSection, ConductorState } from "./services/UnityConductor";

// ─── Global Contexts ───
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WorshipProvider } from "./contexts/WorshipContext";
import { UnityProvider } from "./contexts/UnityContext";

// ─── Supabase ───
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Lazy-loaded Pages (code splitting) ───
const LandingPage = lazy(() => import("./pages/LandingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SongLibraryPage = lazy(() => import("./pages/SongLibraryPage"));
const SetListPage = lazy(() => import("./pages/SetListPage"));
const ConductorPage = lazy(() => import("./pages/ConductorPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const StageDisplayPage = lazy(() => import("./pages/StageDisplayPage"));

// ─── Layout Components ───
import AppLayout from "./components/AppLayout";
import LoadingScreen from "./components/LoadingScreen";
import CopyrightFooter from "./components/CopyrightFooter";

/**
 * ============================================
 * This Area Of Code Is: Environment Configuration
 * ============================================
 *
 * Explanation:
 * Reads Supabase credentials from environment variables injected at build
 * time by Netlify. Falls back to development placeholders for local testing.
 * All sensitive values are prefixed with VITE_ for Vite bundler compatibility.
 *
 * In Other Words:
 * This is the "secret code reader" — it grabs the database password and API
 * keys from the environment so the app knows where to connect.
 * ============================================
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY || "";

/**
 * ============================================
 * This Area Of Code Is: Supabase Client Initialization
 * ============================================
 *
 * Explanation:
 * Creates a singleton Supabase client for Auth, Database, Storage, and
 * Realtime subscriptions. Uses the anon key for client-side operations.
 * The service key should ONLY be used in Edge Functions, never client-side.
 *
 * In Other Words:
 * This is the "phone line to the cloud" — connects the app to Supabase
 * so users can log in, save songs, and sync in real-time.
 * ============================================
 */

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * ============================================
 * This Area Of Code Is: Global Error Boundary
 * ============================================
 *
 * Explanation:
 * Catches JavaScript errors anywhere in the React component tree, logs them,
 * and displays a fallback UI instead of crashing the entire app. Essential
 * for worship environments where a crash mid-service is unacceptable.
 *
 * In Other Words:
 * This is the "safety net" — if something breaks, instead of the whole app
 * going white and dead, it shows a friendly "oops" screen and lets the user
 * reload without losing their place.
 * ============================================
 */

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Global Error Boundary caught:", error, errorInfo);
    // TODO: Send to error tracking service (Sentry, etc.)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            color: "#e0e0e0",
            fontFamily: "Inter, system-ui, sans-serif",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "3rem", marginBottom: "1rem", color: "#ffd700" }}>
            ⚠️ Something Went Wrong
          </h1>
          <p style={{ fontSize: "1.2rem", marginBottom: "2rem", maxWidth: "500px" }}>
            The NTCC Music App encountered an unexpected error. Please reload
            the page to continue worship.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.1rem",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
            }}
          >
            🔄 Reload App
          </button>
          <CopyrightFooter />
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * ============================================
 * This Area Of Code Is: Protected Route Guard
 * ============================================
 *
 * Explanation:
 * Wrapper component that checks authentication state before rendering
 * protected routes. Redirects unauthenticated users to the landing page.
 * Used for routes that require login (dashboard, library, conductor, etc.).
 *
 * In Other Words:
 * This is the "bouncer at the door" — if you're not logged in, you can't
 * get into the worship team area. It sends you back to the front door.
 * ============================================
 */

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * ============================================
 * This Area Of Code Is: App Router Configuration
 * ============================================
 *
 * Explanation:
 * Defines all application routes with lazy-loaded page components for
 * optimal bundle splitting. Protected routes require authentication.
 * The /stage route is designed for external display/projector output.
 *
 * In Other Words:
 * This is the "GPS navigation" — tells the app what page to show when
 * the user visits /dashboard, /library, /conductor, etc.
 * ============================================
 */

function AppRouter(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingScreen message="Loading..." />}>
              <LandingPage />
            </Suspense>
          }
        />

        {/* Protected Routes with Layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<LoadingScreen message="Loading Dashboard..." />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="/library"
            element={
              <Suspense fallback={<LoadingScreen message="Loading Song Library..." />}>
                <SongLibraryPage />
              </Suspense>
            }
          />
          <Route
            path="/setlist"
            element={
              <Suspense fallback={<LoadingScreen message="Loading Set List..." />}>
                <SetListPage />
              </Suspense>
            }
          />
          <Route
            path="/conductor"
            element={
              <Suspense fallback={<LoadingScreen message="Loading Conductor..." />}>
                <ConductorPage />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<LoadingScreen message="Loading Settings..." />}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>

        {/* Stage Display (no layout, full screen) */}
        <Route
          path="/stage"
          element={
            <Suspense fallback={<LoadingScreen message="Loading Stage Display..." />}>
              <StageDisplayPage />
            </Suspense>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * ============================================
 * This Area Of Code Is: Root App Component
 * ============================================
 *
 * Explanation:
 * The top-level React component that wraps the entire application in
 * global providers: Auth (Supabase), Theme (dark/glassmorphism), Worship
 * (song/setlist state), and Unity (conductor/MIDI state). Also injects
 * global CSS for the glassmorphism dark theme.
 *
 * In Other Words:
 * This is the "main frame of the house" — it holds all the walls, wiring,
 * and plumbing together so every room has power, light, and water.
 * ============================================
 */

function App(): JSX.Element {
  return (
    <StrictMode>
      <GlobalErrorBoundary>
        <SupabaseProvider client={supabase}>
          <AuthProvider>
            <ThemeProvider>
              <WorshipProvider>
                <UnityProvider>
                  <AppRouter />
                </UnityProvider>
              </WorshipProvider>
            </ThemeProvider>
          </AuthProvider>
        </SupabaseProvider>
      </GlobalErrorBoundary>
    </StrictMode>
  );
}

/**
 * ============================================
 * This Area Of Code Is: Supabase Provider Wrapper
 * ============================================
 *
 * Explanation:
 * Simple wrapper that provides the Supabase client instance via React
 * context so child components can access auth, database, and storage
 * without prop drilling.
 *
 * In Other Words:
 * This is the "delivery service" — makes the Supabase connection
 * available to every component that needs it.
 * ============================================
 */

import { createContext, useContext } from "react";

const SupabaseContext = createContext<SupabaseClient | null>(null);

function SupabaseProvider({
  client,
  children,
}: {
  client: SupabaseClient;
  children: ReactNode;
}): JSX.Element {
  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase(): SupabaseClient {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
}

/**
 * ============================================
 * This Area Of Code Is: Global CSS Injection
 * ============================================
 *
 * Explanation:
 * Injects the glassmorphism dark theme CSS variables and base styles
 * directly into the document head. Ensures consistent theming across
 * all components without requiring external CSS file imports.
 *
 * In Other Words:
 * This is the "paint job and wallpaper" — sets the colors, fonts, and
 * glassy translucent effects for the entire app.
 * ============================================
 */

const globalStyles = `
  :root {
    /* NTCC Worship Color Palette */
    --color-primary: #667eea;
    --color-primary-dark: #5a67d8;
    --color-secondary: #764ba2;
    --color-accent: #ffd700;
    --color-accent-soft: #f0e68c;
    --color-background: #0f0f23;
    --color-background-soft: #1a1a2e;
    --color-surface: rgba(255, 255, 255, 0.05);
    --color-surface-hover: rgba(255, 255, 255, 0.1);
    --color-border: rgba(255, 255, 255, 0.1);
    --color-text: #e0e0e0;
    --color-text-muted: #a0a0a0;
    --color-text-inverse: #1a1a2e;
    --color-success: #48bb78;
    --color-warning: #ed8936;
    --color-error: #f56565;
    --color-info: #4299e1;

    /* Glassmorphism */
    --glass-bg: rgba(255, 255, 255, 0.05);
    --glass-bg-strong: rgba(255, 255, 255, 0.1);
    --glass-border: rgba(255, 255, 255, 0.1);
    --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    --glass-blur: blur(12px);

    /* Typography */
    --font-heading: "Cinzel", "Playfair Display", Georgia, serif;
    --font-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: "JetBrains Mono", "Fira Code", "Courier New", monospace;

    /* Spacing */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;
    --space-2xl: 3rem;

    /* Border Radius */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --radius-full: 9999px;

    /* Transitions */
    --transition-fast: 150ms ease;
    --transition-base: 250ms ease;
    --transition-slow: 400ms ease;

    /* Z-Index Scale */
    --z-base: 0;
    --z-dropdown: 100;
    --z-sticky: 200;
    --z-modal: 300;
    --z-popover: 400;
    --z-toast: 500;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    scroll-behavior: smooth;
  }

  body {
    font-family: var(--font-body);
    background: linear-gradient(135deg, var(--color-background) 0%, var(--color-background-soft) 100%);
    color: var(--color-text);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: var(--radius-full);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: var(--radius-full);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  /* Selection */
  ::selection {
    background: rgba(102, 126, 234, 0.3);
    color: var(--color-text);
  }

  /* Focus Styles */
  :focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// Inject styles into document head
const styleElement = document.createElement("style");
styleElement.textContent = globalStyles;
document.head.appendChild(styleElement);

/**
 * ============================================
 * This Area Of Code Is: Service Worker Registration
 * ============================================
 *
 * Explanation:
 * Registers the PWA service worker for offline support, background sync,
 * and install prompts. Only registers in production builds to avoid
 * caching issues during development.
 *
 * In Other Words:
 * This is the "offline mode enabler" — lets the app work without internet
 * and makes it installable on phones and tablets like a native app.
 * ============================================
 */

function registerServiceWorker(): void {
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.error("SW registration failed:", error);
        });
    });
  }
}

/**
 * ============================================
 * This Area Of Code Is: PWA Install Prompt Handler
 * ============================================
 *
 * Explanation:
 * Captures the beforeinstallprompt event so the app can show a custom
 * install banner. Stores the deferred prompt for later use by the UI.
 *
 * In Other Words:
 * This is the "add to home screen" helper — catches the browser's
 * invitation to install the app and saves it for when the user clicks
 * the install button.
 * ============================================
 */

let deferredPrompt: Event | null = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Dispatch custom event for UI components to listen
  window.dispatchEvent(new CustomEvent("pwa:installable"));
});

export function getDeferredPrompt(): Event | null {
  return deferredPrompt;
}

export function clearDeferredPrompt(): void {
  deferredPrompt = null;
}

/**
 * ============================================
 * This Area Of Code Is: Web MIDI API Polyfill Check
 * ============================================
 *
 * Explanation:
 * Checks for Web MIDI API support and requests access if available.
 * Stores the MIDIAccess object globally for UnityMidi to consume.
 * Gracefully handles browsers that don't support MIDI (Safari, Firefox).
 *
 * In Other Words:
 * This is the "MIDI device scanner" — asks the browser "can we talk
 * to keyboards and drum machines?" and remembers the answer.
 * ============================================
 */

let globalMidiAccess: WebMidi.MIDIAccess | null = null;

export async function initializeMidi(): Promise<WebMidi.MIDIAccess | null> {
  if (!navigator.requestMIDIAccess) {
    console.warn("Web MIDI API not supported in this browser");
    return null;
  }

  try {
    globalMidiAccess = await navigator.requestMIDIAccess({
      sysex: false,
      software: true,
    });
    console.log("MIDI access granted:", globalMidiAccess.inputs.size, "inputs");
    return globalMidiAccess;
  } catch (error) {
    console.error("MIDI access denied:", error);
    return null;
  }
}

export function getGlobalMidiAccess(): WebMidi.MIDIAccess | null {
  return globalMidiAccess;
}

/**
 * ============================================
 * This Area Of Code Is: Unity System Initialization
 * ============================================
 *
 * Explanation:
 * Initializes all Unity Solution subsystems in the correct order:
 * MIDI first (for output), then Audio (for sync), then MediaPipe
 * (for input). Exported as a factory function for the UnityContext
 * to consume when the conductor page mounts.
 *
 * In Other Words:
 * This is the "system startup sequence" — turns on MIDI, then audio,
 * then the camera, in exactly the right order so nothing crashes.
 * ============================================
 */

export interface UnitySystemInit {
  mediaPipe: UnityMediaPipe;
  conductor: UnityConductor;
  midi: UnityMidi | null;
  audio: UnityAudio | null;
}

export async function initializeUnitySystem(
  videoElement: HTMLVideoElement,
  canvasElement?: HTMLCanvasElement
): Promise<UnitySystemInit> {
  // Initialize MIDI
  const midiAccess = await initializeMidi();
  const midi = midiAccess ? new UnityMidi() : null;
  if (midi && midiAccess) {
    await midi.initialize(midiAccess);
  }

  // Initialize Audio
  const audio = new UnityAudio();
  await audio.initialize();

  // Initialize MediaPipe
  const mediaPipe = new UnityMediaPipe();
  await mediaPipe.initialize(videoElement, canvasElement);

  // Initialize Conductor (orchestrates everything)
  const conductor = new UnityConductor();
  await conductor.initialize(videoElement, canvasElement, midiAccess || undefined);

  return { mediaPipe, conductor, midi, audio };
}

/**
 * ============================================
 * This Area Of Code Is: Application Mount
 * ============================================
 *
 * Explanation:
 * Finds the root DOM element, creates a React 18 concurrent root, and
 * renders the App component. Also registers the service worker and
 * initializes any global event listeners.
 *
 * In Other Words:
 * This is "showtime" — finds the stage, raises the curtain, and
 * starts the performance.
 * ============================================
 */

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'Root element not found. Ensure <div id="root"></div> exists in index.html'
  );
}

const root = createRoot(rootElement);
root.render(<App />);

// Register PWA service worker
registerServiceWorker();

/**
 * ============================================
 * This Area Of Code Is: Hot Module Replacement
 * ============================================
 *
 * Explanation:
 * Enables Vite's HMR for fast development iteration. Preserves React
 * state across module reloads when possible.
 *
 * In Other Words:
 * This is the "live reload" feature — when you change code, the app
 * updates instantly without losing your place.
 * ============================================
 */

if (import.meta.hot) {
  import.meta.hot.accept();
}

/**
 * ============================================
 * This Area Of Code Is: Copyright & Attribution
 * ============================================
 *
 * Explanation:
 * Legal attribution and branding footer for the NTCC Music App.
 * Required on all source files per project standards.
 *
 * In Other Words:
 * "This code belongs to Rev. Frederick Thomas and was built for NTCC Graham."
 * ============================================
 */

// © 2026 NTCC Music App | 𝑅𝑒𝑣. 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝐷𝑤𝑎𝑦𝑛𝑒 𝑇ℎ𝑜𝑚𝑎𝑠, 𝐽𝑟., 𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Gifted with 🫶🏿 to NTCCA
// SCN Technologies™ | SCNܫܘܐ™ (SCNshava™) | #FindAWay
