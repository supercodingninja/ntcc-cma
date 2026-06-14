/**
 * ============================================
 * This Area Of Code Is: Module Imports & Component Setup
 * ============================================
 *
 * Explanation:
 * Imports React and all logo sub-components (LogoIcon, LogoTextMain,
 * LogoTextSub, LogoTextTagline, LogoBrand, LogoLink) to assemble the
 * complete NTCC Music App logo. This is the orchestrator component
 * that combines the SVG icon, primary text, secondary descriptor,
 * tagline, church brand mark, and clickable link wrapper into a
 * single cohesive logo element. The component uses a glassmorphism
 * container with backdrop-filter blur for the modern aesthetic.
 *
 * In Other Words:
 * This is the "master logo builder" — it takes all the pieces
 * (icon, text, brand, link) and puts them together into one
 * beautiful glassmorphism logo box.
 * ============================================
 */

import React from "react";

// ─── Logo Sub-Components ───
import { LogoIcon } from "./LogoIcon";
import { LogoTextMain } from "./LogoTextMain";
import { LogoTextSub } from "./LogoTextSub";
import { LogoTextTagline } from "./LogoTextTagline";
import { LogoBrand } from "./LogoBrand";
import { LogoLink } from "./LogoLink";

// ─── Logo Props ───
export interface LogoProps {
  /** Visual mode: "ntcc" | "praises" | "adoracion" */
  mode?: "ntcc" | "praises" | "adoracion";
  /** Overall logo size multiplier (affects all sub-components) */
  size?: number;
  /** Whether the user is authenticated — controls link destination */
  isAuthenticated?: boolean;
  /** Whether to show the glassmorphism container background */
  glassmorphism?: boolean;
  /** Whether to show the church brand mark (NTCC Graham Spanish Worship Team) */
  showBrand?: boolean;
  /** Whether to show the tagline */
  showTagline?: boolean;
  /** Whether to show the secondary text */
  showSub?: boolean;
  /** Whether to use gradient on primary text */
  gradient?: boolean;
  /** Whether to animate on mount */
  animate?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Inline styles override */
  style?: React.CSSProperties;
  /** Custom click handler */
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  /** External URL override for the link */
  externalUrl?: string;
  /** Whether the logo is disabled (non-clickable) */
  disabled?: boolean;
  /** Layout direction: "horizontal" (icon left, text right) or "vertical" (icon top, text bottom) */
  layout?: "horizontal" | "vertical";
  /** Gap between icon and text in pixels */
  gap?: number;
}

/**
 * ============================================
 * This Area Of Code Is: Glassmorphism Container Styles
 * ============================================
 *
 * Explanation:
 * Defines the CSS styles for the glassmorphism container that wraps
 * the logo. Uses backdrop-filter: blur() for the frosted glass effect,
 * semi-transparent background, subtle border, and box-shadow for depth.
 * The container adapts its padding and border-radius based on the layout
 * direction (horizontal vs vertical). These styles are applied inline
 * to ensure they work without external CSS dependencies.
 *
 * In Other Words:
 * This is the "fancy glass box" style — frosted glass look with
 * blur, transparency, and soft shadows that makes the logo look
 * modern and premium.
 * ============================================
 */

const getContainerStyles = (
  glassmorphism: boolean,
  layout: "horizontal" | "vertical",
  gap: number
): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: layout === "horizontal" ? "row" : "column",
    alignItems: "center",
    justifyContent: "center",
    gap: `${gap}px`,
    textDecoration: "none",
    color: "inherit",
  };

  if (!glassmorphism) {
    return baseStyles;
  }

  return {
    ...baseStyles,
    padding: layout === "horizontal" ? "8px 16px" : "12px 16px",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
    transition: "all 0.3s ease",
  };
};

/**
 * ============================================
 * This Area Of Code Is: Logo Component
 * ============================================
 *
 * Explanation:
 * The main Logo orchestrator component that assembles all sub-components
 * into a complete, clickable logo element. It renders the LogoIcon SVG,
 * LogoTextMain (primary brand name), LogoTextSub (secondary descriptor),
 * LogoTextTagline (motto), and optionally LogoBrand (church ministry mark)
 * inside a LogoLink wrapper. The layout can be horizontal (icon left of text)
 * or vertical (icon above text). The glassmorphism container provides the
 * modern frosted-glass aesthetic. All props are passed down to sub-components
 * with sensible defaults for the NTCC Music App context.
 *
 * In Other Words:
 * This is the COMPLETE logo — icon, name, subtitle, tagline, church brand,
 * all wrapped in a glass box that you can click to go home. This is what
 * shows up in the header of the app.
 * ============================================
 */

export function Logo({
  mode = "ntcc",
  size = 24,
  isAuthenticated = false,
  glassmorphism = true,
  showBrand = true,
  showTagline = true,
  showSub = true,
  gradient = false,
  animate = true,
  className = "",
  style = {},
  onClick,
  externalUrl,
  disabled = false,
  layout = "horizontal",
  gap = 10,
}: LogoProps): JSX.Element {
  const containerStyles = getContainerStyles(glassmorphism, layout, gap);

  // ─── Icon size scales with overall logo size ───
  const iconSize = Math.round(size * 1.8);

  return (
    <LogoLink
      isAuthenticated={isAuthenticated}
      onClick={onClick}
      externalUrl={externalUrl}
      disabled={disabled}
      ariaLabel={`NTCC Music App logo — go to ${isAuthenticated ? "dashboard" : "home"}`}
    >
      <div
        className={`logo ${className}`}
        style={{
          ...containerStyles,
          ...style,
        }}
      >
        {/* ─── Logo Icon (SVG cross + note + SCN mark) ─── */}
        <LogoIcon
          size={iconSize}
          animate={animate}
        />

        {/* ─── Text Stack (Main + Sub + Tagline + Brand) ─── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: layout === "horizontal" ? "flex-start" : "center",
            gap: "1px",
          }}
        >
          {/* Primary brand name: "NTCC" */}
          <LogoTextMain
            mode={mode}
            size={size}
            gradient={gradient}
            animate={animate}
          />

          {/* Secondary descriptor: "Music App" */}
          {showSub && (
            <LogoTextSub
              mode={mode}
              size={size}
              animate={animate}
            />
          )}

          {/* Tagline: "#FindAWay" */}
          {showTagline && (
            <LogoTextTagline
              mode={mode}
              size={size}
              animate={animate}
            />
          )}

          {/* Church brand mark: "NTCC Graham Spanish Worship Team" */}
          {showBrand && (
            <LogoBrand
              mode={mode}
              size={size}
              animate={animate}
              showTrademark={false}
            />
          )}
        </div>
      </div>

      {/* ─── Glassmorphism hover effect ─── */}
      {glassmorphism && (
        <style>{`
          .logo:hover {
            background: rgba(255, 255, 255, 0.08) !important;
            border-color: rgba(255, 255, 255, 0.15) !important;
            box-shadow: 0 6px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }
          .logo:active {
            transform: scale(0.98);
          }
        `}</style>
      )}
    </LogoLink>
  );
}

/**
 * ============================================
 * This Area Of Code Is: Pre-configured Mode Exports
 * ============================================
 *
 * Explanation:
 * Ready-to-use Logo components pre-configured for each brand mode.
 * LogoNTCC, LogoPraises, and LogoAdoracion eliminate the need to pass
 * mode props repeatedly. They are the recommended imports for most
 * use cases throughout the application.
 *
 * In Other Words:
 * Shortcuts — LogoNTCC already shows the complete NTCC church logo
 * with all the right text and styling, no configuration needed.
 * ============================================
 */

export function LogoNTCC(
  props: Omit<LogoProps, "mode">
): JSX.Element {
  return <Logo mode="ntcc" {...props} />;
}

export function LogoPraises(
  props: Omit<LogoProps, "mode">
): JSX.Element {
  return <Logo mode="praises" {...props} />;
}

export function LogoAdoracion(
  props: Omit<LogoProps, "mode">
): JSX.Element {
  return <Logo mode="adoracion" {...props} />;
}

/**
 * ============================================
 * This Area Of Code Is: Compact Variant Exports
 * ============================================
 *
 * Explanation:
 * Compact logo variants that hide the brand mark and tagline for
 * tight spaces like mobile headers, tab bars, or collapsed sidebars.
 * LogoCompact shows only the icon + primary + secondary text.
 * LogoMinimal shows only the icon + primary text.
 *
 * In Other Words:
 * "Small space" versions — LogoCompact hides the tagline and church
 * brand for narrow headers. LogoMinimal is just the icon and name.
 * ============================================
 */

export function LogoCompact(
  props: Omit<LogoProps, "showBrand" | "showTagline">
): JSX.Element {
  return <Logo showBrand={false} showTagline={false} {...props} />;
}

export function LogoMinimal(
  props: Omit<LogoProps, "showBrand" | "showTagline" | "showSub">
): JSX.Element {
  return <Logo showBrand={false} showTagline={false} showSub={false} {...props} />;
}

/**
 * ============================================
 * This Area Of Code Is: Copyright & Attribution
 * ============================================
 *
 * Explanation:
 * Legal attribution for the NTCC Music App. This file is part of the
 * church worship management platform developed for New Testament
 * Christian Church Graham's Spanish Worship Team. The logo assembly
 * represents the unified brand identity of the church music ministry.
 *
 * In Other Words:
 * "This complete logo was built by Rev. Frederick Thomas for NTCC
 * Graham's Spanish Worship Team."
 * ============================================
 */

// © 2026 NTCC Music App | 𝑅𝑒𝑣. 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝐷𝑤𝑎𝑦𝑛𝑒 𝑇ℎ𝑜𝑚𝑎𝑠, 𝐽𝑟., 𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Gifted with 🫶🏿 to NTCCA
// SCN Technologies™ | NTCC Graham Spanish Worship Team | #FindAWay
