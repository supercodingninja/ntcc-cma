/**
 * ============================================
 * This Area Of Code Is: Module Imports & Re-exports
 * ============================================
 *
 * Explanation:
 * Re-exports all LogoText sub-components from a single entry point.
 * This is the public API for the LogoText module — consumers import
 * from this file rather than individual sub-component files. It also
 * provides the main LogoText orchestrator component that assembles
 * all text elements with mode-switching logic for NTCC, Praises.Team,
 * and Adoración brand contexts.
 *
 * In Other Words:
 * This is the "front door" for all logo text — you import from here
 * and get everything: the big name, subtitle, tagline, and shortcuts.
 * ============================================
 */

import React from "react";

// ─── Re-export all sub-components ───
export {
  LogoTextMain,
  LogoTextMainNTCC,
  LogoTextMainPraises,
  LogoTextMainAdoracion,
  type LogoTextMainProps,
} from "./LogoTextMain";

export {
  LogoTextSub,
  LogoTextSubNTCC,
  LogoTextSubPraises,
  LogoTextSubAdoracion,
  type LogoTextSubProps,
} from "./LogoTextSub";

export {
  LogoTextTagline,
  LogoTextTaglineNTCC,
  LogoTextTaglinePraises,
  LogoTextTaglineAdoracion,
  type LogoTextTaglineProps,
} from "./LogoTextTagline";

export {
  LogoTextContainer,
  LogoTextContainerNTCC,
  LogoTextContainerPraises,
  LogoTextContainerAdoracion,
  type LogoTextContainerProps,
} from "./LogoTextContainer";

// ─── Logo Text Orchestrator Props ───
export interface LogoTextProps {
  /** Visual mode: "ntcc" | "praises" | "adoracion" */
  mode?: "ntcc" | "praises" | "adoracion";
  /** Base font size for all text elements */
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
 * This Area Of Code Is: LogoText Orchestrator
 * ============================================
 *
 * Explanation:
 * The main LogoText component that consumers use when they need the
 * complete text portion of the logo. It delegates to LogoTextContainer
 * for layout and passes all props through. This component exists to
 * provide a single, memorable import (LogoText) while keeping the
 * implementation modular. It also serves as the documentation anchor
 * for the entire LogoText subsystem.
 *
 * In Other Words:
 * This is the "one button" that shows all the logo text at once —
 * just import LogoText and it handles the rest.
 * ============================================
 */

export function LogoText({
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
}: LogoTextProps): JSX.Element {
  return (
    <LogoTextContainer
      mode={mode}
      size={size}
      mainText={mainText}
      subText={subText}
      taglineText={taglineText}
      showTagline={showTagline}
      showSub={showSub}
      gradient={gradient}
      showTrademark={showTrademark}
      className={className}
      style={style}
      animate={animate}
      gap={gap}
      align={align}
    />
  );
}

/**
 * ============================================
 * This Area Of Code Is: Pre-configured Mode Exports
 * ============================================
 *
 * Explanation:
 * Ready-to-use LogoText components pre-configured for each brand mode.
 * LogoTextNTCC, LogoTextPraises, and LogoTextAdoracion eliminate the
 * need to pass mode props repeatedly. They are the recommended imports
 * for most use cases.
 *
 * In Other Words:
 * These are the "preset buttons" — LogoTextNTCC already knows to show
 * "NTCC / Music App / #FindAWay" without any extra configuration.
 * ============================================
 */

export function LogoTextNTCC(
  props: Omit<LogoTextProps, "mode" | "mainText" | "subText" | "taglineText">
): JSX.Element {
  return (
    <LogoText
      mode="ntcc"
      mainText="NTCC"
      subText="Music App"
      taglineText="#FindAWay"
      {...props}
    />
  );
}

export function LogoTextPraises(
  props: Omit<LogoTextProps, "mode" | "mainText" | "subText" | "taglineText" | "showTrademark">
): JSX.Element {
  return (
    <LogoText
      mode="praises"
      mainText="Praises.Team"
      subText="Worship Platform"
      taglineText="Unity Solution™"
      showTrademark
      {...props}
    />
  );
}

export function LogoTextAdoracion(
  props: Omit<LogoTextProps, "mode" | "mainText" | "subText" | "taglineText">
): JSX.Element {
  return (
    <LogoText
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
