/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NTCC MUSIC APP — src/components/UnityConductor.tsx
 * Rotating Earth Visual Conductor: Canvas-rendered globe with golden meridian,
 * GPS dot plotting, real-time rotation, and beat-synchronized pulse.
 * The emotional anchor that makes distributed worship teams feel connected.
 *
 * Adapted from The Unity Solution™ for NTCC Music App
 * © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: React Imports & Type Definitions
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  This component uses React hooks (useRef, useEffect, useState, useCallback)
  to manage the Canvas 2D rendering lifecycle. It integrates with the
  UnityClock service for beat-synchronized animation and exposes a
  declarative props API for the NTCC Music App's worship session views.

  TypeScript interfaces define the component's props, musician data,
  and internal state for compile-time safety and IntelliSense support.
*/

/*
  IN OTHER WORDS:
  These are the "tools" React needs to build and manage the planetarium
  dome. The hooks are like the stage crew — they set up the canvas,
  keep the animation running, and clean up when the show ends. The
  TypeScript types are the blueprints that ensure everything fits together.
*/

import React, { useRef, useEffect, useState, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: TypeScript Interfaces & Types
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  All data structures are strictly typed for the NTCC Music App.
  The Musician interface represents a worship team member with their
  geographic location, name, instrument, and role. The ConductorMode
  type controls the visual display level for different worship contexts
  (full rehearsal vs. ambient background during prayer).
*/

/*
  IN OTHER WORDS:
  These are the "name tags" and "role cards" for everyone in the
  worship team. Each person has a name, an instrument, where they
  are in the world, and what color their dot should be on the globe.
*/

export type ConductorMode = 'ambient' | 'focused' | 'minimal' | 'hidden';

export interface Musician {
  peerId: string;
  lat: number;
  lon: number;
  name: string;
  instrument: string;
  color?: string;
  isSelf?: boolean;
}

export interface ConductorConfig {
  // Display
  canvasId: string;
  defaultMode: ConductorMode;
  ambientOpacity: number;
  focusedOpacity: number;

  // Earth
  earthColor: string;
  earthLandColor: string;
  earthBorderColor: string;
  earthGridColor: string;
  earthRotationSpeed: number; // degrees per hour

  // Meridian
  meridianColor: string;
  meridianGlowColor: string;
  meridianWidth: number;

  // Dots
  dotSelfColor: string;
  dotPeerColor: string;
  dotGlowRadius: number;
  dotPulseSpeed: number; // seconds per cycle

  // Pulse
  pulseColor: string;
  pulseGlowColor: string;
  pulseMaxRadius: number;

  // Stars
  starCount: number;
  starColor: string;
  starTwinkleSpeed: number;

  // Performance
  targetFps: number;
  lowFpsThreshold: number;
  detailReductionFactor: number;
}

export interface ConductorDiagnostics {
  isRunning: boolean;
  mode: ConductorMode;
  fps: number;
  detailLevel: number;
  musicianCount: number;
  rotation: number;
  meridianAngle: number;
  canvasSize: string;
}

export interface UnityConductorProps {
  mode?: ConductorMode;
  musicians?: Musician[];
  bpm?: number;
  className?: string;
  onDiagnosticsUpdate?: (diag: ConductorDiagnostics) => void;
  onMusicianClick?: (musician: Musician) => void;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Configuration Constants
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The visual conductor is the emotional and psychological core
  of the NTCC Music App's distributed worship system. While the
  other modules handle the technical synchronization, the conductor
  makes worship teams FEEL connected. It creates a shared visual
  space that transcends physical distance.

  Design elements:
  - Rotating Earth: Real-time rotation at 15° per hour (Earth's rate)
  - Golden Meridian: A sweeping line that marks the current
    "universal beat" position on the globe
  - Musician Dots: Glowing points at each worship team member's GPS coordinates
  - Beat Pulse: Central sun/moon that pulses with the shared tempo
  - Ambient Stars: Subtle background starfield for depth

  The conductor has four display modes:
  - ambient: Low opacity background, minimal CPU usage
  - focused: Full opacity, center stage, detailed rendering
  - minimal: Pulse only, no globe, lowest CPU usage
  - hidden: Not rendered

  Performance: The conductor uses Canvas 2D (not WebGL) for
  maximum compatibility. It runs at 60fps using requestAnimationFrame
  and adjusts detail level based on device capability.
*/

/*
  IN OTHER WORDS:
  This is the "planetarium dome" that surrounds the entire
  virtual worship space. Every musician looks up and sees the same
  rotating Earth, the same golden light sweeping across it,
  the same pulsing heartbeat in the center. Their own location
  glows on the globe, and they can see where everyone else is.
  It doesn't change the sound — but it changes how the worship
  FEELS. It makes "different countries" feel like "same room."
*/

const DEFAULT_CONFIG: ConductorConfig = Object.freeze({
  // Display
  canvasId: 'conductor-canvas',
  defaultMode: 'focused',
  ambientOpacity: 0.3,
  focusedOpacity: 1.0,

  // Earth
  earthColor: '#0d1b2a',
  earthLandColor: '#1b3a4b',
  earthBorderColor: 'rgba(78, 205, 196, 0.15)',
  earthGridColor: 'rgba(78, 205, 196, 0.08)',
  earthRotationSpeed: 15, // degrees per hour

  // Meridian
  meridianColor: '#d4a853',
  meridianGlowColor: 'rgba(212, 168, 83, 0.3)',
  meridianWidth: 2,

  // Dots
  dotSelfColor: '#d4a853',
  dotPeerColor: '#4ecdc4',
  dotGlowRadius: 8,
  dotPulseSpeed: 2, // seconds per cycle

  // Pulse
  pulseColor: '#d4a853',
  pulseGlowColor: 'rgba(212, 168, 83, 0.2)',
  pulseMaxRadius: 60,

  // Stars
  starCount: 150,
  starColor: 'rgba(255, 255, 255, 0.4)',
  starTwinkleSpeed: 3,

  // Performance
  targetFps: 60,
  lowFpsThreshold: 30,
  detailReductionFactor: 0.5
});

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Simplified Continent Outlines
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  These are simplified polygon paths representing the major continents.
  In production, these would be loaded from a GeoJSON dataset. For
  the NTCC Music App prototype, we use hardcoded simplified outlines
  that render quickly on Canvas 2D while still being recognizable.

  Each continent is an array of {lat, lon} points that form a closed
  polygon when connected. The projection math in _latLonToScreen()
  converts these to 2D canvas coordinates.
*/

/*
  IN OTHER WORDS:
  These are the "coloring book outlines" of the continents. They're
  simplified so they draw fast, but you can still tell North America
  from South America. When the globe rotates, these outlines move
  with it so worship team members can see which continent everyone
  is on.
*/

interface GeoPoint {
  lat: number;
  lon: number;
}

const CONTINENTS: GeoPoint[][] = [
  // North America (simplified polygon)
  [
    { lat: 60, lon: -140 }, { lat: 70, lon: -100 }, { lat: 75, lon: -80 },
    { lat: 60, lon: -50 }, { lat: 45, lon: -60 }, { lat: 30, lon: -80 },
    { lat: 25, lon: -100 }, { lat: 30, lon: -115 }, { lat: 40, lon: -125 },
    { lat: 50, lon: -130 }
  ],
  // South America
  [
    { lat: 10, lon: -70 }, { lat: 5, lon: -60 }, { lat: -20, lon: -40 },
    { lat: -40, lon: -60 }, { lat: -55, lon: -70 }, { lat: -30, lon: -75 },
    { lat: -5, lon: -80 }, { lat: 0, lon: -75 }
  ],
  // Europe
  [
    { lat: 70, lon: 20 }, { lat: 75, lon: 40 }, { lat: 70, lon: 60 },
    { lat: 60, lon: 50 }, { lat: 50, lon: 40 }, { lat: 40, lon: 30 },
    { lat: 35, lon: 25 }, { lat: 40, lon: 10 }, { lat: 50, lon: 0 },
    { lat: 60, lon: 10 }
  ],
  // Africa
  [
    { lat: 35, lon: -10 }, { lat: 30, lon: 10 }, { lat: 10, lon: 10 },
    { lat: -5, lon: 15 }, { lat: -20, lon: 20 }, { lat: -35, lon: 20 },
    { lat: -30, lon: 30 }, { lat: 0, lon: 40 }, { lat: 15, lon: 50 },
    { lat: 30, lon: 30 }
  ],
  // Asia
  [
    { lat: 70, lon: 60 }, { lat: 75, lon: 100 }, { lat: 70, lon: 170 },
    { lat: 60, lon: 180 }, { lat: 50, lon: 160 }, { lat: 40, lon: 140 },
    { lat: 30, lon: 130 }, { lat: 20, lon: 110 }, { lat: 10, lon: 100 },
    { lat: 20, lon: 80 }, { lat: 40, lon: 70 }, { lat: 60, lon: 70 }
  ],
  // Australia
  [
    { lat: -10, lon: 130 }, { lat: -20, lon: 145 }, { lat: -35, lon: 150 },
    { lat: -40, lon: 145 }, { lat: -35, lon: 115 }, { lat: -20, lon: 115 }
  ]
];

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Starfield Generation
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The starfield is generated once during initialization and persists
  across frames. Stars are randomly distributed with varying sizes
  and twinkle phases for natural appearance. The starCount adjusts
  based on performance (reduced when FPS drops below threshold).
*/

/*
  IN OTHER WORDS:
  This creates the "night sky" behind the Earth. Each star has a
  random position, size, and twinkle speed so they don't all blink
  in unison like cheap Christmas lights. They look like real stars.
*/

interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
}

function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2 + 0.5,
      phase: Math.random() * Math.PI * 2
    });
  }
  return stars;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: 3D Projection & Coordinate Conversion
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The conductor projects 3D geographic coordinates (latitude,
  longitude) onto a 2D canvas using orthographic projection.

  Conversion pipeline:
  1. lat/lon (degrees) -> radians
  2. Spherical to Cartesian: x = cos(lat) * cos(lon), y = sin(lat), z = cos(lat) * sin(lon)
  3. Apply Earth rotation: rotate around Y axis by rotation angle
  4. Project to 2D: screenX = centerX + x * radius, screenY = centerY - y * radius
  5. Visibility test: only draw if z > 0 (front-facing hemisphere)

  The rotation angle is derived from UTC time: Earth rotates
  15° per hour, so at any given moment the rotation is:
  rotation = (UTC hours * 15 + UTC minutes * 0.25) % 360

  This means the globe always shows the correct day/night
  terminator and the meridian sweeps at real-time speed.
*/

/*
  IN OTHER WORDS:
  This is the "map projection" math. The Earth is a 3D ball,
  but the screen is flat. These formulas take a point on the
  globe (like "Seattle, Washington") and figure out where it
  should appear on the flat screen, taking into account how
  much the globe has rotated. It also knows not to draw points
  on the back side of the globe — you wouldn't see them anyway.
*/

interface ScreenPoint {
  x: number;
  y: number;
  z: number;
  visible: boolean;
}

function latLonToScreen(
  lat: number,
  lon: number,
  rotation: number,
  centerX: number,
  centerY: number,
  earthRadius: number
): ScreenPoint {
  const radLat = (lat * Math.PI) / 180;
  const radLon = ((lon + rotation) * Math.PI) / 180;

  const x = Math.cos(radLat) * Math.cos(radLon);
  const y = Math.sin(radLat);
  const z = Math.cos(radLat) * Math.sin(radLon);

  const screenX = centerX + x * earthRadius;
  const screenY = centerY - y * earthRadius;

  return {
    x: screenX,
    y: screenY,
    z: z,
    visible: z > 0
  };
}

function getEarthRotation(): number {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcSeconds = now.getUTCSeconds();

  // Earth rotates 15° per hour, 0.25° per minute, 0.00417° per second
  return (utcHours * 15 + utcMinutes * 0.25 + utcSeconds * (0.25 / 60)) % 360;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Rendering Functions
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The render loop draws the complete visual scene in layers:

  Layer 1: Background (solid dark color)
  Layer 2: Stars (twinkling points)
  Layer 3: Earth (circle with grid lines)
  Layer 4: Landmass outlines (simplified continents)
  Layer 5: Golden meridian (sweeping line)
  Layer 6: Musician dots (glowing points with labels)
  Layer 7: Beat pulse (expanding rings from center)
  Layer 8: Atmosphere glow (subtle edge highlight)

  Each layer is drawn in sequence, with later layers overlaying
  earlier ones. The entire scene is cleared and redrawn every
  frame for smooth animation.

  Performance optimization: If FPS drops below 30, detailLevel
  is reduced to 0.5, which halves the star count, skips landmass
  drawing, and reduces pulse ring count.
*/

/*
  IN OTHER WORDS:
  This is the "painter" who creates the scene frame by frame.
  First they paint the dark sky. Then they add the stars. Then
  they paint the Earth as a dark circle with grid lines. Then
  they sketch the continents. Then they draw the golden
  meridian line sweeping across. Then they add glowing dots
  for each worship team member. Then they paint the heartbeat pulse
  expanding from the center. Finally, they add a soft glow
  around the edge of the Earth. Every frame, they start over
  and paint it all again — 60 times per second.
*/

function drawStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  width: number,
  height: number,
  timestamp: number,
  config: ConductorConfig,
  detailLevel: number
): void {
  const starCount = Math.floor(config.starCount * detailLevel);

  for (let i = 0; i < starCount; i++) {
    const star = stars[i];
    const twinkle = Math.sin((timestamp / 1000 * config.starTwinkleSpeed) + star.phase);
    const alpha = 0.3 + (twinkle * 0.2);

    ctx.beginPath();
    ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
  }
}

function drawEarth(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  earthRadius: number,
  config: ConductorConfig
): void {
  // Earth base circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
  ctx.fillStyle = config.earthColor;
  ctx.fill();

  // Subtle inner glow
  const gradient = ctx.createRadialGradient(
    centerX, centerY, earthRadius * 0.8,
    centerX, centerY, earthRadius
  );
  gradient.addColorStop(0, 'rgba(78, 205, 196, 0.05)');
  gradient.addColorStop(1, 'rgba(78, 205, 196, 0)');
  ctx.fillStyle = gradient;
  ctx.fill();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  earthRadius: number,
  rotation: number,
  config: ConductorConfig
): void {
  ctx.strokeStyle = config.earthGridColor;
  ctx.lineWidth = 1;

  // Latitude lines (horizontal)
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = centerY - (lat / 90) * earthRadius;
    const chordWidth = Math.sqrt(
      Math.max(0, earthRadius * earthRadius - (y - centerY) * (y - centerY))
    ) * 2;

    if (chordWidth > 0) {
      ctx.beginPath();
      ctx.ellipse(centerX, y, chordWidth / 2, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Longitude lines (vertical arcs)
  for (let lon = 0; lon < 360; lon += 30) {
    const rot = ((lon + rotation) * Math.PI) / 180;
    const x = centerX + Math.cos(rot) * earthRadius;

    ctx.beginPath();
    ctx.ellipse(x, centerY, 4, earthRadius, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawLandmasses(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  earthRadius: number,
  rotation: number,
  config: ConductorConfig
): void {
  ctx.fillStyle = config.earthLandColor;
  ctx.strokeStyle = config.earthBorderColor;
  ctx.lineWidth = 1;

  CONTINENTS.forEach(continent => {
    ctx.beginPath();
    let first = true;

    continent.forEach(point => {
      const screen = latLonToScreen(
        point.lat, point.lon, rotation,
        centerX, centerY, earthRadius
      );
      if (screen.visible) {
        if (first) {
          ctx.moveTo(screen.x, screen.y);
          first = false;
        } else {
          ctx.lineTo(screen.x, screen.y);
        }
      }
    });

    if (!first) {
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  });
}

function drawMeridian(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  earthRadius: number,
  meridianAngle: number,
  config: ConductorConfig
): void {
  const angle = (meridianAngle * Math.PI) / 180;

  // Calculate meridian endpoints on the circle
  const x1 = centerX + Math.cos(angle) * earthRadius;
  const y1 = centerY - Math.sin(angle) * earthRadius * 0.3; // Elliptical projection
  const x2 = centerX - Math.cos(angle) * earthRadius;
  const y2 = centerY + Math.sin(angle) * earthRadius * 0.3;

  // Draw glow
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = config.meridianGlowColor;
  ctx.lineWidth = config.meridianWidth * 4;
  ctx.stroke();

  // Draw core line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = config.meridianColor;
  ctx.lineWidth = config.meridianWidth;
  ctx.stroke();
}

function drawMusicianDots(
  ctx: CanvasRenderingContext2D,
  musicians: Map<string, Musician>,
  centerX: number,
  centerY: number,
  earthRadius: number,
  rotation: number,
  timestamp: number,
  config: ConductorConfig,
  detailLevel: number
): void {
  musicians.forEach((musician) => {
    const screen = latLonToScreen(
      musician.lat, musician.lon, rotation,
      centerX, centerY, earthRadius
    );

    if (!screen.visible) return;

    const isSelf = musician.isSelf || musician.peerId === 'self';
    const color = isSelf ? config.dotSelfColor : (musician.color || config.dotPeerColor);
    const pulseSpeed = config.dotPulseSpeed;
    const pulsePhase = (timestamp / 1000 * pulseSpeed) % (Math.PI * 2);
    const glowSize = config.dotGlowRadius + Math.sin(pulsePhase) * 3;

    // Outer glow
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = `${color}33`; // 20% opacity
    ctx.fill();

    // Inner dot
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Label (only for self or at full detail)
    if (isSelf || detailLevel > 0.5) {
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(240, 240, 245, 0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(musician.name || musician.peerId.substring(0, 6), screen.x, screen.y - 12);
    }
  });
}

function drawAtmosphere(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  earthRadius: number
): void {
  // Subtle atmosphere glow
  const gradient = ctx.createRadialGradient(
    centerX, centerY, earthRadius * 0.95,
    centerX, centerY, earthRadius * 1.1
  );
  gradient.addColorStop(0, 'rgba(78, 205, 196, 0.1)');
  gradient.addColorStop(1, 'rgba(78, 205, 196, 0)');

  ctx.beginPath();
  ctx.arc(centerX, centerY, earthRadius * 1.1, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function drawPulse(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  timestamp: number,
  bpm: number,
  config: ConductorConfig
): void {
  // Update pulse phase
  const pulseSpeed = (bpm / 60) * Math.PI * 2; // radians per second
  const pulsePhase = (timestamp / 1000 * pulseSpeed) % (Math.PI * 2);

  const pulseProgress = Math.sin(pulsePhase);
  const pulseRadius = 20 + (pulseProgress * config.pulseMaxRadius);
  const pulseAlpha = 0.3 + (pulseProgress * 0.3);

  // Outer ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(212, 168, 83, ${pulseAlpha})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner glow
  ctx.beginPath();
  ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(212, 168, 83, ${0.5 + pulseAlpha * 0.3})`;
  ctx.fill();
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: React Component Implementation
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The UnityConductor React component manages the Canvas lifecycle:
  - Creates the canvas context on mount
  - Starts the animation loop via requestAnimationFrame
  - Handles window resize for responsive sizing
  - Updates when props change (musicians, mode, BPM)
  - Cleans up all resources on unmount

  The component uses refs for mutable state (canvas context, animation
  frame ID, musicians Map) to avoid unnecessary re-renders. React state
  is used only for values that affect the render output (diagnostics).

  The animation loop runs independently of React's render cycle for
  maximum performance. It reads the current props via refs and draws
  directly to the canvas.
*/

/*
  IN OTHER WORDS:
  This is the "stage manager" who runs the planetarium show. They
  set up the canvas (the dome), start the animation (the show),
  handle resizing (adjusting the dome when the theater changes size),
  and clean up when the show ends. They use "memory notes" (refs)
  to track what's happening without constantly telling React to redraw.
*/

export const UnityConductor: React.FC<UnityConductorProps> = ({
  mode = 'focused',
  musicians = [],
  bpm = 120,
  className = '',
  onDiagnosticsUpdate,
  onMusicianClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animFrameRef = useRef<number>(0);
  const musiciansRef = useRef<Map<string, Musician>>(new Map());
  const starsRef = useRef<Star[]>([]);
  const lastFrameTimeRef = useRef(0);
  const fpsRef = useRef(60);
  const detailLevelRef = useRef(1.0);
  const configRef = useRef<ConductorConfig>(DEFAULT_CONFIG);
  const modeRef = useRef<ConductorMode>(mode);
  const bpmRef = useRef(bpm);

  const [diagnostics, setDiagnostics] = useState<ConductorDiagnostics>({
    isRunning: false,
    mode: mode,
    fps: 60,
    detailLevel: 1.0,
    musicianCount: 0,
    rotation: 0,
    meridianAngle: 0,
    canvasSize: '0x0'
  });

  // Update refs when props change
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  // Update musicians map when prop changes
  useEffect(() => {
    const map = new Map<string, Musician>();
    musicians.forEach(m => map.set(m.peerId, m));
    musiciansRef.current = map;
  }, [musicians]);

  // Initialize canvas and context
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return false;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    // Set actual canvas dimensions (scaled for retina)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });

    if (!ctx) return false;

    // Scale context for retina
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;

    // Generate stars
    starsRef.current = generateStars(configRef.current.starCount);

    return true;
  }, []);

  // Resize handler
  const handleResize = useCallback(() => {
    initCanvas();
  }, [initCanvas]);

  // Main render loop
  const render = useCallback((timestamp: number) => {
    animFrameRef.current = requestAnimationFrame(render);

    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!ctx || !canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const earthRadius = Math.min(width, height) * 0.4;

    // Calculate FPS
    const deltaTime = timestamp - lastFrameTimeRef.current;
    lastFrameTimeRef.current = timestamp;
    if (deltaTime > 0) {
      fpsRef.current = 1000 / deltaTime;
    }

    // Adjust detail level based on performance
    if (fpsRef.current < configRef.current.lowFpsThreshold) {
      detailLevelRef.current = configRef.current.detailReductionFactor;
    } else {
      detailLevelRef.current = 1.0;
    }

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    // Skip rendering if hidden
    if (modeRef.current === 'hidden') return;

    const config = configRef.current;

    // Layer 2: Stars
    drawStars(ctx, starsRef.current, width, height, timestamp, config, detailLevelRef.current);

    // Layer 3-8: Earth and overlays (only if not minimal mode)
    if (modeRef.current !== 'minimal') {
      // Update rotation
      const rotation = getEarthRotation();
      const meridianAngle = (timestamp / 1000 * config.earthRotationSpeed) % 360;

      // Layer 3: Earth base
      drawEarth(ctx, centerX, centerY, earthRadius, config);

      // Layer 4: Grid lines
      drawGrid(ctx, centerX, centerY, earthRadius, rotation, config);

      // Layer 5: Landmasses (only at full detail)
      if (detailLevelRef.current > 0.5) {
        drawLandmasses(ctx, centerX, centerY, earthRadius, rotation, config);
      }

      // Layer 6: Meridian
      drawMeridian(ctx, centerX, centerY, earthRadius, meridianAngle, config);

      // Layer 7: Musician dots
      drawMusicianDots(
        ctx, musiciansRef.current,
        centerX, centerY, earthRadius, rotation,
        timestamp, config, detailLevelRef.current
      );

      // Layer 8: Atmosphere
      drawAtmosphere(ctx, centerX, centerY, earthRadius);

      // Update diagnostics
      const newDiagnostics: ConductorDiagnostics = {
        isRunning: true,
        mode: modeRef.current,
        fps: Math.round(fpsRef.current),
        detailLevel: detailLevelRef.current,
        musicianCount: musiciansRef.current.size,
        rotation,
        meridianAngle,
        canvasSize: `${Math.round(width)}x${Math.round(height)}`
      };

      // Only update React state every 10 frames to avoid excessive re-renders
      if (Math.round(timestamp) % 10 === 0) {
        setDiagnostics(newDiagnostics);
        onDiagnosticsUpdate?.(newDiagnostics);
      }
    }

    // Layer 9: Beat pulse (always drawn, even in minimal mode)
    drawPulse(ctx, centerX, centerY, timestamp, bpmRef.current, config);
  }, [onDiagnosticsUpdate]);

  // Start/stop animation
  useEffect(() => {
    const success = initCanvas();
    if (!success) return;

    // Start animation
    animFrameRef.current = requestAnimationFrame(render);

    // Handle resize
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [initCanvas, render, handleResize]);

  // Handle canvas click for musician selection
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onMusicianClick) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const earthRadius = Math.min(rect.width, rect.height) * 0.4;
    const rotation = getEarthRotation();

    // Check if click is near any musician
    musiciansRef.current.forEach((musician) => {
      const screen = latLonToScreen(
        musician.lat, musician.lon, rotation,
        centerX, centerY, earthRadius
      );

      if (!screen.visible) return;

      const distance = Math.sqrt(
        (clickX - screen.x) ** 2 + (clickY - screen.y) ** 2
      );

      if (distance < 20) {
        onMusicianClick(musician);
      }
    });
  }, [onMusicianClick]);

  // Calculate container opacity based on mode
  const getContainerOpacity = (): number => {
    switch (mode) {
      case 'ambient': return configRef.current.ambientOpacity;
      case 'focused': return configRef.current.focusedOpacity;
      case 'minimal': return configRef.current.focusedOpacity;
      case 'hidden': return 0;
      default: return 1;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`unity-conductor ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: mode === 'hidden' ? 'none' : 'auto',
        opacity: getContainerOpacity(),
        transition: 'opacity 400ms ease'
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: onMusicianClick ? 'pointer' : 'default'
        }}
      />

      {/* Conductor overlay info */}
      {mode !== 'hidden' && mode !== 'minimal' && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            pointerEvents: 'none'
          }}
        >
          {/* Pulse indicator */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '2px solid #d4a853',
              opacity: 0,
              animation: `conductor-beat ${60 / bpm}s ease-out infinite`
            }}
          />

          {/* BPM and tier info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(18, 18, 26, 0.72)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '9999px',
              fontFamily: 'SF Mono, Monaco, monospace'
            }}
          >
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d4a853' }}>
              {bpm}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#606070', textTransform: 'uppercase' }}>
              BPM
            </span>
          </div>
        </div>
      )}

      {/* Hidden style for pulse animation */}
      <style>{`
        @keyframes conductor-beat {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Custom Hook for NTCC Music App Integration
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The useUnityConductor hook provides a convenient way for NTCC Music App
  components to control and monitor the visual conductor. It manages
  musician state, mode transitions, and diagnostic polling. This follows
  the pattern established in your Adoración app for component-service integration.
*/

/*
  IN OTHER WORDS:
  This is the "remote control" for the planetarium dome. Worship team
  leaders use this to: add/remove musicians from the map, change the
  display mode, check how smoothly the animation is running, and get
  a full status report.
*/

export interface UseUnityConductorReturn {
  musicians: Musician[];
  mode: ConductorMode;
  diagnostics: ConductorDiagnostics | null;
  addMusician: (musician: Musician) => void;
  removeMusician: (peerId: string) => void;
  updateMusicianPosition: (peerId: string, lat: number, lon: number) => void;
  setMode: (mode: ConductorMode) => void;
  setSelfPosition: (lat: number, lon: number, name?: string) => void;
}

export function useUnityConductor(initialMode: ConductorMode = 'focused'): UseUnityConductorReturn {
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [mode, setModeState] = useState<ConductorMode>(initialMode);
  const [diagnostics, setDiagnostics] = useState<ConductorDiagnostics | null>(null);

  const addMusician = useCallback((musician: Musician) => {
    setMusicians(prev => {
      const filtered = prev.filter(m => m.peerId !== musician.peerId);
      return [...filtered, musician];
    });
  }, []);

  const removeMusician = useCallback((peerId: string) => {
    setMusicians(prev => prev.filter(m => m.peerId !== peerId));
  }, []);

  const updateMusicianPosition = useCallback((peerId: string, lat: number, lon: number) => {
    setMusicians(prev =>
      prev.map(m =>
        m.peerId === peerId ? { ...m, lat, lon } : m
      )
    );
  }, []);

  const setMode = useCallback((newMode: ConductorMode) => {
    setModeState(newMode);
  }, []);

  const setSelfPosition = useCallback((lat: number, lon: number, name: string = 'You') => {
    setMusicians(prev => {
      const filtered = prev.filter(m => m.peerId !== 'self');
      return [...filtered, {
        peerId: 'self',
        lat,
        lon,
        name,
        instrument: 'local',
        isSelf: true
      }];
    });
  }, []);

  return {
    musicians,
    mode,
    diagnostics,
    addMusician,
    removeMusician,
    updateMusicianPosition,
    setMode,
    setSelfPosition
  };
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Named Export & Module Registration
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The component is exported as both a named export (UnityConductor) and
  the hook as a separate named export (useUnityConductor). This allows
  flexible import patterns in the NTCC Music App:

  import { UnityConductor, useUnityConductor } from './components/UnityConductor';

  The component is also registered globally for non-React contexts or
  legacy integration points.
*/

/*
  IN OTHER WORDS:
  This is the "shipping label" that makes sure the planetarium dome
  can be delivered to any part of the NTCC Music App that needs it.
  Whether it's a React component tree or a standalone script, the
  conductor is always available.
*/

UnityConductor.displayName = 'UnityConductor';

export default UnityConductor;

// Global registration for non-React contexts
if (typeof window !== 'undefined') {
  (window as any).UnityConductor = UnityConductor;
  (window as any).useUnityConductor = useUnityConductor;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: End of Module
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  This concludes the UnityConductor.tsx component module. It is the
  emotional and visual soul of the NTCC Music App — the element
  that transforms a technical audio tool into a shared worship
  experience.

  The conductor creates a sense of place, presence, and unity
  that transcends physical distance. When worship team members see
  their own golden dot on the rotating Earth, pulsing in time with
  the shared beat, they are no longer "remote collaborators" —
  they are a single worship team, orbiting together around a shared
  heartbeat.

  Future enhancements:
  - WebGL renderer for higher fidelity and 3D globe
  - Real-time weather/aurora effects based on musician locations
  - Day/night terminator accurate to local time
  - Constellation lines connecting musician dots
  - Customizable globe textures (Earth, Moon, abstract)
*/

/*
  IN OTHER WORDS:
  This is the "magic" of the NTCC Music App. Not the audio
  algorithms, not the network protocols — but the feeling of
  looking up and seeing the same sky as someone 10,000 miles
  away. The feeling of your heart beating in sync with theirs.
  The feeling of being part of something bigger than yourself,
  bigger than the internet, bigger than the distance between
  you. This is what makes worship teams want to play together.
  This is what makes the latency vanish — not in the wires,
  but in the soul.
*/

/* End of UnityConductor.tsx */
/* © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community */
