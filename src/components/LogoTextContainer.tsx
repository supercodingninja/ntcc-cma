/**
 * ============================================
 * This Area Of Code Is: Module Imports & Type Definitions
 * ============================================
 *
 * Explanation:
 * Imports React and defines the LogoTextContainer component props interface.
 * This component is a layout container that vertically stacks the three
 * text elements of the logo: primary brand name (LogoTextMain), secondary
 * descriptor (LogoTextSub), and tagline (LogoTextTagline). It handles
 * spacing, alignment, and responsive behavior for the entire text block.
 *
 * In Other Words:
 * This is the "box" that holds all three lines of logo text — it makes
 * sure they stack neatly, spaced properly, and aligned together.
 * ============================================
 */

import React from "react";

// ─── Logo Text Container Props ───
export interface LogoTextContainerProps {
  /** Visual mode: "ntcc" | "praises" | "adoracion" */
  mode?: "ntcc" | "praises" | "adoracion";
  /** Base font size for all child text elements */
  size?: number;
  /** Override primary text */
  mainText?: string;
  /** Override secondary text */
  subText?: string;
  /** Override tagline text */
  taglineText?: string;
  /** Whether to show the tagline */
  showTagline?: boolean;
  /** Whether to show the secondary text */
  showSub?: boolean;
  /** Whether to use gradient on primary text */
  gradient?: boolean;
  /** Whether to show trademark on tagline */
  showTrademark?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Inline styles override */
  style?: React.CSSProperties;
  /** Animation on mount */
  animate?: boolean;
  /** Gap between text lines in pixels */
  gap?: number;
  /** Horizontal alignment: "left" | "center" | "right" */
  align?: "left" | "center" | "right";
}

/**
 * ============================================
 * This Area Of Code Is: LogoTextContainer Component
 * ============================================
 *
 * Explanation:
 * Renders a flex column that stacks LogoTextMain, LogoTextSub, and
 * LogoTextTagline with configurable gap spacing and alignment. The
 * component accepts all text overrides and passes them down to child
 * components. It also supports conditional rendering of the sub and
 * tagline elements. The container uses CSS custom properties for
 * gap and alignment so parent themes can override without prop drilling.
 *
 * In Other Words:
 * This puts the big name, subtitle, and catchphrase into a neat
 * vertical stack with the right spacing and alignment.
 * ============================================
 */

export function LogoTextContainer({
  mode = "ntcc",
  size = 24,
  mainText,
  subText,
  taglineText,
  showTagline = true,
  showSub = true,
  gradient = false,
  showTrademark = false,
  className = "",
  style = {},
  animate = true,
  gap = 2,
  align = "left",
}: LogoTextContainerProps): JSX.Element {
  // ─── Alignment mapping ───
  const alignMap = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  return (
    <div
      className={`logo-text-container ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: alignMap[align],
        gap: `${gap}px`,
        lineHeight: 1,
        ...(animate && {
          animation: "logoTextContainerFadeIn 0.4s ease-out both",
        }),
        ...style,
      }}
      aria-label={`${mainText ?? mode} logo text`}
    >
      {/* ─── Primary Brand Text ─── */}
      <LogoTextMain
        text={mainText}
        mode={mode}
        size={size}
        gradient={gradient}
        animate={animate}
      />

      {/* ─── Secondary Descriptor ─── */}
      {showSub && (
        <LogoTextSub
          text={subText}
          mode={mode}
          size={size}
          animate={animate}
        />
      )}

      {/* ─── Tagline / Motto ─── */}
      {showTagline && (
        <LogoTextTagline
          text={taglineText}
          mode={mode}
          size={size}
          showTrademark={showTrademark}
          animate={animate}
        />
      )}

      {/* ─── Container entrance animation ─── */}
      <style>{`
        @keyframes logoTextContainerFadeIn {
          0% {
            opacity: 0;
            transform: translateX(-6px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * ============================================
 * This Area Of Code Is: Convenience Exports
 * ============================================
 *
 * Explanation:
 * Pre-configured exports for each brand mode. LogoTextContainerNTCC,
 * LogoTextContainerPraises, and LogoTextContainerAdoracion are ready-to-use
 * with mode, default texts, and styling pre-set.
 *
 * In Other Words:
 * Shortcuts — import LogoTextContainerNTCC and it already shows
 * "NTCC / Music App / #FindAWay" with the right styling.
 * ============================================
 */

export function LogoTextContainerNTCC(
  props: Omit<LogoTextContainerProps, "mode" | "mainText" | "subText" | "taglineText">
): JSX.Element {
  return (
    <LogoTextContainer
      mode="ntcc"
      mainText="NTCC"
      subText="Music App"
      taglineText="#FindAWay"
      {...props}
    />
  );
}

export function LogoTextContainerPraises(
  props: Omit<LogoTextContainerProps, "mode" | "mainText" | "subText" | "taglineText">
): JSX.Element {
  return (
    <LogoTextContainer
      mode="praises"
      mainText="Praises.Team"
      subText="Worship Platform"
      taglineText="Unity Solution™"
      showTrademark
      {...props}
    />
  );
}

export function LogoTextContainerAdoracion(
  props: Omit<LogoTextContainerProps, "mode" | "mainText" | "subText" | "taglineText">
): JSX.Element {
  return (
    <LogoTextContainer
      mode="adoracion"
      mainText="Adoración"
      subText="Global Worship"
      taglineText="Worship Without Borders"
      {...props}
    />
  );
}

/**
 * ============================================
 * This Area Of Code Is: Copyright & Attribution
 * ============================================
 */

// © 2026 NTCC Music App | 𝑅𝑒𝑣. 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝐷𝑤𝑎𝑦𝑛𝑒 𝑇ℎ𝑜𝑚𝑎𝑠, 𝐽𝑟., 𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Gifted with 🫶🏿 to NTCCA
// SCN Technologies™ | SCNܫܘܐ™ (SCNshava™) | #FindAWay
