/**
 * ============================================
 * This Area Of Code Is: Module Imports & Type Definitions
 * ============================================
 *
 * Explanation:
 * Imports React and defines the LogoTextSub component props interface.
 * This component renders the secondary descriptor text ("Music App",
 * "Worship", "Global Platform") beneath the primary brand name. It uses
 * a muted color, smaller font size, and lighter weight to create visual
 * hierarchy within the logo assembly.
 *
 * In Other Words:
 * This is the "small subtitle" under the big brand name — like
 * "Music App" under "NTCC" — in a lighter, smaller font.
 * ============================================
 */

import React from "react";

// ─── Logo Text Sub Props ───
export interface LogoTextSubProps {
  /** The secondary text to display */
  text?: string;
  /** Visual mode: "ntcc" | "praises" | "adoracion" */
  mode?: "ntcc" | "praises" | "adoracion";
  /** Base font size in pixels (responsive scaling applied) */
  size?: number;
  /** Override color — defaults to theme-muted CSS variable */
  color?: string;
  /** Additional CSS class names */
  className?: string;
  /** Inline styles override */
  style?: React.CSSProperties;
  /** Animation on mount */
  animate?: boolean;
}

/**
 * ============================================
 * This Area Of Code Is: Mode Configuration
 * ============================================
 *
 * Explanation:
 * Defines the default secondary text and typography settings for each
 * brand mode. NTCC uses "Music App" as the descriptor. Praises.Team
 * uses "Worship Platform". Adoración uses "Global Worship". These
 * defaults ensure the logo always has meaningful context text.
 *
 * In Other Words:
 * This picks the right subtitle for each brand — "Music App" for NTCC,
 * "Worship Platform" for Praises.Team, "Global Worship" for Adoración.
 * ============================================
 */

const MODE_CONFIG = {
  ntcc: {
    defaultText: "Music App",
    fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
    letterSpacing: "0.15em",
    fontWeight: 400,
    textTransform: "uppercase" as const,
  },
  praises: {
    defaultText: "Worship Platform",
    fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
    letterSpacing: "0.1em",
    fontWeight: 300,
    textTransform: "none" as const,
  },
  adoracion: {
    defaultText: "Global Worship",
    fontFamily: "'Playfair Display', 'Georgia', serif",
    letterSpacing: "0.08em",
    fontWeight: 400,
    textTransform: "none" as const,
  },
};

/**
 * ============================================
 * This Area Of Code Is: LogoTextSub Component
 * ============================================
 *
 * Explanation:
 * Renders the secondary brand descriptor with responsive sizing and
 * mode-aware styling. The font size is calculated as a ratio of the
 * primary text size (typically 0.4x to 0.5x) to maintain visual
 * hierarchy. The color defaults to a muted theme variable so it
 * recedes visually behind the primary text. Supports animation
 * with a slight delay for staggered entrance effects.
 *
 * In Other Words:
 * This draws the small subtitle — it stays smaller and lighter than
 * the big brand name, and fades in slightly after for a nice effect.
 * ============================================
 */

export function LogoTextSub({
  text,
  mode = "ntcc",
  size = 24,
  color,
  className = "",
  style = {},
  animate = true,
}: LogoTextSubProps): JSX.Element {
  const config = MODE_CONFIG[mode];
  const displayText = text ?? config.defaultText;

  // ─── Secondary text is 40% of primary size, with responsive clamp ───
  const fontSize = `clamp(${size * 0.3}px, ${size * 0.025}vw + ${size * 0.25}px, ${size * 0.5}px)`;

  return (
    <>
      <span
        className={`logo-text-sub ${className}`}
        style={{
          fontFamily: config.fontFamily,
          fontSize,
          fontWeight: config.fontWeight,
          letterSpacing: config.letterSpacing,
          textTransform: config.textTransform,
          color: color ?? "var(--logo-text-muted, #94a3b8)",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          userSelect: "none",
          flexShrink: 0,
          ...(animate && {
            animation: "logoTextSubFadeIn 0.5s ease-out 0.2s both",
          }),
          ...style,
        }}
        aria-label={displayText}
      >
        {displayText}
      </span>

      {/* ─── Animation keyframes ─── */}
      <style>{`
        @keyframes logoTextSubFadeIn {
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
 * Pre-configured exports for each brand mode to reduce boilerplate.
 * LogoTextSubNTCC, LogoTextSubPraises, and LogoTextSubAdoracion are
 * ready-to-use components with mode and default text pre-set.
 *
 * In Other Words:
 * Shortcuts — import LogoTextSubNTCC and it already says "Music App"
 * with the right NTCC styling.
 * ============================================
 */

export function LogoTextSubNTCC(
  props: Omit<LogoTextSubProps, "mode" | "text">
): JSX.Element {
  return <LogoTextSub mode="ntcc" text="Music App" {...props} />;
}

export function LogoTextSubPraises(
  props: Omit<LogoTextSubProps, "mode" | "text">
): JSX.Element {
  return <LogoTextSub mode="praises" text="Worship Platform" {...props} />;
}

export function LogoTextSubAdoracion(
  props: Omit<LogoTextSubProps, "mode" | "text">
): JSX.Element {
  return <LogoTextSub mode="adoracion" text="Global Worship" {...props} />;
}

/**
 * ============================================
 * This Area Of Code Is: Copyright & Attribution
 * ============================================
 */

// © 2026 NTCC Music App | 𝑅𝑒𝑣. 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝐷𝑤𝑎𝑦𝑛𝑒 𝑇ℎ𝑜𝑚𝑎𝑠, 𝐽𝑟., 𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Gifted with 🫶🏿 to NTCCA
// SCN Technologies™ | SCNܫܘܐ™ (SCNshava™) | #FindAWay
