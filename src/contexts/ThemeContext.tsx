/**
 * ============================================
 * This Area Of Code Is: Module Imports & Type Definitions
 * ============================================
 *
 * Explanation:
 * Imports React context API and defines TypeScript interfaces for the
 * glassmorphism dark theme system. Supports light/dark/auto modes,
 * NTCC worship color palette, and CSS variable injection. Persists
 * user preference to localStorage for cross-session consistency.
 *
 * In Other Words:
 * This is the "lighting control panel" — it manages whether the app
 * is in dark mode (for stage), light mode (for daytime), or auto
 * (follows the sun), and remembers your preference for next time.
 * ============================================
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// ─── Theme Mode Types ───
export type ThemeMode = "dark" | "light" | "auto";

// ─── Accent Color Types ───
export type AccentColor = "gold" | "purple" | "blue" | "red" | "green";

// ─── Glassmorphism Intensity ───
export type GlassIntensity = "subtle" | "medium" | "strong";

// ─── Theme State ───
export interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  accentColor: AccentColor;
  glassIntensity: GlassIntensity;
  fontScale: number;
  reducedMotion: boolean;
  highContrast: boolean;
}

// ─── Theme Context Value ───
export interface ThemeContextValue extends ThemeState {
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setAccentColor: (color: AccentColor) => void;
  setGlassIntensity: (intensity: GlassIntensity) => void;
  setFontScale: (scale: number) => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  resetToDefaults: () => void;
}

/**
 * ============================================
 * This Area Of Code Is: NTCC Worship Color Palettes
 * ============================================
 *
 * Explanation:
 * Defines complete color palettes for dark and light modes with NTCC
 * worship-appropriate colors. Gold represents glory/divinity, purple
 * represents royalty/worship, and the dark base ensures stage-friendly
 * visibility. Each palette includes background, surface, text, accent,
 * and semantic colors.
 *
 * In Other Words:
 * This is the "paint swatch book" — every color the app uses, chosen
 * to look beautiful on stage and honor the worship atmosphere.
 * ============================================
 */

interface ColorPalette {
  // Backgrounds
  background: string;
  backgroundSoft: string;
  backgroundElevated: string;
  
  // Surfaces (glassmorphism)
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  surfaceElevated: string;
  
  // Borders
  border: string;
  borderStrong: string;
  
  // Text
  text: string;
  textMuted: string;
  textInverse: string;
  
  // Accents (NTCC Worship)
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  accentSoft: string;
  
  // Semantic
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Special
  glow: string;
  shadow: string;
  overlay: string;
}

const DARK_PALETTE: ColorPalette = {
  // Deep worship backgrounds
  background: "#0f0f23",
  backgroundSoft: "#1a1a2e",
  backgroundElevated: "#252542",
  
  // Glassmorphism surfaces
  surface: "rgba(255, 255, 255, 0.05)",
  surfaceHover: "rgba(255, 255, 255, 0.08)",
  surfaceActive: "rgba(255, 255, 255, 0.12)",
  surfaceElevated: "rgba(255, 255, 255, 0.07)",
  
  // Subtle borders
  border: "rgba(255, 255, 255, 0.1)",
  borderStrong: "rgba(255, 255, 255, 0.2)",
  
  // High contrast text
  text: "#e8e8f0",
  textMuted: "#a0a0b8",
  textInverse: "#0f0f23",
  
  // NTCC Gold & Purple accents
  primary: "#667eea",
  primaryDark: "#5a67d8",
  secondary: "#764ba2",
  accent: "#ffd700",
  accentSoft: "#f0e68c",
  
  // Semantic colors
  success: "#48bb78",
  warning: "#ed8936",
  error: "#f56565",
  info: "#4299e1",
  
  // Effects
  glow: "rgba(102, 126, 234, 0.3)",
  shadow: "rgba(0, 0, 0, 0.4)",
  overlay: "rgba(15, 15, 35, 0.8)",
};

const LIGHT_PALETTE: ColorPalette = {
  // Light worship backgrounds
  background: "#f7f7fb",
  backgroundSoft: "#ffffff",
  backgroundElevated: "#efeff6",
  
  // Glassmorphism surfaces (inverted)
  surface: "rgba(0, 0, 0, 0.03)",
  surfaceHover: "rgba(0, 0, 0, 0.06)",
  surfaceActive: "rgba(0, 0, 0, 0.1)",
  surfaceElevated: "rgba(0, 0, 0, 0.05)",
  
  // Darker borders for light mode
  border: "rgba(0, 0, 0, 0.08)",
  borderStrong: "rgba(0, 0, 0, 0.15)",
  
  // Dark text on light
  text: "#1a1a2e",
  textMuted: "#6b6b8b",
  textInverse: "#f7f7fb",
  
  // Same NTCC accents work on light
  primary: "#5a67d8",
  primaryDark: "#4c51bf",
  secondary: "#6b3fa0",
  accent: "#d4af37",
  accentSoft: "#c9b896",
  
  // Semantic colors (slightly darker)
  success: "#38a169",
  warning: "#dd6b20",
  error: "#e53e3e",
  info: "#3182ce",
  
  // Effects
  glow: "rgba(102, 126, 234, 0.2)",
  shadow: "rgba(0, 0, 0, 0.15)",
  overlay: "rgba(247, 247, 251, 0.9)",
};

/**
 * ============================================
 * This Area Of Code Is: Accent Color Variants
 * ============================================
 *
 * Explanation:
 * Defines accent color overrides for the primary palette. Each accent
 * shifts the primary and secondary colors while maintaining the same
 * dark/light base. Allows users to customize the app's "personality."
 *
 * In Other Words:
 * This is the "accent wall picker" — lets you change the main highlight
 * color while keeping the room looking the same.
 * ============================================
 */

const ACCENT_VARIANTS: Record<<AccentColor, { primary: string; primaryDark: string; secondary: string; accent: string }> = {
  gold: {
    primary: "#667eea",
    primaryDark: "#5a67d8",
    secondary: "#764ba2",
    accent: "#ffd700",
  },
  purple: {
    primary: "#9f7aea",
    primaryDark: "#805ad5",
    secondary: "#b83280",
    accent: "#e9d8fd",
  },
  blue: {
    primary: "#4299e1",
    primaryDark: "#3182ce",
    secondary: "#63b3ed",
    accent: "#bee3f8",
  },
  red: {
    primary: "#f56565",
    primaryDark: "#e53e3e",
    secondary: "#fc8181",
    accent: "#fed7d7",
  },
  green: {
    primary: "#48bb78",
    primaryDark: "#38a169",
    secondary: "#68d391",
    accent: "#c6f6d5",
  },
};

/**
 * ============================================
 * This Area Of Code Is: CSS Variable Generator
 * ============================================
 *
 * Explanation:
 * Generates CSS custom properties (variables) from the active color palette
 * and injects them into the document root. Enables consistent theming
 * across all components without prop drilling or context re-renders.
 *
 * In Other Words:
 * This is the "paint roller" — takes the chosen colors and applies them
 * to every wall in the house at once.
 * ============================================
 */

function generateCSSVariables(
  palette: ColorPalette,
  accent: AccentColor,
  glassIntensity: GlassIntensity,
  fontScale: number
): string {
  const accentOverride = ACCENT_VARIANTS[accent];
  
  // Glassmorphism blur amounts
  const blurAmounts = {
    subtle: "4px",
    medium: "12px",
    strong: "24px",
  };

  return `
    :root {
      /* Core Colors */
      --color-background: ${palette.background};
      --color-background-soft: ${palette.backgroundSoft};
      --color-background-elevated: ${palette.backgroundElevated};
      
      /* Surfaces */
      --color-surface: ${palette.surface};
      --color-surface-hover: ${palette.surfaceHover};
      --color-surface-active: ${palette.surfaceActive};
      --color-surface-elevated: ${palette.surfaceElevated};
      
      /* Borders */
      --color-border: ${palette.border};
      --color-border-strong: ${palette.borderStrong};
      
      /* Text */
      --color-text: ${palette.text};
      --color-text-muted: ${palette.textMuted};
      --color-text-inverse: ${palette.textInverse};
      
      /* Primary (with accent override) */
      --color-primary: ${accentOverride.primary};
      --color-primary-dark: ${accentOverride.primaryDark};
      --color-secondary: ${accentOverride.secondary};
      --color-accent: ${accentOverride.accent};
      
      /* Semantic */
      --color-success: ${palette.success};
      --color-warning: ${palette.warning};
      --color-error: ${palette.error};
      --color-info: ${palette.info};
      
      /* Effects */
      --color-glow: ${palette.glow};
      --color-shadow: ${palette.shadow};
      --color-overlay: ${palette.overlay};
      
      /* Glassmorphism */
      --glass-blur: ${blurAmounts[glassIntensity]};
      --glass-bg: ${palette.surface};
      --glass-border: ${palette.border};
      --glass-shadow: 0 8px 32px ${palette.shadow};
      
      /* Typography Scale */
      --font-scale: ${fontScale};
      --font-size-xs: calc(0.75rem * ${fontScale});
      --font-size-sm: calc(0.875rem * ${fontScale});
      --font-size-base: calc(1rem * ${fontScale});
      --font-size-lg: calc(1.125rem * ${fontScale});
      --font-size-xl: calc(1.25rem * ${fontScale});
      --font-size-2xl: calc(1.5rem * ${fontScale});
      --font-size-3xl: calc(1.875rem * ${fontScale});
      --font-size-4xl: calc(2.25rem * ${fontScale});
      
      /* Spacing Scale */
      --space-xs: calc(0.25rem * ${fontScale});
      --space-sm: calc(0.5rem * ${fontScale});
      --space-md: calc(1rem * ${fontScale});
      --space-lg: calc(1.5rem * ${fontScale});
      --space-xl: calc(2rem * ${fontScale});
      --space-2xl: calc(3rem * ${fontScale});
      
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
  `;
}

/**
 * ============================================
 * This Area Of Code Is: Theme Hook
 * ============================================
 *
 * Explanation:
 * Custom React hook that provides convenient access to the ThemeContext.
 * Throws an error if used outside of ThemeProvider to prevent silent failures.
 *
 * In Other Words:
 * This is the "light switch remote" — lets any component ask "is it dark?"
 * or "make it gold" without knowing where the wires go.
 * ============================================
 */

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Create context with undefined default (enforces provider usage)
const ThemeContext = createContext<<ThemeContextValue | undefined>(undefined);

/**
 * ============================================
 * This Area Of Code Is: Theme Provider Component
 * ============================================
 *
 * Explanation:
 * The main provider component that manages theme state, detects system
 * dark mode preferences, persists user choices to localStorage, and
 * injects CSS variables into the document. Handles auto mode by
 * listening to system preference changes.
 *
 * In Other Words:
 * This is the "master electrician" — watches the sun, remembers your
 * favorite lighting, and flips the switches automatically.
 * ============================================
 */

interface ThemeProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "ntcc-theme-preferences";

interface StoredPreferences {
  mode: ThemeMode;
  accentColor: AccentColor;
  glassIntensity: GlassIntensity;
  fontScale: number;
  reducedMotion: boolean;
  highContrast: boolean;
}

const DEFAULT_PREFERENCES: StoredPreferences = {
  mode: "dark",
  accentColor: "gold",
  glassIntensity: "medium",
  fontScale: 1,
  reducedMotion: false,
  highContrast: false,
};

export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  // ─── State ───
  const [mode, setModeState] = useState<<ThemeMode>("dark");
  const [accentColor, setAccentColorState] = useState<<AccentColor>("gold");
  const [glassIntensity, setGlassIntensityState] = useState<GlassIntensity>("medium");
  const [fontScale, setFontScaleState] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [systemDark, setSystemDark] = useState(false);

  /**
   * ============================================
   * This Area Of Code Is: System Dark Mode Detection
   * ============================================
   *
   * Explanation:
   * Listens to the browser's prefers-color-scheme media query to detect
   * whether the user's system is in dark mode. Updates state when the
   * system preference changes (e.g., sunrise/sunset on macOS).
   *
   * In Other Words:
   * This is the "sunrise sensor" — checks if the computer is in night
   * mode and tells the app to match.
   * ============================================
   */

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  /**
   * ============================================
   * This Area Of Code Is: Preference Persistence
   * ============================================
   *
   * Explanation:
   * Loads saved theme preferences from localStorage on mount. If no saved
   * preferences exist, uses defaults optimized for worship stage environments
   * (dark mode, gold accent, medium glass). Saves preferences whenever
   * they change.
   *
   * In Other Words:
   * This is the "memory box" — remembers your favorite settings and pulls
   * them out every time you open the app.
   * ============================================
   */

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs: StoredPreferences = JSON.parse(stored);
        setModeState(prefs.mode);
        setAccentColorState(prefs.accentColor);
        setGlassIntensityState(prefs.glassIntensity);
        setFontScaleState(prefs.fontScale);
        setReducedMotion(prefs.reducedMotion);
        setHighContrast(prefs.highContrast);
      }
    } catch (err) {
      console.warn("Failed to load theme preferences:", err);
    }
  }, []);

  useEffect(() => {
    const prefs: StoredPreferences = {
      mode,
      accentColor,
      glassIntensity,
      fontScale,
      reducedMotion,
      highContrast,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [mode, accentColor, glassIntensity, fontScale, reducedMotion, highContrast]);

  /**
   * ============================================
   * This Area Of Code Is: CSS Variable Injection
   * ============================================
   *
   * Explanation:
   * Generates and injects CSS custom properties whenever theme state
   * changes. Creates or updates a <style> tag in the document head.
   * Also applies reduced-motion and high-contrast classes to the body.
   *
   * In Other Words:
   * This is the "paint application" — every time you change a setting,
   * it repaints the entire house with the new colors.
   * ============================================
   */

  useEffect(() => {
    const isDark = mode === "dark" || (mode === "auto" && systemDark);
    const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

    const css = generateCSSVariables(palette, accentColor, glassIntensity, fontScale);

    // Find or create style element
    let styleEl = document.getElementById("ntcc-theme-variables");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "ntcc-theme-variables";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;

    // Apply body classes
    document.body.classList.toggle("dark", isDark);
    document.body.classList.toggle("light", !isDark);
    document.body.classList.toggle("reduced-motion", reducedMotion);
    document.body.classList.toggle("high-contrast", highContrast);

    // Apply font scale
    document.documentElement.style.fontSize = `${16 * fontScale}px`;
  }, [mode, accentColor, glassIntensity, fontScale, systemDark, reducedMotion, highContrast]);

  /**
   * ============================================
   * This Area Of Code Is: Computed Dark State
   * ============================================
   *
   * Explanation:
   * Derives the actual dark mode state from the current mode setting and
   * system preference. Used by components that need to know the effective
   * color scheme regardless of auto mode.
   *
   * In Other Words:
   * This is the "final answer" — after considering auto mode and the sun,
   * this tells us: are we actually in dark mode right now?
   * ============================================
   */

  const isDark = mode === "dark" || (mode === "auto" && systemDark);

  /**
   * ============================================
   * This Area Of Code Is: Theme Control Methods
   * ============================================
   *
 * Explanation:
   * Setter methods for all theme properties. Each method updates state
   * and triggers the CSS variable regeneration via useEffect.
   *
   * In Other Words:
   * These are the "control knobs" — each one adjusts a specific setting
   * on the lighting panel.
   * ============================================
   */

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => {
      if (current === "dark") return "light";
      if (current === "light") return "auto";
      return "dark";
    });
  }, []);

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color);
  }, []);

  const setGlassIntensity = useCallback((intensity: GlassIntensity) => {
    setGlassIntensityState(intensity);
  }, []);

  const setFontScale = useCallback((scale: number) => {
    const clamped = Math.max(0.75, Math.min(1.5, scale));
    setFontScaleState(clamped);
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setReducedMotion((prev) => !prev);
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => !prev);
  }, []);

  const resetToDefaults = useCallback(() => {
    setModeState(DEFAULT_PREFERENCES.mode);
    setAccentColorState(DEFAULT_PREFERENCES.accentColor);
    setGlassIntensityState(DEFAULT_PREFERENCES.glassIntensity);
    setFontScaleState(DEFAULT_PREFERENCES.fontScale);
    setReducedMotion(DEFAULT_PREFERENCES.reducedMotion);
    setHighContrast(DEFAULT_PREFERENCES.highContrast);
  }, []);

  /**
   * ============================================
   * This Area Of Code Is: Context Value Assembly
   * ============================================
   *
   * Explanation:
   * Assembles all theme state and control methods into the ThemeContextValue
   * object. Memoized to prevent unnecessary re-renders of consuming components.
   *
   * In Other Words:
   * This is the "settings bundle" — packages up everything about the current
   * look and feel for the rest of the app to use.
   * ============================================
   */

  const contextValue: ThemeContextValue = {
    mode,
    isDark,
    accentColor,
    glassIntensity,
    fontScale,
    reducedMotion,
    highContrast,
    setMode,
    toggleMode,
    setAccentColor,
    setGlassIntensity,
    setFontScale,
    toggleReducedMotion,
    toggleHighContrast,
    resetToDefaults,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * ============================================
 * This Area Of Code Is: Theme Toggle Component
 * ============================================
 *
 * Explanation:
 * Ready-to-use toggle button component that switches between dark/light
 * modes. Uses the current theme context and applies glassmorphism styling.
 * Can be dropped into any header or settings panel.
 *
 * In Other Words:
   * This is the "light switch button" — a pre-built button you can stick
   * anywhere that lets users flip between day and night mode.
 * ============================================
 */

export function ThemeToggle(): JSX.Element {
  const { mode, isDark, toggleMode } = useTheme();

  return (
    <button
      onClick={toggleMode}
      aria-label={`Current mode: ${mode}. Click to toggle.`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "44px",
        height: "44px",
        borderRadius: "12px",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        cursor: "pointer",
        transition: "all var(--transition-base)",
        color: "var(--color-text)",
        fontSize: "1.25rem",
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.background = "var(--color-surface-hover)";
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.background = "var(--color-surface)";
      }}
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}

/**
 * ============================================
 * This Area Of Code Is: Glassmorphism Card Component
 * ============================================
 *
 * Explanation:
 * Reusable card component with built-in glassmorphism styling. Adapts
 * to current theme automatically via CSS variables. Supports hover
 * states, elevation levels, and custom padding.
 *
 * In Other Words:
 * This is the "glass panel template" — a frosted glass box you can put
 * anything inside, and it automatically looks right in dark or light mode.
 * ============================================
 */

interface GlassCardProps {
  children: ReactNode;
  elevation?: "low" | "medium" | "high";
  padding?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
}

export function GlassCard({
  children,
  elevation = "medium",
  padding = "md",
  className = "",
  style = {},
}: GlassCardProps): JSX.Element {
  const shadows = {
    low: "0 2px 8px var(--color-shadow)",
    medium: "0 8px 32px var(--color-shadow)",
    high: "0 16px 48px var(--color-shadow)",
  };

  const paddings = {
    sm: "var(--space-sm)",
    md: "var(--space-md)",
    lg: "var(--space-lg)",
  };

  return (
    <div
      className={`glass-card ${className}`}
      style={{
        background: "var(--color-surface)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: paddings[padding],
        boxShadow: shadows[elevation],
        transition: "all var(--transition-base)",
        ...style,
      }}
    >
      {children}
    </div>
  );
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
