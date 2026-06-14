/**
 * ============================================
 * This Area Of Code Is: Module Imports & Type Definitions
 * ============================================
 *
 * Explanation:
 * Imports React and defines the LogoTextTagline component props interface.
 * This component renders a short tagline or motto ("#FindAWay",
 * "Unity Solution™", "Worship Without Borders") beneath the secondary
 * descriptor. It uses an accent color, italic styling, and the smallest
 * font size in the logo hierarchy to add brand personality without
 * competing with the primary or secondary text.
 *
 * In Other Words:
 * This is the "catchphrase" under the subtitle — like "#FindAWay" or
 * "Unity Solution™" — in a small, italic, accent-colored font.
 * ============================================
 */

import React from "react";

// ─── Logo Text Tagline Props ───
export interface LogoTextTaglineProps {
  /** The tagline text to display */
  text?: string;
  /** Visual mode: "ntcc" | "praises" | "adoracion" */
  mode?: "ntcc" | "praises" | "adoracion";
  /** Base font size in pixels (responsive scaling applied) */
  size?: number;
  /** Override color — defaults to theme-accent CSS variable */
  color?: string;
  /** Additional CSS class names */
  className?: string;
  /** Inline styles override */
  style?: React.CSSProperties;
  /** Animation on mount */
  animate?: boolean;
  /** Whether to show the trademark symbol (™) after the text */
  showTrademark?: boolean;
}

/**
 * ============================================
 * This Area Of Code Is: Mode Configuration
 * ============================================
 *
 * Explanation:
 * Defines the default tagline text and typography settings for each
 * brand mode. NTCC uses "#FindAWay" as the motto. Praises.Team uses
 * "Unity Solution™". Adoración uses "Worship Without Borders".
 * These taglines reinforce the unique value proposition of each brand.
 *
 * In Other Words:
 * This picks the right catchphrase for each brand — "#FindAWay" for
 * NTCC, "Unity Solution™" for Praises.Team, "Worship Without Borders"
 * for Adoración.
 * ============================================
 */

const MODE_CONFIG = {
  ntcc: {
    defaultText: "#FindAWay",
    fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
    letterSpacing: "0.12em",
    fontWeight: 500,
    fontStyle: "italic" as const,
    textTransform: "none" as const,
  },
  praises: {
    defaultText: "Unity Solution™",
    fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
    letterSpacing: "0.08em",
    fontWeight: 400,
    fontStyle: "normal" as const,
    textTransform: "none" as const,
  },
  adoracion: {
    defaultText: "Worship Without Borders",
    fontFamily: "'Playfair Display', 'Georgia', serif",
    letterSpacing: "0.06em",
    fontWeight: 400,
    fontStyle: "italic" as const,
    textTransform: "none" as const,
  },
};

/**
 * ============================================
 * This Area Of Code Is: Accent Color Mapping
 * ============================================
 *
 * Explanation:
 * Maps each brand mode to its signature accent color for the tagline.
 * NTCC uses gold (#f59e0b) to match church worship colors. Praises.Team
 * uses purple (#9333ea) for tech innovation. Adoración uses warm amber
 * (#fbbf24) for global worship warmth. These colors are applied when
 * no explicit color override is provided.
 *
 * In Other Words:
 * This picks the right accent color for each brand's catchphrase —
 * gold for church, purple for tech, amber for worship.
 * ============================================
 */

const ACCENT_COLORS = {
  ntcc: "#f59e0b",
  praises: "#9333ea",
  adoracion: "#fbbf24",
};

/**
 * ============================================
 * This Area Of Code Is: LogoTextTagline Component
 * ============================================
 *
 * Explanation:
 * Renders the brand tagline with responsive sizing, mode-aware styling,
 * and accent color theming. The font size is the smallest in the logo
 * hierarchy (typically 25-30% of primary size). The component supports
 * an optional trademark symbol suffix and staggered animation with a
 * longer delay than the secondary text for a cascading entrance effect.
 *
 * In Other Words:
 * This draws the tiny catchphrase at the bottom — smallest text, accent
 * color, fades in last for a nice cascading logo animation.
 * ============================================
 */

export function LogoTextTagline({
  text,
  mode = "ntcc",
  size = 24,
  color,
  className = "",
  style = {},
  animate = true,
  showTrademark = false,
}: LogoTextTaglineProps): JSX.Element {
  const config = MODE_CONFIG[mode];
  const displayText = text ?? config.defaultText;
  const accentColor = ACCENT_COLORS[mode];

  // ─── Tagline is 28% of primary size, with responsive clamp ───
  const fontSize = `clamp(${size * 0.22}px, ${size * 0.018}vw + ${size * 0.18}px, ${size * 0.35}px)`;

  return (
    <>
      <span
        className={`logo-text-tagline ${className}`}
        style={{
          fontFamily: config.fontFamily,
          fontSize,
          fontWeight: config.fontWeight,
          fontStyle: config.fontStyle,
          letterSpacing: config.letterSpacing,
          textTransform: config.textTransform,
          color: color ?? `var(--logo-accent-color, ${accentColor})`,
          lineHeight: 1.3,
          whiteSpace: "nowrap",
          userSelect: "none",
          flexShrink: 0,
          ...(animate && {
            animation: "logoTextTaglineFadeIn 0.5s ease-out 0.35s both",
          }),
          ...style,
        }}
        aria-label={displayText}
      >
        {displayText}
        {showTrademark && (
          <sup
            style={{
              fontSize: "0.6em",
              lineHeight: 0,
              verticalAlign: "super",
              marginLeft: "1px",
            }}
          >
            ™
          </sup>
        )}
      </span>

      {/* ─── Animation keyframes ─── */}
      <style>{`
        @keyframes logoTextTaglineFadeIn {
          0% {
            opacity: 0;
            transform: translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

/**
 * ============================================
 * This Area Of Code Is: Convenience Exports
 * ============================================
 *
 * Explanation:
 * Pre-configured exports for each brand mode. LogoTextTaglineNTCC,
 * LogoTextTaglinePraises, and LogoTextTaglineAdoracion are ready-to-use
 * with mode, default text, and accent color pre-set.
 *
 * In Other Words:
 * Shortcuts — import LogoTextTaglineNTCC and it already says
 * "#FindAWay" with the right gold color and styling.
 * ============================================
 */

export function LogoTextTaglineNTCC(
  props: Omit<LogoTextTaglineProps, "mode" | "text">
): JSX.Element {
  return <LogoTextTagline mode="ntcc" text="#FindAWay" {...props} />;
}

export function LogoTextTaglinePraises(
  props: Omit<LogoTextTaglineProps, "mode" | "text">
): JSX.Element {
  return <LogoTextTagline mode="praises" text="Unity Solution™" showTrademark {...props} />;
}

export function LogoTextTaglineAdoracion(
  props: Omit<LogoTextTaglineProps, "mode" | "text">
): JSX.Element {
  return <LogoTextTagline mode="adoracion" text="Worship Without Borders" {...props} />;
}

/**
 * ============================================
 * This Area Of Code Is: Copyright & Attribution
 * ============================================
 */

// © 2026 NTCC Music App | 𝑅𝑒𝑣. 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝐷𝑤𝑎𝑦𝑛𝑒 𝑇ℎ𝑜𝑚𝑎𝑠, 𝐽𝑟., 𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Gifted with 🫶🏿 to NTCCA
// SCN Technologies™ | SCNܫܘܐ™ (SCNshava™) | #FindAWay
