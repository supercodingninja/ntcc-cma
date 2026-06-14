/**
 * ============================================
 * This Area Of Code Is: Module Imports & Type Definitions
 * ============================================
 *
 * Explanation:
 * Imports React and defines the LogoBrand component props interface.
 * This component renders the church music ministry brand mark beneath
 * the logo text — "NTCC Graham Spanish Worship Team" — using the
 * mathematical italic Unicode styling per the user's branding standard.
 * It represents the music ministry identity within the NTCC church
 * organization, not the SCN commercial music brand.
 *
 * In Other Words:
 * This is the "church music team signature" under the logo — it says
 * "NTCC Graham Spanish Worship Team" in fancy italic letters to show
 * this is the church's music ministry, not a commercial brand.
 * ============================================
 */

import React from "react";

// ─── Logo Brand Props ───
export interface LogoBrandProps {
  /** Brand text to display — defaults to NTCC Graham Spanish Worship Team */
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
  /** Whether to show the trademark symbol (™) */
  showTrademark?: boolean;
  /** Whether to use mathematical italic Unicode characters */
  useMathItalic?: boolean;
}

/**
 * ============================================
 * This Area Of Code Is: Mode Configuration
 * ============================================
 *
 * Explanation:
 * Defines the default brand text for each deployment mode. NTCC mode
 * uses "NTCC Graham Spanish Worship Team" as the church music ministry
 * identity. Praises.Team mode uses "Praises.Team Worship Collective".
 * Adoración mode uses "Adoración Global Worship". The text uses
 * mathematical italic Unicode characters when useMathItalic is true,
 * matching the user's established branding standard for attribution.
 *
 * In Other Words:
 * This picks the right church music team name for each app version —
 * NTCC Graham for the church app, Praises.Team for the platform,
 * Adoración for the global version.
 * ============================================
 */

const MODE_CONFIG = {
  ntcc: {
    defaultText: "𝑁𝑇𝐶𝐶 𝐺𝑟𝑎ℎ𝑎𝑚 𝑆𝑝𝑎𝑛𝑖𝑠ℎ 𝑊𝑜𝑟𝑠ℎ𝑖𝑝 𝑇𝑒𝑎𝑚",
    plainText: "NTCC Graham Spanish Worship Team",
    fontFamily: "'Cinzel', 'Playfair Display', 'Georgia', serif",
    letterSpacing: "0.06em",
    fontWeight: 400,
  },
  praises: {
    defaultText: "𝑃𝑟𝑎𝑖𝑠𝑒𝑠.𝑇𝑒𝑎𝑚 𝑊𝑜𝑟𝑠ℎ𝑖𝑝 𝐶𝑜𝑙𝑙𝑒𝑐𝑡𝑖𝑣𝑒",
    plainText: "Praises.Team Worship Collective",
    fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
    letterSpacing: "0.04em",
    fontWeight: 300,
  },
  adoracion: {
    defaultText: "𝐴𝑑𝑜𝑟𝑎𝑐𝑖ó𝑛 𝐺𝑙𝑜𝑏𝑎𝑙 𝑊𝑜𝑟𝑠ℎ𝑖𝑝",
    plainText: "Adoración Global Worship",
    fontFamily: "'Playfair Display', 'Cinzel', 'Georgia', serif",
    letterSpacing: "0.05em",
    fontWeight: 400,
  },
};

/**
 * ============================================
 * This Area Of Code Is: Accent Color Mapping
 * ============================================
 *
 * Explanation:
 * Maps each brand mode to its signature accent color for the brand
 * mark. NTCC uses gold (#f59e0b) to match church worship colors.
 * Praises.Team uses purple (#9333ea) for the unified platform.
 * Adoración uses warm amber (#fbbf24) for global worship warmth.
 *
 * In Other Words:
 * This picks the right accent color for each church music brand —
 * gold for NTCC, purple for Praises.Team, amber for Adoración.
 * ============================================
 */

const ACCENT_COLORS = {
  ntcc: "#f59e0b",
  praises: "#9333ea",
  adoracion: "#fbbf24",
};

/**
 * ============================================
 * This Area Of Code Is: LogoBrand Component
 * ============================================
 *
 * Explanation:
 * Renders the church music ministry brand mark as a subscript beneath
 * the logo text. Uses mathematical italic Unicode characters for the
 * NTCC church brand when useMathItalic is enabled (default true), matching
 * the user's established attribution style. The font size is the smallest
 * in the logo hierarchy (typically 20-25% of primary size). Supports
 * staggered animation with a longer delay for cascading entrance effects.
 * The trademark symbol is optional and defaults to false for church
 * ministry contexts (™ reserved for commercial SCN brands).
 *
 * In Other Words:
 * This draws the tiny church music team name at the bottom — like
 * "NTCC Graham Spanish Worship Team" in fancy italic letters —
 * small, accent-colored, fades in last.
 * ============================================
 */

export function LogoBrand({
  text,
  mode = "ntcc",
  size = 24,
  color,
  className = "",
  style = {},
  animate = true,
  showTrademark = false,
  useMathItalic = true,
}: LogoBrandProps): JSX.Element {
  const config = MODE_CONFIG[mode];
  const displayText = text ?? (useMathItalic ? config.defaultText : config.plainText);
  const accentColor = ACCENT_COLORS[mode];

  // ─── Brand mark is 22% of primary size, with responsive clamp ───
  const fontSize = `clamp(${size * 0.18}px, ${size * 0.015}vw + ${size * 0.14}px, ${size * 0.28}px)`;

  return (
    <>
      <span
        className={`logo-brand ${className}`}
        style={{
          fontFamily: config.fontFamily,
          fontSize,
          fontWeight: config.fontWeight,
          fontStyle: "italic",
          letterSpacing: config.letterSpacing,
          color: color ?? `var(--logo-brand-color, ${accentColor})`,
          lineHeight: 1.4,
          whiteSpace: "nowrap",
          userSelect: "none",
          flexShrink: 0,
          display: "block",
          marginTop: "2px",
          ...(animate && {
            animation: "logoBrandFadeIn 0.5s ease-out 0.45s both",
          }),
          ...style,
        }}
        aria-label={config.plainText}
      >
        {displayText}
        {showTrademark && (
          <sup
            style={{
              fontSize: "0.5em",
              lineHeight: 0,
              verticalAlign: "super",
              marginLeft: "2px",
            }}
          >
            ™
          </sup>
        )}
      </span>

      {/* ─── Animation keyframes ─── */}
      <style>{`
        @keyframes logoBrandFadeIn {
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
 * Pre-configured exports for each brand mode. LogoBrandNTCC,
 * LogoBrandPraises, and LogoBrandAdoracion are ready-to-use with mode,
 * default text, and accent color pre-set. For NTCC church contexts,
 * the trademark is omitted by default to reflect ministry (non-commercial)
 * branding.
 *
 * In Other Words:
 * Shortcuts — import LogoBrandNTCC and it already says
 * "NTCC Graham Spanish Worship Team" with the right gold color.
 * ============================================
 */

export function LogoBrandNTCC(
  props: Omit<LogoBrandProps, "mode" | "text">
): JSX.Element {
  return <LogoBrand mode="ntcc" text="𝑁𝑇𝐶𝐶 𝐺𝑟𝑎ℎ𝑎𝑚 𝑆𝑝𝑎𝑛𝑖𝑠ℎ 𝑊𝑜𝑟𝑠ℎ𝑖𝑝 𝑇𝑒𝑎𝑚" showTrademark={false} {...props} />;
}

export function LogoBrandPraises(
  props: Omit<LogoBrandProps, "mode" | "text">
): JSX.Element {
  return <LogoBrand mode="praises" text="𝑃𝑟𝑎𝑖𝑠𝑒𝑠.𝑇𝑒𝑎𝑚 𝑊𝑜𝑟𝑠ℎ𝑖𝑝 𝐶𝑜𝑙𝑙𝑒𝑐𝑡𝑖𝑣𝑒" {...props} />;
}

export function LogoBrandAdoracion(
  props: Omit<LogoBrandProps, "mode" | "text">
): JSX.Element {
  return <LogoBrand mode="adoracion" text="𝐴𝑑𝑜𝑟𝑎𝑐𝑖ó𝑛 𝐺𝑙𝑜𝑏𝑎𝑙 𝑊𝑜𝑟𝑠ℎ𝑖𝑝" {...props} />;
}

/**
 * ============================================
 * This Area Of Code Is: Copyright & Attribution
 * ============================================
 *
 * Explanation:
 * Legal attribution for the NTCC Music App. The SCN Technologies™
 * credit acknowledges the development company, while the primary
 * attribution honors the church ministry context. The SCNshava™
 * music brand is intentionally excluded as this is a church ministry
 * project, not a commercial music release.
 *
 * In Other Words:
 * "This code was built by Rev. Frederick Thomas for NTCC Graham's
 * Spanish Worship Team. Developed by SCN Technologies, but this is
 * church ministry, not a music product."
 * ============================================
 */

// © 2026 NTCC Music App | 𝑅𝑒𝑣. 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝐷𝑤𝑎𝑦𝑛𝑒 𝑇ℎ𝑜𝑚𝑎𝑠, 𝐽𝑟., 𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Gifted with 🫶🏿 to NTCCA
// SCN Technologies™ | NTCC Graham Spanish Worship Team | #FindAWay
