/**
 * ============================================
 * This Area Of Code Is: Module Imports & Type Definitions
 * ============================================
 *
 * Explanation:
 * Imports React and defines the RoleBadge component props interface.
 * This component renders a color-coded badge that displays a user's
 * role within the NTCC worship team (worship_leader, musician, admin,
 * conductor, sound_engineer). Each role has a distinct color, icon,
 * and label to provide instant visual identification of team member
 * responsibilities across the app. The badge supports multiple sizes,
 * variants (filled, outlined, subtle), and click interactions.
 *
 * In Other Words:
 * This is the "name tag" that shows what someone does on the worship
 * team — "Worship Leader" in purple, "Musician" in blue, etc. —
 * so everyone knows each other's role at a glance.
 * ============================================
 */

import React from "react";

// ─── Role Badge Props ───
export interface RoleBadgeProps {
  /** The user's role in the worship team */
  role: WorshipRole;
  /** Visual variant: filled (solid color), outlined (border only), subtle (light tint) */
  variant?: "filled" | "outlined" | "subtle";
  /** Badge size: sm (compact), md (default), lg (prominent) */
  size?: "sm" | "md" | "lg";
  /** Whether the badge is clickable (e.g., to open role details) */
  clickable?: boolean;
  /** Custom click handler */
  onClick?: (role: WorshipRole) => void;
  /** Additional CSS class names */
  className?: string;
  /** Inline styles override */
  style?: React.CSSProperties;
  /** Whether to show the role icon */
  showIcon?: boolean;
  /** Whether to show the role label text */
  showLabel?: boolean;
  /** Custom label override (e.g., "Pianist" instead of "Musician") */
  customLabel?: string;
  /** Whether to show a tooltip on hover */
  showTooltip?: boolean;
  /** Tooltip text override */
  tooltipText?: string;
  /** Whether the badge is disabled (grayed out) */
  disabled?: boolean;
}

/**
 * ============================================
 * This Area Of Code Is: Role Type Definitions
 * ============================================
 *
 * Explanation:
 * Defines the TypeScript union type for all valid worship team roles
 * within the NTCC Music App. Each role maps to a specific set of
 * permissions, UI features, and color theming. The roles are:
 * - worship_leader: Leads worship services, full setlist control
 * - musician: Plays instruments, views chord charts
 * - admin: Manages team, schedules, and app settings
 * - conductor: Uses Unity Solution™ for tempo/conducting
 * - sound_engineer: Manages audio, mixing, and live sound
 * - vocalist: Sings, views lyrics and backing tracks
 * - media: Handles projection, slides, and livestream
 * - guest: Limited view-only access for visitors
 *
 * In Other Words:
 * These are all the possible jobs on the worship team — worship leader,
 * musician, admin, conductor, sound engineer, singer, media person, or guest.
 * ============================================
 */

export type WorshipRole =
  | "worship_leader"
  | "musician"
  | "admin"
  | "conductor"
  | "sound_engineer"
  | "vocalist"
  | "media"
  | "guest";

/**
 * ============================================
 * This Area Of Code Is: Role Configuration Data
 * ============================================
 *
 * Explanation:
 * Defines the complete configuration for each worship role including
 * display label, color scheme (background, text, border), icon
 * representation (using Unicode symbols as lightweight icons), and
 * description text for tooltips. The color palette uses NTCC church
 * colors: purple for worship leadership, blue for musicians, gold for
 * admin, green for conductors, red for sound engineers, pink for
 * vocalists, cyan for media, and gray for guests.
 *
 * In Other Words:
 * This is the "style guide" for each role — what color, what icon,
 * what text, and what description shows up for each team position.
 * ============================================
 */

interface RoleConfig {
  label: string;
  colors: {
    filled: { bg: string; text: string };
    outlined: { border: string; text: string };
    subtle: { bg: string; text: string };
  };
  icon: string;
  description: string;
}

const ROLE_CONFIG: Record<WorshipRole, RoleConfig> = {
  worship_leader: {
    label: "Worship Leader",
    colors: {
      filled: { bg: "#7c3aed", text: "#ffffff" },
      outlined: { border: "#7c3aed", text: "#7c3aed" },
      subtle: { bg: "rgba(124, 58, 237, 0.12)", text: "#a78bfa" },
    },
    icon: "🎤",
    description: "Leads worship services and manages setlists",
  },
  musician: {
    label: "Musician",
    colors: {
      filled: { bg: "#2563eb", text: "#ffffff" },
      outlined: { border: "#2563eb", text: "#2563eb" },
      subtle: { bg: "rgba(37, 99, 235, 0.12)", text: "#60a5fa" },
    },
    icon: "🎸",
    description: "Plays instruments and follows chord charts",
  },
  admin: {
    label: "Admin",
    colors: {
      filled: { bg: "#d97706", text: "#ffffff" },
      outlined: { border: "#d97706", text: "#d97706" },
      subtle: { bg: "rgba(217, 119, 6, 0.12)", text: "#fbbf24" },
    },
    icon: "⚙️",
    description: "Manages team, schedules, and app settings",
  },
  conductor: {
    label: "Conductor",
    colors: {
      filled: { bg: "#059669", text: "#ffffff" },
      outlined: { border: "#059669", text: "#059669" },
      subtle: { bg: "rgba(5, 150, 105, 0.12)", text: "#34d399" },
    },
    icon: "🎼",
    description: "Uses Unity Solution™ for real-time tempo conducting",
  },
  sound_engineer: {
    label: "Sound Engineer",
    colors: {
      filled: { bg: "#dc2626", text: "#ffffff" },
      outlined: { border: "#dc2626", text: "#dc2626" },
      subtle: { bg: "rgba(220, 38, 38, 0.12)", text: "#f87171" },
    },
    icon: "🔊",
    description: "Manages audio mixing and live sound production",
  },
  vocalist: {
    label: "Vocalist",
    colors: {
      filled: { bg: "#db2777", text: "#ffffff" },
      outlined: { border: "#db2777", text: "#db2777" },
      subtle: { bg: "rgba(219, 39, 119, 0.12)", text: "#f472b6" },
    },
    icon: "🎵",
    description: "Sings and follows lyrics with backing tracks",
  },
  media: {
    label: "Media",
    colors: {
      filled: { bg: "#0891b2", text: "#ffffff" },
      outlined: { border: "#0891b2", text: "#0891b2" },
      subtle: { bg: "rgba(8, 145, 178, 0.12)", text: "#22d3ee" },
    },
    icon: "📺",
    description: "Handles projection, slides, and livestream",
  },
  guest: {
    label: "Guest",
    colors: {
      filled: { bg: "#6b7280", text: "#ffffff" },
      outlined: { border: "#6b7280", text: "#6b7280" },
      subtle: { bg: "rgba(107, 114, 128, 0.12)", text: "#9ca3af" },
    },
    icon: "👤",
    description: "View-only access for visitors and guests",
  },
};

/**
 * ============================================
 * This Area Of Code Is: Size Configuration
 * ============================================
 *
 * Explanation:
 * Defines the pixel dimensions, font sizes, and padding for each
 * badge size variant (sm, md, lg). The small size is for compact
 * UIs like table rows and mobile headers. The medium size is the
 * default for most contexts. The large size is for profile cards,
 * team listings, and prominent displays.
 *
 * In Other Words:
 * This is the "size chart" — small badges for tight spaces, medium
 * for normal use, large for big displays like profile pages.
 * ============================================
 */

const SIZE_CONFIG = {
  sm: {
    padding: "2px 8px",
    fontSize: "11px",
    borderRadius: "4px",
    iconSize: "12px",
    gap: "4px",
    height: "20px",
  },
  md: {
    padding: "4px 12px",
    fontSize: "13px",
    borderRadius: "6px",
    iconSize: "14px",
    gap: "6px",
    height: "28px",
  },
  lg: {
    padding: "6px 16px",
    fontSize: "15px",
    borderRadius: "8px",
    iconSize: "16px",
    gap: "8px",
    height: "36px",
  },
};

/**
 * ============================================
 * This Area Of Code Is: RoleBadge Component
 * ============================================
 *
 * Explanation:
 * Renders a color-coded role badge with icon, label, and optional
 * tooltip. The badge appearance is determined by the role (which
 * selects the color scheme), variant (filled/outlined/subtle), and
 * size (sm/md/lg). The component supports click interactions for
 * role selection or detail views. When disabled, the badge is
 * grayed out with reduced opacity. The tooltip appears on hover
 * with the role description. All styles are computed inline to
 * ensure consistent rendering without external CSS dependencies.
 *
 * In Other Words:
 * This draws the actual badge — a colored pill with an icon and
 * text that shows someone's role. Purple for worship leader, blue
 * for musician, etc. Click it to see more details.
 * ============================================
 */

export function RoleBadge({
  role,
  variant = "filled",
  size = "md",
  clickable = false,
  onClick,
  className = "",
  style = {},
  showIcon = true,
  showLabel = true,
  customLabel,
  showTooltip = true,
  tooltipText,
  disabled = false,
}: RoleBadgeProps): JSX.Element {
  const config = ROLE_CONFIG[role];
  const sizeConfig = SIZE_CONFIG[size];
  const displayLabel = customLabel ?? config.label;

  // ─── Compute badge colors based on variant ───
  const getBadgeColors = (): { backgroundColor: string; color: string; border: string } => {
    if (disabled) {
      return {
        backgroundColor: variant === "filled" ? "#374151" : "transparent",
        color: "#9ca3af",
        border: variant === "outlined" ? "1px solid #4b5563" : "1px solid transparent",
      };
    }

    const variantColors = config.colors[variant];
    return {
      backgroundColor: variant === "outlined" ? "transparent" : variantColors.bg,
      color: variantColors.text,
      border: variant === "outlined" ? `1.5px solid ${variantColors.border}` : "1px solid transparent",
    };
  };

  const colors = getBadgeColors();

  // ─── Handle click ───
  const handleClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (!clickable || disabled) return;
    onClick?.(role);
  };

  // ─── Tooltip content ───
  const tooltipContent = tooltipText ?? `${config.label}: ${config.description}`;

  return (
    <div
      className={`role-badge ${clickable && !disabled ? "role-badge--clickable" : ""} ${disabled ? "role-badge--disabled" : ""} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: sizeConfig.gap,
        padding: sizeConfig.padding,
        fontSize: sizeConfig.fontSize,
        fontWeight: 600,
        fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif",
        letterSpacing: "0.02em",
        borderRadius: sizeConfig.borderRadius,
        height: sizeConfig.height,
        lineHeight: 1,
        whiteSpace: "nowrap",
        userSelect: "none",
        transition: "all 0.2s ease",
        cursor: clickable && !disabled ? "pointer" : "default",
        opacity: disabled ? 0.6 : 1,
        ...colors,
        ...style,
      }}
      onClick={handleClick}
      role={clickable ? "button" : "status"}
      aria-label={showTooltip ? tooltipContent : displayLabel}
      title={showTooltip ? tooltipContent : undefined}
    >
      {/* ─── Role Icon ─── */}
      {showIcon && (
        <span
          style={{
            fontSize: sizeConfig.iconSize,
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "center",
          }}
          aria-hidden="true"
        >
          {config.icon}
        </span>
      )}

      {/* ─── Role Label ─── */}
      {showLabel && (
        <span style={{ lineHeight: 1 }}>
          {displayLabel}
        </span>
      )}

      {/* ─── Hover/active styles (injected via style tag) ─── */}
      {clickable && !disabled && (
        <style>{`
          .role-badge--clickable:hover {
            filter: brightness(1.15);
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }
          .role-badge--clickable:active {
            transform: translateY(0);
            filter: brightness(0.95);
          }
        `}</style>
      )}
    </div>
  );
}

/**
 * ============================================
 * This Area Of Code Is: RoleBadgeGroup Component
 * ============================================
 *
 * Explanation:
 * Renders a horizontal group of role badges for users who hold
 * multiple roles (e.g., a worship leader who is also a musician).
 * The group wraps badges with consistent spacing and supports
 * a maximum display limit with a "+N more" overflow badge.
 *
 * In Other Words:
 * This shows multiple role badges side by side — if someone is
 * both a worship leader AND a musician, both badges appear together.
 * ============================================
 */

export interface RoleBadgeGroupProps {
  roles: WorshipRole[];
  maxDisplay?: number;
  variant?: "filled" | "outlined" | "subtle";
  size?: "sm" | "md" | "lg";
  gap?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function RoleBadgeGroup({
  roles,
  maxDisplay = 3,
  variant = "subtle",
  size = "sm",
  gap = 6,
  className = "",
  style = {},
}: RoleBadgeGroupProps): JSX.Element {
  const displayRoles = roles.slice(0, maxDisplay);
  const overflowCount = roles.length - maxDisplay;

  return (
    <div
      className={`role-badge-group ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: `${gap}px`,
        ...style,
      }}
    >
      {displayRoles.map((role) => (
        <RoleBadge
          key={role}
          role={role}
          variant={variant}
          size={size}
          showTooltip={false}
        />
      ))}

      {overflowCount > 0 && (
        <span
          style={{
            fontSize: size === "sm" ? "11px" : size === "md" ? "13px" : "15px",
            color: "#9ca3af",
            fontWeight: 500,
            padding: size === "sm" ? "2px 6px" : size === "md" ? "4px 8px" : "6px 10px",
          }}
        >
          +{overflowCount}
        </span>
      )}
    </div>
  );
}

/**
 * ============================================
 * This Area Of Code Is: Convenience Exports
 * ============================================
 *
 * Explanation:
 * Pre-configured RoleBadge components for each worship role to reduce
 * boilerplate. Instead of passing role="worship_leader" every time,
 * consumers can import WorshipLeaderBadge, MusicianBadge, etc.
 * directly. Each preset uses the filled variant and medium size
 * as sensible defaults.
 *
 * In Other Words:
 * Shortcuts — import WorshipLeaderBadge and it already knows to be
 * purple with a microphone icon, no configuration needed.
 * ============================================
 */

export function WorshipLeaderBadge(
  props: Omit<RoleBadgeProps, "role">
): JSX.Element {
  return <RoleBadge role="worship_leader" variant="filled" size="md" {...props} />;
}

export function MusicianBadge(
  props: Omit<RoleBadgeProps, "role">
): JSX.Element {
  return <RoleBadge role="musician" variant="filled" size="md" {...props} />;
}

export function AdminBadge(
  props: Omit<RoleBadgeProps, "role">
): JSX.Element {
  return <RoleBadge role="admin" variant="filled" size="md" {...props} />;
}

export function ConductorBadge(
  props: Omit<RoleBadgeProps, "role">
): JSX.Element {
  return <RoleBadge role="conductor" variant="filled" size="md" {...props} />;
}

export function SoundEngineerBadge(
  props: Omit<RoleBadgeProps, "role">
): JSX.Element {
  return <RoleBadge role="sound_engineer" variant="filled" size="md" {...props} />;
}

export function VocalistBadge(
  props: Omit<RoleBadgeProps, "role">
): JSX.Element {
  return <RoleBadge role="vocalist" variant="filled" size="md" {...props} />;
}

export function MediaBadge(
  props: Omit<RoleBadgeProps, "role">
): JSX.Element {
  return <RoleBadge role="media" variant="filled" size="md" {...props} />;
}

export function GuestBadge(
  props: Omit<RoleBadgeProps, "role">
): JSX.Element {
  return <RoleBadge role="guest" variant="subtle" size="sm" {...props} />;
}

/**
 * ============================================
 * This Area Of Code Is: Copyright & Attribution
 * ============================================
 *
 * Explanation:
 * Legal attribution for the NTCC Music App. The role badge system
 * is part of the church worship team management platform developed
 * for New Testament Christian Churches of America, Inc.
 *
 * In Other Words:
 * "This code was built by Rev. Frederick Thomas for NTCC Graham's
 * Spanish Worship Team under NTCCA."
 * ============================================
 */

// © 2026 NTCC Music App | 𝑅𝑒𝑣. 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝐷𝑤𝑎𝑦𝑛𝑒 𝑇ℎ𝑜𝑚𝑎𝑠, 𝐽𝑟., 𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Gifted with 🫶🏿 to NTCCA
// NTCCA — New Testament Christian Churches of America, Inc.
// SCN Technologies™ | NTCC Graham Spanish Worship Team | #FindAWay
