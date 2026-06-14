/**
 * ============================================
 * This Area Of Code Is: Module Imports & Component Setup
 * ============================================
 *
 * Explanation:
 * Imports React and defines the LogoIcon component props interface.
 * This is a pure presentational component that renders an SVG icon
 * combining a Christian cross, a musical note, and the SCN brand mark.
 * Supports dynamic sizing and color theming via CSS variables.
 *
 * In Other Words:
 * This is the "church music logo drawing" — a small picture that combines
 * a cross (faith), a note (music), and the SCN mark (your brand) into
 * one recognizable icon.
 * ============================================
 */

import React from "react";

// ─── Logo Icon Props ───
export interface LogoIconProps {
  size?: number; // Pixel size (default: 40)
  color?: string; // SVG color (default: currentColor)
  className?: string;
  style?: React.CSSProperties;
  animate?: boolean; // Subtle pulse animation on mount
}

/**
 * ============================================
 * This Area Of Code Is: SVG Icon Renderer
 * ============================================
 *
 * Explanation:
 * Renders a custom SVG combining three symbolic elements:
 * 1) Christian cross (vertical bar thicker, horizontal bar centered)
 * 2) Eighth note (musical note) positioned to the right of the cross
 * 3) `<SCN/>` text mark curved beneath both elements
 * 
 * The viewBox is 100x100 for easy coordinate math. All elements use
 * currentColor so they inherit from parent CSS. The animate prop
 * adds a subtle scale-in on mount for visual polish.
 *
 * In Other Words:
 * This draws the actual picture — the cross and note are drawn with
 * SVG lines and curves, then your SCN brand is written underneath.
 * ============================================
 */

export function LogoIcon({
  size = 40,
  color = "currentColor",
  className = "",
  style = {},
  animate = true,
}: LogoIconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`logo-icon ${className}`}
      style={{
        color,
        flexShrink: 0,
        ...(animate && {
          animation: "logoIconPulse 0.6s ease-out",
        }),
        ...style,
      }}
      aria-label="NTCC Music App Logo"
      role="img"
    >
      {/* ─── Cross (Christian Faith) ─── */}
      {/* Vertical bar */}
      <rect
        x="28"
        y="8"
        width="12"
        height="54"
        rx="2"
        fill="currentColor"
      />
      {/* Horizontal bar */}
      <rect
        x="12"
        y="30"
        width="44"
        height="10"
        rx="2"
        fill="currentColor"
      />

      {/* ─── Musical Note (Worship) ─── */}
      {/* Note head (filled oval) */}
      <ellipse
        cx="72"
        cy="68"
        rx="10"
        ry="8"
        fill="currentColor"
      />
      {/* Note stem */}
      <rect
        x="78"
        y="28"
        width="4"
        height="42"
        rx="1"
        fill="currentColor"
      />
      {/* Note flag (eighth note curve) */}
      <path
        d="M82 28 Q92 32 90 42 Q88 36 82 38"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* ─── SCN Brand Mark ─── */}
      {/* Left bracket */}
      <text
        x="22"
        y="88"
        fontSize="10"
        fontFamily="monospace"
        fontWeight="bold"
        fill="currentColor"
      >
        {"<<"}
      </text>
      {/* SCN text */}
      <text
        x="32"
        y="88"
        fontSize="10"
        fontFamily="monospace"
        fontWeight="bold"
        fill="currentColor"
        letterSpacing="0.5"
      >
        SCN
      </text>
      {/* Right bracket */}
      <text
        x="62"
        y="88"
        fontSize="10"
        fontFamily="monospace"
        fontWeight="bold"
        fill="currentColor"
      >
        {"/>"}
      </text>
      {/* Trademark symbol */}
      <text
        x="72"
        y="84"
        fontSize="5"
        fontFamily="sans-serif"
        fill="currentColor"
      >
        ™
      </text>

      {/* ─── Animation Keyframes (injected via style tag) ─── */}
      <style>{`
        @keyframes logoIconPulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </svg>
  );
}

/**
 * ============================================
 * This Area Of Code Is: Small Variant Export
 * ============================================
 *
 * Explanation:
 * Convenience export for a compact 24px icon version used in favicon
 * contexts, tab bars, or inline text. Same SVG, pre-configured size.
 *
 * In Other Words:
 * This is the "tiny version" — same picture, just smaller for tight
 * spaces like browser tabs or mobile toolbars.
 * ============================================
 */

export function LogoIconSmall(props: Omit<LogoIconProps, "size">): JSX.Element {
  return <LogoIcon size={24} {...props} />;
}

/**
 * ============================================
 * This Area Of Code Is: Large Variant Export
 * ============================================
 *
 * Explanation:
 * Convenience export for a large 64px icon version used in splash
 * screens, loading states, or hero sections. Same SVG, pre-configured
 * size with animation enabled by default.
 *
 * In Other Words:
 * This is the "big version" — same picture, larger for splash screens
 * and loading pages where it needs to be impressive.
 * ============================================
 */

export function LogoIconLarge(props: Omit<LogoIconProps, "size">): JSX.Element {
  return <LogoIcon size={64} animate={true} {...props} />;
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
