/**
 * ============================================
 * This Area Of Code Is: Module Imports & Type Definitions
 * ============================================
 *
 * Explanation:
 * Imports React and defines the LogoTextMain component props interface.
 * This component renders the primary brand text ("NTCC" or "Praises.Team")
 * with responsive font scaling, weight variations, and theme-aware colors.
 * It is a pure presentational component used inside the Logo assembly.
 *
 * In Other Words:
 * This is the "big name" part of your logo — it shows "NTCC" or "Praises.Team"
 * in large, bold text that shrinks or grows depending on the screen size.
 * ============================================
 */

import React from "react";

// ─── Logo Text Main Props ───
export interface LogoTextMainProps {
  /** The primary text to display — defaults to "NTCC" */
  text?: string;
  /** Visual mode: "ntcc" | "praises" | "adoracion" */
  mode?: "ntcc" | "praises" | "adoracion";
  /** Base font size in pixels (responsive scaling applied) */
  size?: number;
  /** Override color — defaults to theme-aware CSS variable */
  color?: string;
  /** Additional CSS class names */
  className?: string;
  /** Inline styles override */
  style?: React.CSSProperties;
  /** Whether to apply gradient text effect */
  gradient?: boolean;
  /** Animation on mount */
  animate?: boolean;
}

/**
 * ============================================
 * This Area Of Code Is: Mode Configuration
 * ============================================
 *
 * Explanation:
 * Defines the text content, font family, and letter spacing for each
 * brand mode. NTCC mode uses a bold condensed look. Praises.Team uses
 * a slightly more open, modern feel. Adoración uses elegant serif styling.
 * These configurations ensure brand consistency across deployments.
 *
 * In Other Words:
 * This is the "style guide" for each brand name — NTCC looks bold and
 * strong, Praises.Team looks modern and open, Adoración looks elegant.
 * ============================================
 */

const MODE_CONFIG = {
  ntcc: {
    defaultText: "NTCC",
    fontFamily: "'Cinzel', 'Playfair Display', 'Georgia', serif",
    letterSpacing: "0.08em",
    fontWeight: 700,
    textTransform: "uppercase" as const,
  },
  praises: {
    defaultText: "Praises.Team",
    fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
    letterSpacing: "0.02em",
    fontWeight: 600,
    textTransform: "none" as const,
  },
  adoracion: {
    defaultText: "Adoración",
    fontFamily: "'Playfair Display', 'Cinzel', 'Georgia', serif",
    letterSpacing: "0.04em",
    fontWeight: 500,
    textTransform: "none" as const,
  },
};

/**
 * ============================================
 * This Area Of Code Is: Gradient Definitions
 * ============================================
 *
 * Explanation:
 * Defines CSS linear-gradient values for each brand mode when the
 * gradient prop is enabled. NTCC uses purple-to-gold (church colors).
 * Praises.Team uses blue-to-purple (tech-forward). Adoración uses
 * warm gold-to-amber (worship warmth). These gradients are applied
 * via background-clip: text for a modern, premium look.
 *
 * In Other Words:
 * This is the "fancy color fade" for the text — purple-to-gold for
 * church, blue-to-purple for tech, gold-to-amber for worship.
 * ============================================
 */

const GRADIENTS = {
  ntcc: "linear-gradient(135deg, #9333ea 0%, #f59e0b 100%)",
  praises: "linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)",
  adoracion: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)",
};

/**
 * ============================================
 * This Area Of Code Is: LogoTextMain Component
 * ============================================
 *
 * Explanation:
 * Renders the primary brand text with responsive sizing, mode-aware
 * styling, and optional gradient effect. The component calculates
 * responsive font sizes using clamp() for fluid scaling across devices.
 * On mobile, the text scales down proportionally. On desktop, it
 * reaches a comfortable reading size. The gradient mode uses
 * background-clip: text with a fallback solid color for browsers
 * that do not support the feature.
 *
 * In Other Words:
 * This draws the big brand name — "NTCC" or "Praises.Team" — in a
 * size that looks good on phones, tablets, and computers, with
 * optional fancy color fading.
 * ============================================
 */

export function LogoTextMain({
  text,
  mode = "ntcc",
  size = 24,
  color,
  className = "",
  style = {},
  gradient = false,
  animate = true,
}: LogoTextMainProps): JSX.Element {
  const config = MODE_CONFIG[mode];
  const displayText = text ?? config.defaultText;
  const gradientValue = GRADIENTS[mode];

  // ─── Responsive font size using clamp(min, preferred, max) ───
  // Mobile: 0.75x base | Tablet: 1x base | Desktop: 1.25x base
  const fontSize = `clamp(${size * 0.75}px, ${size * 0.0625}vw + ${size * 0.5}px, ${size * 1.25}px)`;

  const baseStyles: React.CSSProperties = {
    fontFamily: config.fontFamily,
    fontSize,
    fontWeight: config.fontWeight,
    letterSpacing: config.letterSpacing,
    textTransform: config.textTransform,
    lineHeight: 1.1,
    whiteSpace: "nowrap",
    userSelect: "none",
    flexShrink: 0,
    ...(animate && {
      animation: "logoTextFadeIn 0.5s ease-out 0.1s both",
    }),
    ...style,
  };

  // ─── Gradient text styling ───
  const gradientStyles: React.CSSProperties = gradient
    ? {
        background: gradientValue,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        color: "transparent",
      }
    : {
        color: color ?? "var(--logo-text-color, #f8fafc)",
      };

  return (
    <>
      <span
        className={`logo-text-main ${className}`}
        style={{ ...baseStyles, ...gradientStyles }}
        aria-label={displayText}
      >
        {displayText}
      </span>

      {/* ─── Animation keyframes (injected once per mount) ─── */}
      <style>{`
        @keyframes logoTextFadeIn {
          0% {
            opacity: 0;
            transform: translateY(-4px);
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
 * Pre-configured exports for each brand mode to reduce boilerplate
 * in parent components. Instead of passing mode="ntcc" every time,
 * consumers can import LogoTextMainNTCC, LogoTextMainPraises, or
 * LogoTextMainAdoracion directly.
 *
 * In Other Words:
 * These are "shortcuts" — instead of typing mode="ntcc" every time,
 * you can just use LogoTextMainNTCC and it already knows the style.
 * ============================================
 */

export function LogoTextMainNTCC(
  props: Omit<LogoTextMainProps, "mode" | "text">
): JSX.Element {
  return <LogoTextMain mode="ntcc" text="NTCC" {...props} />;
}

export function LogoTextMainPraises(
  props: Omit<LogoTextMainProps, "mode" | "text">
): JSX.Element {
  return <LogoTextMain mode="praises" text="Praises.Team" {...props} />;
}

export function LogoTextMainAdoracion(
  props: Omit<LogoTextMainProps, "mode" | "text">
): JSX.Element {
  return <LogoTextMain mode="adoracion" text="Adoración" {...props} />;
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
