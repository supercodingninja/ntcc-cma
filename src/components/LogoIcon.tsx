/**
 * ============================================
 * This Area Of Code Is: Module Imports & Component Setup
 * ============================================
 *
 * Explanation:
 * Imports React and defines the LogoIcon component props interface.
 * This component renders the OFFICIAL NTCCA (New Testament Christian
 * Churches of America, Inc.) shield logo as the primary brand mark.
 * The shield features a golden emblem with a dove/cross design on
 * a shield-shaped background — matching the official church branding
 * shown in the user's uploaded screenshot. Supports dynamic sizing,
 * fallback text for accessibility, and optional pulse animation.
 *
 * In Other Words:
 * This is the "official church shield logo" — the golden NTCCA emblem
 * that appears on all church materials. It scales to any size and
 * has a subtle animation when it first appears.
 * ============================================
 */

import React from "react";

// ─── Logo Icon Props ───
export interface LogoIconProps {
  size?: number; // Pixel size (default: 48)
  className?: string;
  style?: React.CSSProperties;
  animate?: boolean; // Subtle pulse animation on mount
  /** URL to the NTCCA shield image — defaults to GitHub raw URL */
  imageUrl?: string;
  /** Alt text for accessibility */
  alt?: string;
}

/**
 * ============================================
 * This Area Of Code Is: NTCCA Shield Asset Configuration
 * ============================================
 *
 * Explanation:
 * Defines the default URL for the NTCCA shield logo image asset.
 * The image should be stored in the project's public/assets/ directory
 * or served from a CDN. The fallback URL points to the GitHub raw
 * content URL for the ntcc-cma repository's assets folder. This
 * ensures the logo loads correctly in both development and production.
 *
 * In Other Words:
 * This is the "address" of the church shield picture — where to find
 * the golden NTCCA logo image file on the internet or in the app.
 * ============================================
 */

const DEFAULT_SHIELD_URL = "/assets/ntcca-shield.png";

/**
 * ============================================
 * This Area Of Code Is: SVG Fallback Shield Renderer
 * ============================================
 *
 * Explanation:
 * Renders a CSS-styled shield shape as a fallback when the image
 * asset is unavailable. The shield uses a golden gradient background
 * with a cross and dove silhouette in the center — approximating the
 * official NTCCA branding. This ensures the logo always displays
 * even if the image file fails to load or is still loading.
 *
 * In Other Words:
 * This is the "backup drawing" — if the church shield picture can't
 * load, this draws a similar golden shield with a cross and dove
 * using code instead of an image.
 * ============================================
 */

function ShieldFallback({ size }: { size: number }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Shield background with golden gradient */}
      <defs>
        <linearGradient id="shieldGold" x1="0" y1="0" x2="100" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f5d76e" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
        <linearGradient id="shieldDark" x1="0" y1="0" x2="100" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B4513" />
          <stop offset="100%" stopColor="#5D3A1A" />
        </linearGradient>
      </defs>

      {/* Shield outer shape */}
      <path
        d="M50 5 L90 20 L90 60 Q90 95 50 115 Q10 95 10 60 L10 20 Z"
        fill="url(#shieldGold)"
        stroke="#8B4513"
        strokeWidth="2"
      />

      {/* Inner border detail */}
      <path
        d="M50 12 L82 24 L82 58 Q82 88 50 106 Q18 88 18 58 L18 24 Z"
        fill="none"
        stroke="#b8860b"
        strokeWidth="1.5"
        opacity="0.6"
      />

      {/* Cross silhouette */}
      <path
        d="M50 25 L50 45 M38 35 L62 35"
        stroke="#5D3A1A"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Dove silhouette (simplified) */}
      <path
        d="M50 55 Q45 52 42 56 Q40 60 45 62 Q50 64 55 62 Q60 60 58 56 Q55 52 50 55"
        fill="#5D3A1A"
        opacity="0.8"
      />

      {/* NTCCA text abbreviation */}
      <text
        x="50"
        y="78"
        textAnchor="middle"
        fontSize="8"
        fontFamily="'Cinzel', 'Georgia', serif"
        fontWeight="700"
        fill="#5D3A1A"
        letterSpacing="0.1em"
      >
        NTCCA
      </text>
    </svg>
  );
}

/**
 * ============================================
 * This Area Of Code Is: LogoIcon Component
 * ============================================
 *
 * Explanation:
 * Renders the official NTCCA shield logo as an image element with
 * SVG fallback. The component attempts to load the shield image from
 * the configured URL. If the image fails to load or is unavailable,
 * the ShieldFallback SVG is rendered instead. The component supports
 * dynamic sizing, optional entrance animation, and full accessibility
 * attributes (alt text, aria-label, role). The image is styled with
 * object-fit: contain to preserve aspect ratio and a subtle drop
 * shadow for depth against dark backgrounds.
 *
 * In Other Words:
 * This shows the official golden NTCCA church shield — it tries to
 * load the real picture first, but if that fails it draws a backup
 * shield so the logo never disappears.
 * ============================================
 */

export function LogoIcon({
  size = 48,
  className = "",
  style = {},
  animate = true,
  imageUrl = DEFAULT_SHIELD_URL,
  alt = "NTCCA — New Testament Christian Churches of America, Inc.",
}: LogoIconProps): JSX.Element {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const handleLoad = (): void => setImageLoaded(true);
  const handleError = (): void => setImageError(true);

  const showImage = !imageError;
  const showFallback = imageError || !imageLoaded;

  return (
    <div
      className={`logo-icon ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        flexShrink: 0,
        ...(animate && {
          animation: "logoIconEntrance 0.6s ease-out",
        }),
        ...style,
      }}
      aria-label={alt}
      role="img"
    >
      {/* ─── NTCCA Shield Image ─── */}
      {showImage && (
        <img
          src={imageUrl}
          alt={alt}
          width={size}
          height={size}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            opacity: imageLoaded ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      {/* ─── SVG Fallback (shown while loading or on error) ─── */}
      {showFallback && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: imageLoaded ? 0 : 1,
            transition: "opacity 0.3s ease",
          }}
        >
          <ShieldFallback size={size} />
        </div>
      )}

      {/* ─── Entrance Animation ─── */}
      <style>{`
        @keyframes logoIconEntrance {
          0% {
            transform: scale(0.85) rotate(-5deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.05) rotate(2deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * ============================================
 * This Area Of Code Is: Small Variant Export
 * ============================================
 *
 * Explanation:
 * Convenience export for a compact 32px shield version used in mobile
 * headers, tab bars, or favicon contexts. Same component, pre-configured
 * size with faster animation for snappy mobile feel.
 *
 * In Other Words:
 * This is the "tiny shield" — same church logo, just smaller for
 * phone headers and small spaces.
 * ============================================
 */

export function LogoIconSmall(props: Omit<LogoIconProps, "size">): JSX.Element {
  return <LogoIcon size={32} {...props} />;
}

/**
 * ============================================
 * This Area Of Code Is: Large Variant Export
 * ============================================
 *
 * Explanation:
 * Convenience export for a large 80px shield version used in splash
 * screens, loading states, or hero sections. Same component, larger
 * size with animation enabled by default for maximum visual impact.
 *
 * In Other Words:
 * This is the "big shield" — same church logo, larger for splash
 * screens and loading pages where it needs to be impressive.
 * ============================================
 */

export function LogoIconLarge(props: Omit<LogoIconProps, "size">): JSX.Element {
  return <LogoIcon size={80} animate={true} {...props} />;
}

/**
 * ============================================
 * This Area Of Code Is: Copyright & Attribution
 * ============================================
 *
 * Explanation:
 * Legal attribution for the NTCC Music App. The NTCCA shield logo
 * is the official trademark of New Testament Christian Churches of
 * America, Inc. Used under license for the NTCC Graham Spanish
 * Worship Team music ministry application.
 *
 * In Other Words:
 * "This code and the NTCCA shield logo belong to the church ministry.
 * Built by Rev. Frederick Thomas for NTCC Graham."
 * ============================================
 */

// © 2026 NTCC Music App | 𝑅𝑒𝑣. 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝐷𝑤𝑎𝑦𝑛𝑒 𝑇ℎ𝑜𝑚𝑎𝑠, 𝐽𝑟., 𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Gifted with 🫶🏿 to NTCCA
// NTCCA — New Testament Christian Churches of America, Inc.
// SCN Technologies™ | NTCC Graham Spanish Worship Team | #FindAWay
