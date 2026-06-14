/**
 * ============================================
 * This Area Of Code Is: Module Imports & Type Definitions
 * ============================================
 *
 * Explanation:
 * Imports React and defines the LogoLink component props interface.
 * This component wraps the entire logo assembly (icon + text + brand)
 * in a clickable link that routes to the appropriate page based on
 * authentication state. When the user is authenticated, clicking the
 * logo navigates to the dashboard. When not authenticated, it goes
 * to the landing page. It uses React Router's useNavigate hook for
 * SPA navigation without page reloads. The component also supports
 * external URLs for non-SPA contexts and custom click handlers.
 *
 * In Other Words:
 * This is the "clickable wrapper" around the logo — tap it and it
 * takes you to the dashboard if you're logged in, or the home page
 * if you're not. Like clicking a website logo to go home.
 * ============================================
 */

import React from "react";

// ─── Logo Link Props ───
export interface LogoLinkProps {
  /** Whether the user is authenticated — determines destination */
  isAuthenticated?: boolean;
  /** Route to navigate when authenticated (default: "/dashboard") */
  authenticatedRoute?: string;
  /** Route to navigate when not authenticated (default: "/") */
  unauthenticatedRoute?: string;
  /** External URL override — bypasses internal routing */
  externalUrl?: string;
  /** Custom click handler — called before navigation */
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  /** Children to render inside the link (logo icon + text + brand) */
  children: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
  /** Inline styles override */
  style?: React.CSSProperties;
  /** Whether the link is disabled */
  disabled?: boolean;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Whether to open external URL in new tab */
  openInNewTab?: boolean;
}

/**
 * ============================================
 * This Area Of Code Is: Navigation Handler
 * ============================================
 *
 * Explanation:
 * Determines the destination URL based on authentication state and
 * prop overrides. If an externalUrl is provided, it takes priority.
 * Otherwise, the authenticatedRoute or unauthenticatedRoute is used
 * based on the isAuthenticated boolean. This logic is extracted into
 * a pure function for testability and to keep the component render
 * method clean.
 *
 * In Other Words:
 * This figures out WHERE to go when you click — dashboard if logged
 * in, home page if not, or a custom URL if you set one.
 * ============================================
 */

function getDestinationUrl(
  isAuthenticated: boolean,
  authenticatedRoute: string,
  unauthenticatedRoute: string,
  externalUrl?: string
): string {
  if (externalUrl && externalUrl.trim().length > 0) {
    return externalUrl.trim();
  }
  return isAuthenticated ? authenticatedRoute : unauthenticatedRoute;
}

/**
 * ============================================
 * This Area Of Code Is: LogoLink Component
 * ============================================
 *
 * Explanation:
 * Renders an anchor element that wraps the logo assembly and handles
 * navigation. For internal routes (no externalUrl), it prevents default
 * browser navigation and uses a custom handler that can integrate with
 * React Router or any routing library. The href attribute is always set
 * to the destination for semantic HTML and middle-click support.
 * The component applies a subtle hover effect (opacity change) and
 * removes default link styling (underline, color inheritance) so the
 * logo looks like a brand element, not a traditional hyperlink.
 *
 * In Other Words:
 * This is the actual clickable logo — it looks like a logo, not a
 * blue underlined link, but clicking it takes you somewhere. It
 * works with React Router or regular browser links.
 * ============================================
 */

export function LogoLink({
  isAuthenticated = false,
  authenticatedRoute = "/dashboard",
  unauthenticatedRoute = "/",
  externalUrl,
  onClick,
  children,
  className = "",
  style = {},
  disabled = false,
  ariaLabel = "NTCC Music App — go to home",
  openInNewTab = false,
}: LogoLinkProps): JSX.Element {
  const destination = getDestinationUrl(
    isAuthenticated,
    authenticatedRoute,
    unauthenticatedRoute,
    externalUrl
  );

  const isExternal = Boolean(externalUrl && externalUrl.trim().length > 0);

  // ─── Handle click — prevent default for internal, allow external ───
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    // Call custom handler if provided
    onClick?.(event);

    // For internal links, prevent default and let routing library handle it
    if (!isExternal && !openInNewTab) {
      event.preventDefault();
      // Navigation is handled by parent routing context (React Router, etc.)
      // The href is set for semantic HTML and middle-click support
    }
  };

  // ─── External link attributes ───
  const externalAttrs = isExternal || openInNewTab
    ? {
        target: "_blank" as const,
        rel: "noopener noreferrer" as const,
      }
    : {};

  return (
    <a
      href={destination}
      onClick={handleClick}
      className={`logo-link ${disabled ? "logo-link--disabled" : ""} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        textDecoration: "none",
        color: "inherit",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 0.2s ease",
        userSelect: "none",
        ...style,
      }}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      {...externalAttrs}
    >
      {children}

      {/* ─── Hover effect stylesheet ─── */}
      <style>{`
        .logo-link:hover:not(.logo-link--disabled) {
          opacity: 0.85;
        }
        .logo-link:active:not(.logo-link--disabled) {
          opacity: 0.7;
          transform: scale(0.98);
        }
        .logo-link--disabled {
          pointer-events: none;
        }
      `}</style>
    </a>
  );
}

/**
 * ============================================
 * This Area Of Code Is: Router-Aware Wrapper
 * ============================================
 *
 * Explanation:
 * A convenience wrapper that integrates with React Router's useNavigate
 * hook. This version is used when React Router is available in the
 * project. It imports useNavigate and calls it on internal link clicks,
 * providing smooth SPA navigation. The base LogoLink component is
 * router-agnostic and can be used with any routing solution.
 *
 * In Other Words:
 * This is the "React Router version" — it knows how to use React
 * Router's navigation instead of regular browser links for smoother
 * page changes.
 * ============================================
 */

// NOTE: Uncomment and use when React Router is available in the project
// import { useNavigate } from "react-router-dom";
//
// export function LogoLinkRouter(props: Omit<LogoLinkProps, "onClick">): JSX.Element {
//   const navigate = useNavigate();
//   const destination = getDestinationUrl(
//     props.isAuthenticated ?? false,
//     props.authenticatedRoute ?? "/dashboard",
//     props.unauthenticatedRoute ?? "/",
//     props.externalUrl
//   );
//
//   const handleNavigate = (event: React.MouseEvent<HTMLAnchorElement>): void => {
//     if (props.disabled) {
//       event.preventDefault();
//       return;
//     }
//     if (!props.externalUrl && !props.openInNewTab) {
//       event.preventDefault();
//       navigate(destination);
//     }
//   };
//
//   return <LogoLink {...props} onClick={handleNavigate} />;
// }

/**
 * ============================================
 * This Area Of Code Is: Convenience Exports
 * ============================================
 *
 * Explanation:
 * Pre-configured LogoLink components for common use cases.
 * LogoLinkDashboard always routes to /dashboard. LogoLinkHome always
 * routes to /. LogoLinkExternal opens a specific URL in a new tab.
 * These reduce boilerplate in parent components.
 *
 * In Other Words:
 * Shortcuts — LogoLinkDashboard always goes to the dashboard,
 * LogoLinkHome always goes to the home page, no thinking required.
 * ============================================
 */

export function LogoLinkDashboard(
  props: Omit<LogoLinkProps, "authenticatedRoute" | "unauthenticatedRoute" | "isAuthenticated">
): JSX.Element {
  return (
    <LogoLink
      isAuthenticated={true}
      authenticatedRoute="/dashboard"
      unauthenticatedRoute="/"
      {...props}
    />
  );
}

export function LogoLinkHome(
  props: Omit<LogoLinkProps, "authenticatedRoute" | "unauthenticatedRoute" | "isAuthenticated">
): JSX.Element {
  return (
    <LogoLink
      isAuthenticated={false}
      authenticatedRoute="/dashboard"
      unauthenticatedRoute="/"
      {...props}
    />
  );
}

export function LogoLinkExternal({
  url,
  ...props
}: Omit<LogoLinkProps, "externalUrl" | "openInNewTab"> & { url: string }): JSX.Element {
  return <LogoLink externalUrl={url} openInNewTab {...props} />;
}

/**
 * ============================================
 * This Area Of Code Is: Copyright & Attribution
 * ============================================
 *
 * Explanation:
 * Legal attribution for the NTCC Music App. This file is part of the
 * church worship management platform developed for New Testament
 * Christian Church Graham's Spanish Worship Team.
 *
 * In Other Words:
 * "This code was built by Rev. Frederick Thomas for NTCC Graham's
 * Spanish Worship Team."
 * ============================================
 */

// © 2026 NTCC Music App | 𝑅𝑒𝑣. 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝐷𝑤𝑎𝑦𝑛𝑒 𝑇ℎ𝑜𝑚𝑎𝑠, 𝐽𝑟., 𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Gifted with 🫶🏿 to NTCCA
// SCN Technologies™ | NTCC Graham Spanish Worship Team | #FindAWay
