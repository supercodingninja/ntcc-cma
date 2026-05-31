/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  src/services/UnityLED.ts                                                     ║
 * ║  NTCC Music App — Unity Solution™ | The Super Coding Ninja™                 ║
 * ║  SCN Technologies™ | © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,              ║
 * ║  𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * This Area Of Code Is: DMX512 LED Lighting Controller Service
 * Explanation:
 *   Receives UnityBeatTick events from UnityMediaPipe and translates them
 *   into real-time DMX512 lighting commands across the sanctuary stage.
 *   Supports RGBW+ Amber/UV LED fixtures, moving heads, and atmospheric
 *   effects (haze/fog) synchronized to conductor gestures and song structure.
 *
 *   Architecture:
 *   ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
 *   │  UnityBeatTick  │────▶│    UnityLED      │────▶│   DMX512 USB    │
 *   │  (conductor)    │     │   Scene Engine   │     │   Enttec Pro    │
 *   └─────────────────┘     └──────────────────┘     └─────────────────┘
 *                                    │
 *                 ┌──────────────────┼──────────────────┐
 *                 ▼                  ▼                  ▼
 *           ┌──────────┐      ┌──────────┐      ┌──────────┐
 *           │  Wash    │      │  Spot    │      │  Effect  │
 *           │  Lights  │      │  Lights  │      │  (Haze)  │
 *           └──────────┘      └──────────┘      └──────────┘
 *
 *   NTCC Integration:
 *   - Beat-synchronized color washes (worship palette from Adoración)
 *   - Conductor-follow intensity (crescendo = brighter)
 *   - Song-section presets (Verse/Chorus/Bridge/Tag)
 *   - Prayer/altar-call dimming (grace period from MediaPipe)
 *   - CCLI-compliant house light levels during lyrics projection
 *
 * In Other Words:
 *   This is the "lighting director" that reads the conductor's gestures
 *   and automatically controls every stage light in real-time — no human
 *   lighting tech needed during worship. When the conductor blinks on the
 *   downbeat, the lights pulse. When they open wide for a crescendo,
 *   the stage gets brighter. When prayer starts, everything dims gently.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: DMX Channel Definition
 * Explanation:
 *   A single DMX512 channel assignment with value range [0, 255].
 *   Channels map to fixture parameters (dimmer, RGB, pan, tilt, etc.).
 * In Other Words:
 *   One slider on the lighting board — "Channel 1 is the red light, set to 128."
 */
export interface DMXChannel {
  channel: number;      // 1–512 DMX universe address
  value: number;        // 0–255 intensity/value
  label?: string;       // Human-readable name (e.g., "Front Wash Red")
}

/**
 * This Area Of Code Is: LED Fixture Configuration
 * Explanation:
 *   Defines a physical lighting fixture's DMX footprint, channel mapping,
 *   and capabilities. Supports RGBW, RGBA, RGBAW-UV, and moving head profiles.
 * In Other Words:
 *   The spec sheet for one stage light — "This light uses 6 DMX channels:
 *   red on ch.1, green on ch.2, dimmer on ch.6, etc."
 */
export interface LEDFixture {
  id: string;               // Unique fixture identifier
  name: string;             // Human-readable name (e.g., "Stage Left Wash")
  startChannel: number;     // First DMX channel (1–512)
  channelCount: number;     // Total channels used (3–32 typical)
  profile: 'rgb' | 'rgbw' | 'rgba' | 'rgbaw-uv' | 'moving-head' | 'dimmer' | 'strobe';
  channelMap: {
    dimmer?: number;        // Relative offset from startChannel
    red?: number;
    green?: number;
    blue?: number;
    white?: number;
    amber?: number;
    uv?: number;
    pan?: number;
    tilt?: number;
    zoom?: number;
    strobe?: number;
    macro?: number;
  };
  position: {
    x: number;              // Stage position in meters (stage center = 0,0)
    y: number;
    z: number;              // Height above stage
  };
  group: 'front-wash' | 'back-wash' | 'side-wash' | 'spot' | 'effect' | 'house' | 'architectural';
  maxIntensity: number;     // Physical fixture max lumens (for normalization)
}

/**
 * This Area Of Code Is: Color Definition
 * Explanation:
 *   A worship-appropriate color with DMX-ready RGBW+ values and metadata.
 *   Includes biblical/thematic association for NTCC service planning.
 * In Other Words:
 *   A color that means something in church — "Royal Purple = Majesty of God."
 */
export interface WorshipColor {
  name: string;
  rgbw: { r: number; g: number; b: number; w: number };
  amber?: number;
  uv?: number;
  hex: string;
  theme: string;            // Biblical association
  intensityCurve: 'linear' | 'exponential' | 'sine'; // How brightness scales
}

/**
 * This Area Of Code Is: Lighting Scene / Cue
 * Explanation:
 *   A complete lighting state for a moment in the service.
 *   Defines all fixture values, transition timing, and trigger conditions.
 * In Other Words:
 *   A snapshot of every light setting — "For the chorus, make everything
 *   bright blue with a slow fade over 2 seconds."
 */
export interface LightingScene {
  id: string;
  name: string;             // e.g., "Chorus - Full Bright"
  description?: string;
  fixtureValues: Map<string, DMXChannel[]>; // fixtureId → channel values
  transition: {
    durationMs: number;     // Fade time
    easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'snap';
  };
  trigger: {
    type: 'beat' | 'measure' | 'section' | 'expression' | 'manual' | 'prayer-start' | 'prayer-end';
    beatNumber?: number;    // Trigger on beat 1, 2, 3, or 4
    measureModulo?: number; // Every N measures
    sectionName?: string;   // "verse", "chorus", "bridge", "tag", "intro", "outro"
    intensityThreshold?: number; // Expression intensity threshold
  };
  priority: number;         // 1–10, higher = overrides lower
  autoAdvance?: boolean;    // Automatically go to next scene
  nextSceneId?: string;
}

/**
 * This Area Of Code Is: DMX Universe State
 * Explanation:
 *   Complete 512-channel DMX universe snapshot.
 *   Represents the entire lighting rig at one moment.
 * In Other Words:
 *   Every single DMX channel value (1–512) at one point in time —
 *   the complete lighting picture.
 */
export interface DMXUniverse {
  channels: Uint8Array;     // 512 bytes, 0–255 per channel
  timestamp: number;
  sceneId?: string;
  checksum: number;         // Simple XOR checksum for integrity
}

/**
 * This Area Of Code Is: LED Service Configuration
 * Explanation:
 *   Runtime configuration for the DMX controller, fixture layout,
 *   and NTCC sanctuary-specific settings.
 * In Other Words:
 *   The church's lighting system settings — which lights are where,
 *   what colors to use, and how fast things should change.
 */
export interface LEDConfig {
  // Hardware
  dmxInterface: 'enttec-usb-pro' | 'enttec-open-dmx' | 'artnet' | 'sacn' | 'simulation';
  serialPortPath?: string;  // e.g., "/dev/tty.usbserial-EN..." (Mac) or "COM3" (Windows)
  artNetIp?: string;
  artNetUniverse?: number;

  // Fixture layout
  fixtures: LEDFixture[];

  // Color palette (NTCC worship colors)
  colorPalette: WorshipColor[];

  // Scene library
  scenes: LightingScene[];

  // Behavior
  defaultFadeMs: number;
  beatSyncEnabled: boolean;
  expressionSyncEnabled: boolean;
  prayerDimLevel: number;   // 0–255 house light level during prayer
  lyricProjectionLevel: number; // House lights during lyrics (CCLI compliance)
  maxFrameRate: number;     // DMX refresh rate (default 44Hz = DMX standard)

  // Safety
  emergencyWhiteout: boolean; // All lights full white on panic
  blackoutOnError: boolean;   // All lights off on communication failure
}

// ═══════════════════════════════════════════════════════════════════════════════
// NTCC WORSHIP COLOR PALETTE (from Adoración + NTCC brand)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: NTCC Worship Color Palette
 * Explanation:
 *   Curated colors with biblical significance for NTCC Graham worship services.
 *   Derived from Adoración's worship palette with NTCC-specific additions.
 *   Each color has a theological theme and optimal intensity curve for LED
 *   fixtures (accounting for perceptual brightness non-linearity).
 *
 *   Color Psychology in Worship:
 *   - Royal Purple: Majesty, sovereignty, Advent/Lent
 *   - Crimson Red: Blood of Christ, passion, Pentecost
 *   - Gold: Glory, divinity, celebration
 *   - Sapphire Blue: Heaven, Holy Spirit, tranquility
 *   - Emerald Green: New life, growth, Ordinary Time
 *   - Amber/Warm White: Intimacy, warmth, community
 *   - UV/Blacklight: Mystery, transcendence, youth events
 *
 * In Other Words:
 *   The "paint box" for NTCC worship lighting — each color tells a story
 *   from Scripture and is calibrated to look right on actual LED fixtures.
 */
export const NTCC_WORSHIP_PALETTE: WorshipColor[] = [
  {
    name: 'Royal Purple',
    rgbw: { r: 128, g: 0, b: 128, w: 20 },
    hex: '#800080',
    theme: 'Majesty of God, Sovereignty, Advent',
    intensityCurve: 'exponential',
  },
  {
    name: 'Crimson Red',
    rgbw: { r: 220, g: 20, b: 60, w: 0 },
    hex: '#DC143C',
    theme: 'Blood of Christ, Passion, Pentecost',
    intensityCurve: 'linear',
  },
  {
    name: 'Glory Gold',
    rgbw: { r: 255, g: 215, b: 0, w: 100 },
    amber: 80,
    hex: '#FFD700',
    theme: 'Divine Glory, Celebration, Resurrection',
    intensityCurve: 'sine',
  },
  {
    name: 'Sapphire Blue',
    rgbw: { r: 0, g: 100, b: 200, w: 30 },
    hex: '#0064C8',
    theme: 'Heaven, Holy Spirit, Peace',
    intensityCurve: 'exponential',
  },
  {
    name: 'Emerald Green',
    rgbw: { r: 0, g: 180, b: 80, w: 40 },
    hex: '#00B450',
    theme: 'New Life, Growth, Creation',
    intensityCurve: 'linear',
  },
  {
    name: 'Warm Amber',
    rgbw: { r: 255, g: 160, b: 40, w: 120 },
    amber: 200,
    hex: '#FFA028',
    theme: 'Intimacy, Warmth, Fellowship',
    intensityCurve: 'sine',
  },
  {
    name: 'Pure White',
    rgbw: { r: 0, g: 0, b: 0, w: 255 },
    hex: '#FFFFFF',
    theme: 'Purity, Holiness, Transfiguration',
    intensityCurve: 'linear',
  },
  {
    name: 'Mystery UV',
    rgbw: { r: 50, g: 0, b: 255, w: 0 },
    uv: 255,
    hex: '#3200FF',
    theme: 'Mystery, Transcendence, Youth',
    intensityCurve: 'exponential',
  },
  {
    name: 'Sunset Orange',
    rgbw: { r: 255, g: 120, b: 0, w: 60 },
    amber: 150,
    hex: '#FF7800',
    theme: 'Evening prayer, Thanksgiving, Harvest',
    intensityCurve: 'sine',
  },
  {
    name: 'Deep Indigo',
    rgbw: { r: 40, g: 0, b: 120, w: 10 },
    hex: '#280078',
    theme: 'Night vigil, Contemplation, Repentance',
    intensityCurve: 'exponential',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT NTCC FIXTURE LAYOUT (Graham Sanctuary)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: Default NTCC Fixture Layout
 * Explanation:
 *   Pre-configured fixture map for NTCC Graham sanctuary stage.
 *   Calibrated for typical small-to-medium church stage dimensions
 *   (~8m wide × 6m deep × 4m high) with standard LED wash fixtures.
 *
 *   Fixture Groups:
 *   - Front Wash: 4 fixtures, even coverage of platform
 *   - Back Wash: 2 fixtures, depth and separation from black backdrop
 *   - Side Wash: 2 fixtures, side-fill and dimension
 *   - Spots: 2 moving heads or fixed spots for soloists/pastor
 *   - House: 4 dimmer channels for auditorium house lights
 *   - Effect: 1 strobe/hazer channel
 *
 *   DMX Channel Allocation:
 *   1–24:   Front Wash (4× RGBW = 4×6ch)
 *   25–42:  Back Wash (2× RGBW = 2×6ch, but 3ch mode)
 *   43–60:  Side Wash (2× RGBW)
 *   61–84:  Spots (2× moving head, 12ch each)
 *   85–88:  House Dimmers (4ch)
 *   89–92:  Effect (strobe + hazer)
 *
 * In Other Words:
 *   The "floor plan" of every light at NTCC Graham — where it sits,
 *   what DMX channels it uses, and what it can do.
 */
export const DEFAULT_NTCC_FIXTURES: LEDFixture[] = [
  // Front Wash — 4 RGBW fixtures across front truss
  {
    id: 'fw-1',
    name: 'Front Wash Left',
    startChannel: 1,
    channelCount: 6,
    profile: 'rgbw',
    channelMap: { dimmer: 1, red: 2, green: 3, blue: 4, white: 5, macro: 6 },
    position: { x: -3, y: 0, z: 3.5 },
    group: 'front-wash',
    maxIntensity: 8000,
  },
  {
    id: 'fw-2',
    name: 'Front Wash Center-Left',
    startChannel: 7,
    channelCount: 6,
    profile: 'rgbw',
    channelMap: { dimmer: 1, red: 2, green: 3, blue: 4, white: 5, macro: 6 },
    position: { x: -1, y: 0, z: 3.5 },
    group: 'front-wash',
    maxIntensity: 8000,
  },
  {
    id: 'fw-3',
    name: 'Front Wash Center-Right',
    startChannel: 13,
    channelCount: 6,
    profile: 'rgbw',
    channelMap: { dimmer: 1, red: 2, green: 3, blue: 4, white: 5, macro: 6 },
    position: { x: 1, y: 0, z: 3.5 },
    group: 'front-wash',
    maxIntensity: 8000,
  },
  {
    id: 'fw-4',
    name: 'Front Wash Right',
    startChannel: 19,
    channelCount: 6,
    profile: 'rgbw',
    channelMap: { dimmer: 1, red: 2, green: 3, blue: 4, white: 5, macro: 6 },
    position: { x: 3, y: 0, z: 3.5 },
    group: 'front-wash',
    maxIntensity: 8000,
  },

  // Back Wash — 2 RGB fixtures for depth
  {
    id: 'bw-1',
    name: 'Back Wash Left',
    startChannel: 25,
    channelCount: 3,
    profile: 'rgb',
    channelMap: { red: 1, green: 2, blue: 3 },
    position: { x: -2, y: -4, z: 2 },
    group: 'back-wash',
    maxIntensity: 5000,
  },
  {
    id: 'bw-2',
    name: 'Back Wash Right',
    startChannel: 28,
    channelCount: 3,
    profile: 'rgb',
    channelMap: { red: 1, green: 2, blue: 3 },
    position: { x: 2, y: -4, z: 2 },
    group: 'back-wash',
    maxIntensity: 5000,
  },

  // Side Wash — 2 RGBW fixtures
  {
    id: 'sw-1',
    name: 'Side Wash Stage Left',
    startChannel: 31,
    channelCount: 6,
    profile: 'rgbw',
    channelMap: { dimmer: 1, red: 2, green: 3, blue: 4, white: 5, macro: 6 },
    position: { x: -4.5, y: -2, z: 3 },
    group: 'side-wash',
    maxIntensity: 6000,
  },
  {
    id: 'sw-2',
    name: 'Side Wash Stage Right',
    startChannel: 37,
    channelCount: 6,
    profile: 'rgbw',
    channelMap: { dimmer: 1, red: 2, green: 3, blue: 4, white: 5, macro: 6 },
    position: { x: 4.5, y: -2, z: 3 },
    group: 'side-wash',
    maxIntensity: 6000,
  },

  // Spots — 2 moving heads (simplified 12ch profile)
  {
    id: 'spot-1',
    name: 'Spot Stage Left',
    startChannel: 43,
    channelCount: 12,
    profile: 'moving-head',
    channelMap: {
      pan: 1, tilt: 2, dimmer: 3, red: 4, green: 5, blue: 6,
      white: 7, zoom: 8, strobe: 9, macro: 10,
    },
    position: { x: -3.5, y: 1, z: 4 },
    group: 'spot',
    maxIntensity: 10000,
  },
  {
    id: 'spot-2',
    name: 'Spot Stage Right',
    startChannel: 55,
    channelCount: 12,
    profile: 'moving-head',
    channelMap: {
      pan: 1, tilt: 2, dimmer: 3, red: 4, green: 5, blue: 6,
      white: 7, zoom: 8, strobe: 9, macro: 10,
    },
    position: { x: 3.5, y: 1, z: 4 },
    group: 'spot',
    maxIntensity: 10000,
  },

  // House Lights — 4 dimmer channels
  {
    id: 'house-1',
    name: 'House Left Section',
    startChannel: 67,
    channelCount: 1,
    profile: 'dimmer',
    channelMap: { dimmer: 1 },
    position: { x: -5, y: 5, z: 3 },
    group: 'house',
    maxIntensity: 15000,
  },
  {
    id: 'house-2',
    name: 'House Center-Left',
    startChannel: 68,
    channelCount: 1,
    profile: 'dimmer',
    channelMap: { dimmer: 1 },
    position: { x: -2, y: 5, z: 3 },
    group: 'house',
    maxIntensity: 15000,
  },
  {
    id: 'house-3',
    name: 'House Center-Right',
    startChannel: 69,
    channelCount: 1,
    profile: 'dimmer',
    channelMap: { dimmer: 1 },
    position: { x: 2, y: 5, z: 3 },
    group: 'house',
    maxIntensity: 15000,
  },
  {
    id: 'house-4',
    name: 'House Right Section',
    startChannel: 70,
    channelCount: 1,
    profile: 'dimmer',
    channelMap: { dimmer: 1 },
    position: { x: 5, y: 5, z: 3 },
    group: 'house',
    maxIntensity: 15000,
  },

  // Effect — Strobe + Hazer
  {
    id: 'fx-1',
    name: 'Stage Strobe',
    startChannel: 71,
    channelCount: 2,
    profile: 'strobe',
    channelMap: { dimmer: 1, strobe: 2 },
    position: { x: 0, y: -3, z: 3.5 },
    group: 'effect',
    maxIntensity: 12000,
  },
  {
    id: 'fx-2',
    name: 'Atmospheric Hazer',
    startChannel: 73,
    channelCount: 1,
    profile: 'dimmer',
    channelMap: { dimmer: 1 },
    position: { x: 0, y: -5, z: 0.5 },
    group: 'effect',
    maxIntensity: 3000,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT SCENE LIBRARY (Song-Section Based)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: Default Scene Library
 * Explanation:
 *   Pre-built lighting scenes for common worship song sections.
 *   Each scene targets specific fixture groups with NTCC worship colors.
 *   Scenes auto-trigger based on UnityMediaPipe beat/section detection.
 *
 *   Scene Flow (typical worship song):
 *   Intro → Verse (dim, intimate) → Pre-Chorus (build) → Chorus (full)
 *   → Verse 2 → Chorus → Bridge (intense) → Tag/Outro (fade)
 *
 *   NTCC-Specific:
 *   - Prayer scenes auto-dim to compliant levels for lyric projection
 *   - Altar call uses warm amber with slow pulse
 *   - Offering uses neutral white at medium intensity
 *   - Sermon spot focuses on pulpit area
 *
 * In Other Words:
 *   Pre-programmed "looks" for every part of a worship song —
 *   just tell the system "we're in the chorus now" and the lights
 *   automatically switch to the right colors and brightness.
 */
export const DEFAULT_NTCC_SCENES: LightingScene[] = [
  // ─── INTRO ──────────────────────────────────────────────────────────────────
  {
    id: 'scene-intro',
    name: 'Intro — Atmospheric',
    description: 'Low atmospheric wash, anticipation building',
    fixtureValues: new Map([
      ['fw-1', [{ channel: 1, value: 20, label: 'dimmer' }, { channel: 2, value: 0 }, { channel: 3, value: 0 }, { channel: 4, value: 40, label: 'blue' }, { channel: 5, value: 10 }]],
      ['fw-2', [{ channel: 7, value: 20, label: 'dimmer' }, { channel: 8, value: 0 }, { channel: 9, value: 0 }, { channel: 10, value: 40, label: 'blue' }, { channel: 11, value: 10 }]],
      ['fw-3', [{ channel: 13, value: 20, label: 'dimmer' }, { channel: 14, value: 0 }, { channel: 15, value: 0 }, { channel: 16, value: 40, label: 'blue' }, { channel: 17, value: 10 }]],
      ['fw-4', [{ channel: 19, value: 20, label: 'dimmer' }, { channel: 20, value: 0 }, { channel: 21, value: 0 }, { channel: 22, value: 40, label: 'blue' }, { channel: 23, value: 10 }]],
      ['bw-1', [{ channel: 25, value: 0 }, { channel: 26, value: 0 }, { channel: 27, value: 30, label: 'blue' }]],
      ['bw-2', [{ channel: 28, value: 0 }, { channel: 29, value: 0 }, { channel: 30, value: 30, label: 'blue' }]],
      ['house-1', [{ channel: 67, value: 0 }]],
      ['house-2', [{ channel: 68, value: 0 }]],
      ['house-3', [{ channel: 69, value: 0 }]],
      ['house-4', [{ channel: 70, value: 0 }]],
    ]),
    transition: { durationMs: 3000, easing: 'ease-in' },
    trigger: { type: 'section', sectionName: 'intro' },
    priority: 5,
  },

  // ─── VERSE ──────────────────────────────────────────────────────────────────
  {
    id: 'scene-verse',
    name: 'Verse — Intimate',
    description: 'Warm amber front wash, low back wash, house dim',
    fixtureValues: new Map([
      ['fw-1', [{ channel: 1, value: 60, label: 'dimmer' }, { channel: 2, value: 255, label: 'red' }, { channel: 3, value: 160, label: 'green' }, { channel: 4, value: 40, label: 'blue' }, { channel: 5, value: 120, label: 'white' }]],
      ['fw-2', [{ channel: 7, value: 60, label: 'dimmer' }, { channel: 8, value: 255 }, { channel: 9, value: 160 }, { channel: 10, value: 40 }, { channel: 11, value: 120 }]],
      ['fw-3', [{ channel: 13, value: 60, label: 'dimmer' }, { channel: 14, value: 255 }, { channel: 15, value: 160 }, { channel: 16, value: 40 }, { channel: 17, value: 120 }]],
      ['fw-4', [{ channel: 19, value: 60, label: 'dimmer' }, { channel: 20, value: 255 }, { channel: 21, value: 160 }, { channel: 22, value: 40 }, { channel: 23, value: 120 }]],
      ['bw-1', [{ channel: 25, value: 20 }, { channel: 26, value: 10 }, { channel: 27, value: 40 }]],
      ['bw-2', [{ channel: 28, value: 20 }, { channel: 29, value: 10 }, { channel: 30, value: 40 }]],
      ['sw-1', [{ channel: 31, value: 30, label: 'dimmer' }, { channel: 32, value: 200 }, { channel: 33, value: 120 }, { channel: 34, value: 20 }, { channel: 35, value: 80 }]],
      ['sw-2', [{ channel: 37, value: 30, label: 'dimmer' }, { channel: 38, value: 200 }, { channel: 39, value: 120 }, { channel: 40, value: 20 }, { channel: 41, value: 80 }]],
      ['house-1', [{ channel: 67, value: 15 }]],
      ['house-2', [{ channel: 68, value: 15 }]],
      ['house-3', [{ channel: 69, value: 15 }]],
      ['house-4', [{ channel: 70, value: 15 }]],
    ]),
    transition: { durationMs: 2000, easing: 'ease-in-out' },
    trigger: { type: 'section', sectionName: 'verse' },
    priority: 5,
  },

  // ─── PRE-CHORUS ─────────────────────────────────────────────────────────────
  {
    id: 'scene-prechorus',
    name: 'Pre-Chorus — Building',
    description: 'Increasing intensity, color shift toward chorus energy',
    fixtureValues: new Map([
      ['fw-1', [{ channel: 1, value: 100, label: 'dimmer' }, { channel: 2, value: 200 }, { channel: 3, value: 100 }, { channel: 4, value: 80 }, { channel: 5, value: 150 }]],
      ['fw-2', [{ channel: 7, value: 100, label: 'dimmer' }, { channel: 8, value: 200 }, { channel: 9, value: 100 }, { channel: 10, value: 80 }, { channel: 11, value: 150 }]],
      ['fw-3', [{ channel: 13, value: 100, label: 'dimmer' }, { channel: 14, value: 200 }, { channel: 15, value: 100 }, { channel: 16, value: 80 }, { channel: 17, value: 150 }]],
      ['fw-4', [{ channel: 19, value: 100, label: 'dimmer' }, { channel: 20, value: 200 }, { channel: 21, value: 100 }, { channel: 22, value: 80 }, { channel: 23, value: 150 }]],
      ['bw-1', [{ channel: 25, value: 60 }, { channel: 26, value: 30 }, { channel: 27, value: 80 }]],
      ['bw-2', [{ channel: 28, value: 60 }, { channel: 29, value: 30 }, { channel: 30, value: 80 }]],
      ['sw-1', [{ channel: 31, value: 60 }, { channel: 32, value: 180 }, { channel: 33, value: 100 }, { channel: 34, value: 60 }, { channel: 35, value: 120 }]],
      ['sw-2', [{ channel: 37, value: 60 }, { channel: 38, value: 180 }, { channel: 39, value: 100 }, { channel: 40, value: 60 }, { channel: 41, value: 120 }]],
      ['house-1', [{ channel: 67, value: 20 }]],
      ['house-2', [{ channel: 68, value: 20 }]],
      ['house-3', [{ channel: 69, value: 20 }]],
      ['house-4', [{ channel: 70, value: 20 }]],
    ]),
    transition: { durationMs: 1500, easing: 'ease-in' },
    trigger: { type: 'section', sectionName: 'pre-chorus' },
    priority: 6,
  },

  // ─── CHORUS ─────────────────────────────────────────────────────────────────
  {
    id: 'scene-chorus',
    name: 'Chorus — Full Bright',
    description: 'Maximum energy, glory gold + sapphire blue, full wash',
    fixtureValues: new Map([
      ['fw-1', [{ channel: 1, value: 255, label: 'dimmer' }, { channel: 2, value: 255, label: 'red' }, { channel: 3, value: 215, label: 'green' }, { channel: 4, value: 0, label: 'blue' }, { channel: 5, value: 200, label: 'white' }]],
      ['fw-2', [{ channel: 7, value: 255, label: 'dimmer' }, { channel: 8, value: 255 }, { channel: 9, value: 215 }, { channel: 10, value: 0 }, { channel: 11, value: 200 }]],
      ['fw-3', [{ channel: 13, value: 255, label: 'dimmer' }, { channel: 14, value: 255 }, { channel: 15, value: 215 }, { channel: 16, value: 0 }, { channel: 17, value: 200 }]],
      ['fw-4', [{ channel: 19, value: 255, label: 'dimmer' }, { channel: 20, value: 255 }, { channel: 21, value: 215 }, { channel: 22, value: 0 }, { channel: 23, value: 200 }]],
      ['bw-1', [{ channel: 25, value: 150 }, { channel: 26, value: 50 }, { channel: 27, value: 200, label: 'blue' }]],
      ['bw-2', [{ channel: 28, value: 150 }, { channel: 29, value: 50 }, { channel: 30, value: 200, label: 'blue' }]],
      ['sw-1', [{ channel: 31, value: 200, label: 'dimmer' }, { channel: 32, value: 255 }, { channel: 33, value: 200 }, { channel: 34, value: 100 }, { channel: 35, value: 180 }]],
      ['sw-2', [{ channel: 37, value: 200, label: 'dimmer' }, { channel: 38, value: 255 }, { channel: 39, value: 200 }, { channel: 40, value: 100 }, { channel: 41, value: 180 }]],
      ['spot-1', [{ channel: 43, value: 128, label: 'pan-center' }, { channel: 44, value: 128, label: 'tilt-center' }, { channel: 45, value: 255, label: 'dimmer' }, { channel: 46, value: 255 }, { channel: 47, value: 215 }, { channel: 48, value: 0 }]],
      ['spot-2', [{ channel: 55, value: 128, label: 'pan-center' }, { channel: 56, value: 128, label: 'tilt-center' }, { channel: 57, value: 255, label: 'dimmer' }, { channel: 58, value: 255 }, { channel: 59, value: 215 }, { channel: 60, value: 0 }]],
      ['house-1', [{ channel: 67, value: 30 }]],
      ['house-2', [{ channel: 68, value: 30 }]],
      ['house-3', [{ channel: 69, value: 30 }]],
      ['house-4', [{ channel: 70, value: 30 }]],
    ]),
    transition: { durationMs: 800, easing: 'ease-out' },
    trigger: { type: 'section', sectionName: 'chorus' },
    priority: 7,
  },

  // ─── BRIDGE ─────────────────────────────────────────────────────────────────
  {
    id: 'scene-bridge',
    name: 'Bridge — Intense',
    description: 'Deep colors, high contrast, emotional peak',
    fixtureValues: new Map([
      ['fw-1', [{ channel: 1, value: 220, label: 'dimmer' }, { channel: 2, value: 128, label: 'red' }, { channel: 3, value: 0 }, { channel: 4, value: 128, label: 'blue' }, { channel: 5, value: 50 }]],
      ['fw-2', [{ channel: 7, value: 220, label: 'dimmer' }, { channel: 8, value: 128 }, { channel: 9, value: 0 }, { channel: 10, value: 128 }, { channel: 11, value: 50 }]],
      ['fw-3', [{ channel: 13, value: 220, label: 'dimmer' }, { channel: 14, value: 128 }, { channel: 15, value: 0 }, { channel: 16, value: 128 }, { channel: 17, value: 50 }]],
      ['fw-4', [{ channel: 19, value: 220, label: 'dimmer' }, { channel: 20, value: 128 }, { channel: 21, value: 0 }, { channel: 22, value: 128 }, { channel: 23, value: 50 }]],
      ['bw-1', [{ channel: 25, value: 200, label: 'red' }, { channel: 26, value: 0 }, { channel: 27, value: 100, label: 'blue' }]],
      ['bw-2', [{ channel: 28, value: 200, label: 'red' }, { channel: 29, value: 0 }, { channel: 30, value: 100, label: 'blue' }]],
      ['sw-1', [{ channel: 31, value: 180 }, { channel: 32, value: 100 }, { channel: 33, value: 0 }, { channel: 34, value: 150 }, { channel: 35, value: 40 }]],
      ['sw-2', [{ channel: 37, value: 180 }, { channel: 38, value: 100 }, { channel: 39, value: 0 }, { channel: 40, value: 150 }, { channel: 41, value: 40 }]],
      ['spot-1', [{ channel: 43, value: 100, label: 'pan-left' }, { channel: 44, value: 100, label: 'tilt-down' }, { channel: 45, value: 255 }, { channel: 46, value: 220 }, { channel: 47, value: 20 }, { channel: 48, value: 60 }]],
      ['spot-2', [{ channel: 55, value: 156, label: 'pan-right' }, { channel: 56, value: 100, label: 'tilt-down' }, { channel: 57, value: 255 }, { channel: 58, value: 220 }, { channel: 59, value: 20 }, { channel: 60, value: 60 }]],
      ['house-1', [{ channel: 67, value: 25 }]],
      ['house-2', [{ channel: 68, value: 25 }]],
      ['house-3', [{ channel: 69, value: 25 }]],
      ['house-4', [{ channel: 70, value: 25 }]],
    ]),
    transition: { durationMs: 1000, easing: 'ease-in-out' },
    trigger: { type: 'section', sectionName: 'bridge' },
    priority: 8,
  },

  // ─── TAG / OUTRO ────────────────────────────────────────────────────────────
  {
    id: 'scene-tag',
    name: 'Tag/Outro — Fading',
    description: 'Gentle fade to atmospheric, sustained note energy',
    fixtureValues: new Map([
      ['fw-1', [{ channel: 1, value: 80, label: 'dimmer' }, { channel: 2, value: 0 }, { channel: 3, value: 100 }, { channel: 4, value: 80 }, { channel: 5, value: 60 }]],
      ['fw-2', [{ channel: 7, value: 80, label: 'dimmer' }, { channel: 8, value: 0 }, { channel: 9, value: 100 }, { channel: 10, value: 80 }, { channel: 11, value: 60 }]],
      ['fw-3', [{ channel: 13, value: 80, label: 'dimmer' }, { channel: 14, value: 0 }, { channel: 15, value: 100 }, { channel: 16, value: 80 }, { channel: 17, value: 60 }]],
      ['fw-4', [{ channel: 19, value: 80, label: 'dimmer' }, { channel: 20, value: 0 }, { channel: 21, value: 100 }, { channel: 22, value: 80 }, { channel: 23, value: 60 }]],
      ['bw-1', [{ channel: 25, value: 0 }, { channel: 26, value: 40 }, { channel: 27, value: 60 }]],
      ['bw-2', [{ channel: 28, value: 0 }, { channel: 29, value: 40 }, { channel: 30, value: 60 }]],
      ['sw-1', [{ channel: 31, value: 40 }, { channel: 32, value: 0 }, { channel: 33, value: 80 }, { channel: 34, value: 60 }, { channel: 35, value: 40 }]],
      ['sw-2', [{ channel: 37, value: 40 }, { channel: 38, value: 0 }, { channel: 39, value: 80 }, { channel: 40, value: 60 }, { channel: 41, value: 40 }]],
      ['house-1', [{ channel: 67, value: 20 }]],
      ['house-2', [{ channel: 68, value: 20 }]],
      ['house-3', [{ channel: 69, value: 20 }]],
      ['house-4', [{ channel: 70, value: 20 }]],
    ]),
    transition: { durationMs: 4000, easing: 'ease-out' },
    trigger: { type: 'section', sectionName: 'tag' },
    priority: 5,
  },

  // ─── PRAYER ─────────────────────────────────────────────────────────────────
  {
    id: 'scene-prayer',
    name: 'Prayer — Contemplative',
    description: 'Warm amber, low intensity, house lights up for reading',
    fixtureValues: new Map([
      ['fw-1', [{ channel: 1, value: 40, label: 'dimmer' }, { channel: 2, value: 255 }, { channel: 3, value: 160 }, { channel: 4, value: 40 }, { channel: 5, value: 120 }]],
      ['fw-2', [{ channel: 7, value: 40, label: 'dimmer' }, { channel: 8, value: 255 }, { channel: 9, value: 160 }, { channel: 10, value: 40 }, { channel: 11, value: 120 }]],
      ['fw-3', [{ channel: 13, value: 40, label: 'dimmer' }, { channel: 14, value: 255 }, { channel: 15, value: 160 }, { channel: 16, value: 40 }, { channel: 17, value: 120 }]],
      ['fw-4', [{ channel: 19, value: 40, label: 'dimmer' }, { channel: 20, value: 255 }, { channel: 21, value: 160 }, { channel: 22, value: 40 }, { channel: 23, value: 120 }]],
      ['bw-1', [{ channel: 25, value: 10 }, { channel: 26, value: 5 }, { channel: 27, value: 20 }]],
      ['bw-2', [{ channel: 28, value: 10 }, { channel: 29, value: 5 }, { channel: 30, value: 20 }]],
      ['sw-1', [{ channel: 31, value: 20 }, { channel: 32, value: 200 }, { channel: 33, value: 120 }, { channel: 34, value: 20 }, { channel: 35, value: 80 }]],
      ['sw-2', [{ channel: 37, value: 20 }, { channel: 38, value: 200 }, { channel: 39, value: 120 }, { channel: 40, value: 20 }, { channel: 41, value: 80 }]],
      ['house-1', [{ channel: 67, value: 80, label: 'prayer-reading' }]],
      ['house-2', [{ channel: 68, value: 80, label: 'prayer-reading' }]],
      ['house-3', [{ channel: 69, value: 80, label: 'prayer-reading' }]],
      ['house-4', [{ channel: 70, value: 80, label: 'prayer-reading' }]],
    ]),
    transition: { durationMs: 3000, easing: 'ease-in-out' },
    trigger: { type: 'prayer-start' },
    priority: 9,
  },

  // ─── SERMON ─────────────────────────────────────────────────────────────────
  {
    id: 'scene-sermon',
    name: 'Sermon — Focus',
    description: 'Spot on pulpit, warm wash, house lights medium',
    fixtureValues: new Map([
      ['fw-1', [{ channel: 1, value: 80 }, { channel: 2, value: 255 }, { channel: 3, value: 200 }, { channel: 4, value: 50 }, { channel: 5, value: 150 }]],
      ['fw-2', [{ channel: 7, value: 80 }, { channel: 8, value: 255 }, { channel: 9, value: 200 }, { channel: 10, value: 50 }, { channel: 11, value: 150 }]],
      ['fw-3', [{ channel: 13, value: 80 }, { channel: 14, value: 255 }, { channel: 15, value: 200 }, { channel: 16, value: 50 }, { channel: 17, value: 150 }]],
      ['fw-4', [{ channel: 19, value: 80 }, { channel: 20, value: 255 }, { channel: 21, value: 200 }, { channel: 22, value: 50 }, { channel: 23, value: 150 }]],
      ['spot-1', [{ channel: 43, value: 128, label: 'pulpit-center' }, { channel: 44, value: 110, label: 'pulpit-tilt' }, { channel: 45, value: 255, label: 'dimmer' }, { channel: 46, value: 255 }, { channel: 47, value: 220 }, { channel: 48, value: 80 }]],
      ['spot-2', [{ channel: 55, value: 128 }, { channel: 56, value: 110 }, { channel: 57, value: 0 }, { channel: 58, value: 0 }, { channel: 59, value: 0 }, { channel: 60, value: 0 }]],
      ['house-1', [{ channel: 67, value: 100 }]],
      ['house-2', [{ channel: 68, value: 100 }]],
      ['house-3', [{ channel: 69, value: 100 }]],
      ['house-4', [{ channel: 70, value: 100 }]],
    ]),
    transition: { durationMs: 2000, easing: 'ease-in-out' },
    trigger: { type: 'manual' },
    priority: 5,
  },

  // ─── BLACKOUT ───────────────────────────────────────────────────────────────
  {
    id: 'scene-blackout',
    name: 'Blackout — All Off',
    description: 'Complete darkness for transitions or video playback',
    fixtureValues: new Map([
      ['fw-1', [{ channel: 1, value: 0 }]],
      ['fw-2', [{ channel: 7, value: 0 }]],
      ['fw-3', [{ channel: 13, value: 0 }]],
      ['fw-4', [{ channel: 19, value: 0 }]],
      ['bw-1', [{ channel: 25, value: 0 }, { channel: 26, value: 0 }, { channel: 27, value: 0 }]],
      ['bw-2', [{ channel: 28, value: 0 }, { channel: 29, value: 0 }, { channel: 30, value: 0 }]],
      ['sw-1', [{ channel: 31, value: 0 }]],
      ['sw-2', [{ channel: 37, value: 0 }]],
      ['spot-1', [{ channel: 45, value: 0 }]],
      ['spot-2', [{ channel: 57, value: 0 }]],
      ['house-1', [{ channel: 67, value: 0 }]],
      ['house-2', [{ channel: 68, value: 0 }]],
      ['house-3', [{ channel: 69, value: 0 }]],
      ['house-4', [{ channel: 70, value: 0 }]],
      ['fx-1', [{ channel: 71, value: 0 }]],
      ['fx-2', [{ channel: 73, value: 0 }]],
    ]),
    transition: { durationMs: 500, easing: 'snap' },
    trigger: { type: 'manual' },
    priority: 10,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: Default NTCC LED Configuration
 * Explanation:
 *   Complete service configuration pre-loaded with NTCC Graham sanctuary
 *   fixture layout, worship color palette, and scene library.
 *   Defaults to simulation mode for development/testing without hardware.
 * In Other Words:
 *   The "factory settings" for NTCC Graham's lighting system —
 *   ready to run in simulation mode for testing.
 */
export const DEFAULT_NTCC_LED_CONFIG: LEDConfig = {
  dmxInterface: 'simulation',
  fixtures: DEFAULT_NTCC_FIXTURES,
  colorPalette: NTCC_WORSHIP_PALETTE,
  scenes: DEFAULT_NTCC_SCENES,
  defaultFadeMs: 2000,
  beatSyncEnabled: true,
  expressionSyncEnabled: true,
  prayerDimLevel: 80,
  lyricProjectionLevel: 60,
  maxFrameRate: 44,
  emergencyWhiteout: true,
  blackoutOnError: true,
};

// ═══════════════════════════════════════════════════════════════════════════════
// UNITY LED SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: UnityLED Service Class
 * Explanation:
 *   Singleton service managing DMX512 output, scene transitions,
 *   beat-synchronized effects, and conductor-follow lighting.
 *
 *   Core Responsibilities:
 *   1. DMX Universe Management — maintain 512-channel state
 *   2. Scene Engine — crossfade between scenes with easing curves
 *   3. Beat Sync — pulse/flash on UnityBeatTick events
 *   4. Expression Follow — intensity scaling from conductor expression
 *   5. Prayer Detection — auto-dim from MediaPipe grace period
 *   6. Hardware Abstraction — USB DMX, Art-Net, sACN, or simulation
 *
 *   Hardware Interfaces:
 *   - Enttec USB Pro: Serial USB DMX (most common church setup)
 *   - Art-Net: Ethernet-based DMX over IP
 *   - sACN: Streaming ACN (E1.31) protocol
 *   - Simulation: Browser console output for development
 *
 *   NTCC Integration:
 *   - Subscribes to UnityMediaPipe.onBeatTick()
 *   - Subscribes to UnityMediaPipe.onExpression()
 *   - Receives song section changes from SongLibrary
 *   - Outputs to physical DMX via USB or network
 *
 * In Other Words:
 *   This is the "lighting console" that runs automatically. It takes
 *   the conductor's gestures and song position, then sends the right
 *   DMX values to every light in the sanctuary — in real-time, every frame.
 */
export class UnityLED {
  // ─── Singleton Instance ───────────────────────────────────────────────────
  private static instance: UnityLED | null = null;

  /**
   * This Area Of Code Is: Singleton Accessor
   * Explanation:
   *   Ensures only one LED controller exists app-wide, preventing
   *   conflicting DMX commands and resource contention.
   * In Other Words:
   *   Only ONE lighting console allowed — no fighting over the lights.
   */
  public static getInstance(): UnityLED {
    if (!UnityLED.instance) {
      UnityLED.instance = new UnityLED();
    }
    return UnityLED.instance;
  }

  // ─── Internal State ───────────────────────────────────────────────────────
  private config: LEDConfig;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;

  // DMX Universe state
  private currentUniverse: Uint8Array;
  private targetUniverse: Uint8Array;
  private previousUniverse: Uint8Array;

  // Scene engine
  private currentScene: LightingScene | null = null;
  private targetScene: LightingScene | null = null;
  private sceneTransitionStart: number = 0;
  private sceneTransitionEnd: number = 0;
  private activeTransitions: Map<string, { startValues: number[]; targetValues: number[]; startTime: number; endTime: number; easing: string }> = new Map();

  // Beat sync
  private beatFlashIntensity: number = 0;
  private lastBeatTimestamp: number = 0;
  private beatFlashDecay: number = 0.85; // Per-frame decay factor

  // Expression follow
  private currentExpressionIntensity: number = 0;
  private expressionSmoothing: number = 0.2;

  // Prayer state
  private isPrayerActive: boolean = false;

  // Hardware interface
  private dmxPort: any = null; // Serial port reference
  private artNetSocket: any = null; // UDP socket reference
  private simulationMode: boolean = true;

  // Animation frame
  private animationFrameId: number = 0;

  // Callbacks
  private universeCallbacks: ((universe: DMXUniverse) => void)[] = [];
  private sceneChangeCallbacks: ((scene: LightingScene) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];

  // ─── Constructor ──────────────────────────────────────────────────────────
  private constructor(config?: Partial<LEDConfig>) {
    /**
     * This Area Of Code Is: Constructor
     * Explanation:
     *   Private constructor enforces singleton. Initializes three DMX universe
     *   buffers (current, target, previous) for smooth crossfading.
     * In Other Words:
     *   Sets up three "lighting pictures" — where we are, where we're going,
     *   and where we were — so transitions look smooth.
     */
    this.config = { ...DEFAULT_NTCC_LED_CONFIG, ...config };
    this.currentUniverse = new Uint8Array(512);
    this.targetUniverse = new Uint8Array(512);
    this.previousUniverse = new Uint8Array(512);
    this.simulationMode = this.config.dmxInterface === 'simulation';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Service Initialization
   * Explanation:
   *   Initializes the DMX hardware interface (USB, Art-Net, or simulation)
   *   and starts the render loop. Validates fixture channel assignments
   *   for overlaps and out-of-bounds errors.
   *
   *   Steps:
   *   1. Validate fixture channel assignments (no overlaps, within 1–512)
   *   2. Initialize hardware interface based on config
   *   3. Blackout all channels to safe state
   *   4. Start render loop (requestAnimationFrame)
   *
   * In Other Words:
   *   Powers on the lighting console, checks all the lights are wired
   *   correctly, and starts the continuous output loop.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[UnityLED] Already initialized. Call destroy() first.');
      return;
    }

    try {
      // Step 1: Validate fixture assignments
      this.validateFixtureAssignments();

      // Step 2: Initialize hardware interface
      await this.initializeHardware();

      // Step 3: Safe startup — blackout
      this.blackout();

      // Step 4: Start render loop
      this.startRenderLoop();

      this.isInitialized = true;
      console.log('[UnityLED] Initialized with config:', {
        interface: this.config.dmxInterface,
        fixtureCount: this.config.fixtures.length,
        sceneCount: this.config.scenes.length,
        simulation: this.simulationMode,
      });

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[UnityLED] Initialization failed:', err);
      this.errorCallbacks.forEach((cb) => cb(err));
      throw err;
    }
  }

  /**
   * This Area Of Code Is: Hardware Interface Initialization
   * Explanation:
   *   Sets up the physical or virtual DMX output interface.
   *   - USB: Opens serial port to Enttec USB Pro
   *   - Art-Net: Creates UDP socket for broadcast
   *   - Simulation: Enables console logging mode
   * In Other Words:
   *   Connects to the actual lighting hardware (or pretends to for testing).
   */
  private async initializeHardware(): Promise<void> {
    switch (this.config.dmxInterface) {
      case 'enttec-usb-pro':
        await this.initializeEnttecUSB();
        break;
      case 'artnet':
        await this.initializeArtNet();
        break;
      case 'sacn':
        await this.initializeSACN();
        break;
      case 'simulation':
      default:
        this.simulationMode = true;
        console.log('[UnityLED] Running in SIMULATION mode — no physical DMX output.');
        break;
    }
  }

  /**
   * This Area Of Code Is: Enttec USB Pro Initialization
   * Explanation:
   *   Opens serial connection to Enttec USB Pro DMX interface.
   *   Requires Web Serial API (Chrome/Edge) or Node serialport library.
   *   Sends DMX PRO API frame format: [0x7E, label, lenL, lenH, data..., 0xE7]
   * In Other Words:
   *   Plugs into the little USB box that converts computer signals
   *   into DMX lighting commands.
   */
  private async initializeEnttecUSB(): Promise<void> {
    if (typeof window !== 'undefined' && 'serial' in navigator) {
      // Browser Web Serial API
      try {
        const port = await (navigator as any).serial.requestPort({
          filters: [{ usbVendorId: 0x0403 }], // FTDI vendor ID
        });
        await port.open({ baudRate: 115200 });
        this.dmxPort = port;
        this.simulationMode = false;
        console.log('[UnityLED] Enttec USB Pro connected via Web Serial.');
      } catch (err) {
        console.warn('[UnityLED] Web Serial failed, falling back to simulation:', err);
        this.simulationMode = true;
      }
    } else {
      console.warn('[UnityLED] Web Serial API not available. Use simulation or Node.js backend.');
      this.simulationMode = true;
    }
  }

  /**
   * This Area Of Code Is: Art-Net Initialization
   * Explanation:
   *   Initializes Art-Net DMX-over-IP output. Creates UDP socket
   *   broadcasting to 2.255.255.255:6454 (Art-Net default).
   *   Art-Net packet structure: ["Art-Net\0", opcode, version, sequence, physical, universe, length, data...]
   * In Other Words:
   *   Sends lighting commands over the church's network instead of
   *   dedicated DMX cables — great for long distances.
   */
  private async initializeArtNet(): Promise<void> {
    // Art-Net requires Node.js dgram or browser UDP (limited support)
    // For browser/PWA, recommend simulation or WebRTC data channel fallback
    console.warn('[UnityLED] Art-Net requires Node.js backend for UDP. Falling back to simulation.');
    this.simulationMode = true;
  }

  /**
   * This Area Of Code Is: sACN Initialization
   * Explanation:
   *   Initializes Streaming ACN (E1.31) protocol output.
   *   Multicast to 239.255.0.1 with universe-specific port.
   *   More robust than Art-Net for large installations.
   * In Other Words:
   *   A more modern network lighting protocol — like Art-Net's
   *   more reliable cousin.
   */
  private async initializeSACN(): Promise<void> {
    // sACN also requires Node.js UDP
    console.warn('[UnityLED] sACN requires Node.js backend for UDP multicast. Falling back to simulation.');
    this.simulationMode = true;
  }

  /**
   * This Area Of Code Is: Fixture Assignment Validator
   * Explanation:
   *   Checks all fixture channel assignments for:
   *   - Overlapping channel ranges (two fixtures claiming same channels)
   *   - Out-of-bounds channels (> 512)
   *   - Duplicate fixture IDs
   *   Throws descriptive errors for wiring/configuration mistakes.
   * In Other Words:
   *   "Did someone wire two lights to the same DMX channel?"
   *   Catches setup errors before the service starts.
   */
  private validateFixtureAssignments(): void {
    const channelMap = new Map<number, string>();
    const idSet = new Set<string>();

    for (const fixture of this.config.fixtures) {
      // Check duplicate IDs
      if (idSet.has(fixture.id)) {
        throw new Error(`[UnityLED] Duplicate fixture ID: "${fixture.id}"`);
      }
      idSet.add(fixture.id);

      // Check channel bounds
      const endChannel = fixture.startChannel + fixture.channelCount - 1;
      if (endChannel > 512) {
        throw new Error(
          `[UnityLED] Fixture "${fixture.name}" (${fixture.id}) exceeds DMX universe: ` +
          `channels ${fixture.startChannel}-${endChannel} > 512`
        );
      }

      // Check overlaps
      for (let ch = fixture.startChannel; ch <= endChannel; ch++) {
        if (channelMap.has(ch)) {
          const other = channelMap.get(ch)!;
          throw new Error(
            `[UnityLED] DMX channel overlap: ${ch} claimed by both ` +
            `"${fixture.name}" and "${other}"`
          );
        }
        channelMap.set(ch, fixture.name);
      }
    }

    console.log(`[UnityLED] Validated ${this.config.fixtures.length} fixtures, ${channelMap.size} DMX channels.`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE CONTROL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Start Service
   * Explanation:
   *   Begins DMX output and scene processing. Must be called after initialize().
   * In Other Words:
   *   Press "GO" — the lights start responding to commands.
   */
  public start(): void {
    if (!this.isInitialized) {
      throw new Error('[UnityLED] Not initialized. Call initialize() first.');
    }
    this.isRunning = true;
    console.log('[UnityLED] Service started.');
  }

  /**
   * This Area Of Code Is: Stop Service
   * Explanation:
   *   Pauses scene processing and DMX output. Current state is held.
   *   Use resume() to restart without re-initialization.
   * In Other Words:
   *   Pause button — freezes the lights where they are.
   */
  public stop(): void {
    this.isRunning = false;
    console.log('[UnityLED] Service stopped.');
  }

  /**
   * This Area Of Code Is: Resume Service
   * Explanation:
   *   Restarts after stop() without re-initializing hardware.
   * In Other Words:
   *   Unpause — lights resume from where they were.
   */
  public resume(): void {
    if (!this.isInitialized) {
      throw new Error('[UnityLED] Not initialized. Call initialize() first.');
    }
    this.isRunning = true;
    console.log('[UnityLED] Service resumed.');
  }

  /**
   * This Area Of Code Is: Full Destroy / Cleanup
   * Explanation:
   *   Releases ALL resources: serial port, UDP socket, animation frame,
   *   callbacks, and DMX buffers. Blackout before shutdown for safety.
   * In Other Words:
   *   Emergency shutdown — turns all lights off and unplugs everything.
   */
  public async destroy(): Promise<void> {
    this.stop();
    this.blackout();
    await this.sendDMXFrame(); // Final blackout frame

    // Close hardware
    if (this.dmxPort) {
      try {
        await this.dmxPort.close();
      } catch (e) {
        // Ignore close errors
      }
      this.dmxPort = null;
    }

    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }

    // Clear callbacks
    this.universeCallbacks = [];
    this.sceneChangeCallbacks = [];
    this.errorCallbacks = [];

    this.isInitialized = false;
    this.isRunning = false;

    UnityLED.instance = null;
    console.log('[UnityLED] Destroyed and cleaned up.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Scene Activator
   * Explanation:
   *   Triggers a lighting scene transition. Computes per-fixture channel
   *   interpolation targets and initiates the crossfade.
   *
   *   Priority system:
   *   - Higher priority scenes override lower priority active scenes
   *   - Manual scenes (priority 10) always override auto scenes
   *   - Prayer scenes (priority 9) override everything except blackout
   *
   *   NTCC Context:
   *   - Called automatically by song section changes
   *   - Called manually by worship leader for special moments
   *   - Prayer detection auto-triggers prayer scene
   *
   * In Other Words:
   *   "Switch to the chorus lights now" — fades everything smoothly
   *   to the new color/brightness settings.
   */
  public activateScene(sceneId: string, force: boolean = false): void {
    const scene = this.config.scenes.find((s) => s.id === sceneId);
    if (!scene) {
      console.warn(`[UnityLED] Scene not found: "${sceneId}"`);
      return;
    }

    // Priority check — don't override higher priority unless forced
    if (this.currentScene && !force) {
      if (scene.priority < this.currentScene.priority) {
        console.log(`[UnityLED] Scene "${sceneId}" (${scene.priority}) blocked by higher priority "${this.currentScene.id}" (${this.currentScene.priority})`);
        return;
      }
    }

    // Store previous for transition
    this.previousUniverse.set(this.currentUniverse);

    // Set up transition
    this.targetScene = scene;
    this.sceneTransitionStart = performance.now();
    this.sceneTransitionEnd = this.sceneTransitionStart + scene.transition.durationMs;

    // Build per-fixture transition data
    this.activeTransitions.clear();
    for (const [fixtureId, channels] of scene.fixtureValues) {
      const fixture = this.config.fixtures.find((f) => f.id === fixtureId);
      if (!fixture) continue;

      const startValues: number[] = [];
      const targetValues: number[] = [];

      for (const ch of channels) {
        const absoluteChannel = fixture.startChannel + ch.channel - 1;
        startValues.push(this.currentUniverse[absoluteChannel]);
        targetValues.push(ch.value);
      }

      this.activeTransitions.set(fixtureId, {
        startValues,
        targetValues,
        startTime: this.sceneTransitionStart,
        endTime: this.sceneTransitionEnd,
        easing: scene.transition.easing,
      });
    }

    this.currentScene = scene;
    this.sceneChangeCallbacks.forEach((cb) => cb(scene));
    console.log(`[UnityLED] Activating scene: "${scene.name}" (${scene.id}) with ${scene.transition.durationMs}ms ${scene.transition.easing} fade`);
  }

  /**
   * This Area Of Code Is: Scene by Song Section
   * Explanation:
   *   Convenience method to activate the scene matching a song section.
   *   Looks up scenes by trigger.sectionName and activates the highest
   *   priority match.
   * In Other Words:
   *   "We're in the chorus now — make the lights match."
   */
  public activateSection(sectionName: string): void {
    const matchingScenes = this.config.scenes.filter(
      (s) => s.trigger.type === 'section' && s.trigger.sectionName === sectionName
    );

    if (matchingScenes.length === 0) {
      console.warn(`[UnityLED] No scene found for section: "${sectionName}"`);
      return;
    }

    // Activate highest priority match
    const bestScene = matchingScenes.sort((a, b) => b.priority - a.priority)[0];
    this.activateScene(bestScene.id);
  }

  /**
   * This Area Of Code Is: Prayer Scene Activator
   * Explanation:
   *   Special handler for prayer/altar call detection from MediaPipe.
   *   Activates prayer scene with highest priority and sets prayer flag.
   *   House lights go up for reading, stage dims for intimacy.
   * In Other Words:
   *   "Everyone's praying now — dim the stage, light up the house
   *   so people can read their Bibles."
   */
  public activatePrayerScene(): void {
    this.isPrayerActive = true;
    const prayerScene = this.config.scenes.find((s) => s.id === 'scene-prayer');
    if (prayerScene) {
      this.activateScene('scene-prayer', true); // Force override
    } else {
      // Fallback: manual dim
      this.dimToLevel(this.config.prayerDimLevel);
    }
  }

  /**
   * This Area Of Code Is: Prayer End Handler
   * Explanation:
   *   Called when MediaPipe grace period expires (conductor opens eyes).
   *   Resumes normal song-section lighting.
   * In Other Words:
   *   "Prayer's over — go back to the song lights."
   */
  public endPrayerScene(): void {
    this.isPrayerActive = false;
    // Resume current song section lighting
    if (this.currentScene?.trigger.type === 'prayer-start') {
      // Find last non-prayer scene
      const lastScene = this.config.scenes.find(
        (s) => s.id !== 'scene-prayer' && s.priority < 9
      );
      if (lastScene) {
        this.activateScene(lastScene.id);
      }
    }
  }

  /**
   * This Area Of Code Is: Emergency Blackout
   * Explanation:
   *   Immediate all-off command. Highest priority safety function.
   *   Used for emergencies, video playback, or technical issues.
   * In Other Words:
   *   PANIC BUTTON — everything goes dark RIGHT NOW.
   */
  public blackout(): void {
    this.currentUniverse.fill(0);
    this.targetUniverse.fill(0);
    this.activeTransitions.clear();
    this.beatFlashIntensity = 0;
    console.log('[UnityLED] BLACKOUT executed.');
  }

  /**
   * This Area Of Code Is: Emergency Whiteout
   * Explanation:
   *   Immediate full-white command for emergency evacuation lighting.
   *   All fixtures to maximum white output.
   * In Other Words:
   *   EMERGENCY — all lights full bright for safety.
   */
  public whiteout(): void {
    if (!this.config.emergencyWhiteout) {
      console.warn('[UnityLED] Emergency whiteout disabled in config.');
      return;
    }
    for (const fixture of this.config.fixtures) {
      const startCh = fixture.startChannel;
      // Set dimmer to max
      if (fixture.channelMap.dimmer !== undefined) {
        this.currentUniverse[startCh + fixture.channelMap.dimmer - 1] = 255;
      }
      // Set white to max for RGBW fixtures
      if (fixture.channelMap.white !== undefined) {
        this.currentUniverse[startCh + fixture.channelMap.white - 1] = 255;
      }
      // Set RGB to white balance
      if (fixture.channelMap.red !== undefined) {
        this.currentUniverse[startCh + fixture.channelMap.red - 1] = 255;
      }
      if (fixture.channelMap.green !== undefined) {
        this.currentUniverse[startCh + fixture.channelMap.green - 1] = 255;
      }
      if (fixture.channelMap.blue !== undefined) {
        this.currentUniverse[startCh + fixture.channelMap.blue - 1] = 255;
      }
    }
    console.log('[UnityLED] WHITEOUT executed.');
  }

  /**
   * This Area Of Code Is: Global Dimmer
   * Explanation:
   *   Scales all current dimmer channels by a percentage (0.0–1.0).
   *   Used for house light adjustments and master fade.
   * In Other Words:
   *   Turn ALL lights up or down by the same amount.
   */
  public setMasterDimmer(level: number): void {
    const clamped = Math.max(0, Math.min(1, level));
    for (const fixture of this.config.fixtures) {
      if (fixture.channelMap.dimmer !== undefined) {
        const ch = fixture.startChannel + fixture.channelMap.dimmer - 1;
        this.currentUniverse[ch] = Math.round(this.currentUniverse[ch] * clamped);
      }
    }
  }

  /**
   * This Area Of Code Is: Dim-to-Level Helper
   * Explanation:
   *   Fades all dimmer channels to a specific DMX value over default fade time.
   *   Used for prayer transitions and service endings.
   * In Other Words:
   *   "Fade everything to 30% brightness over 2 seconds."
   */
  private dimToLevel(targetValue: number): void {
    for (const fixture of this.config.fixtures) {
      if (fixture.channelMap.dimmer !== undefined) {
        const ch = fixture.startChannel + fixture.channelMap.dimmer - 1;
        this.targetUniverse[ch] = targetValue;
      }
    }
    this.sceneTransitionStart = performance.now();
    this.sceneTransitionEnd = this.sceneTransitionStart + this.config.defaultFadeMs;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BEAT & EXPRESSION SYNC (from UnityMediaPipe)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Beat Tick Handler
   * Explanation:
   *   Receives UnityBeatTick events from UnityMediaPipe.
   *   Triggers beat-synchronized lighting effects:
   *   - Beat 1 (downbeat): Subtle intensity boost on all fixtures
   *   - Beat 2/3/4: Decaying flash intensity
   *   - Measure start: Slightly brighter pulse
   *
   *   The flash decays exponentially each frame via beatFlashDecay.
   *   Expression intensity scales the base flash magnitude.
   *
   * In Other Words:
   *   Every time the conductor hits a beat, the lights get a little
   *   brighter — like a visual metronome pulsing with the music.
   */
  public onBeatTick(tick: { beatNumber: number; measureNumber: number; bpm: number; confidence: number }): void {
    if (!this.config.beatSyncEnabled || !this.isRunning) return;

    this.lastBeatTimestamp = performance.now();

    // Base flash intensity scaled by beat confidence and expression
    const baseFlash = 0.15 * tick.confidence;
    const expressionBoost = this.currentExpressionIntensity * 0.2;
    const measureBoost = tick.beatNumber === 1 ? 0.1 : 0;

    this.beatFlashIntensity = Math.min(1.0, baseFlash + expressionBoost + measureBoost);

    // Trigger beat-specific effects
    if (tick.beatNumber === 1) {
      // Downbeat pulse on front wash
      this.pulseFixtureGroup('front-wash', 0.3);
    }
  }

  /**
   * This Area Of Code Is: Expression Intensity Handler
   * Explanation:
   *   Receives expression intensity updates from UnityMediaPipe.
   *   Smoothes the value and uses it to scale overall lighting brightness.
   *   Crescendo triggers temporary brightness boost.
   *   Diminuendo triggers gentle fade.
   *
   *   Scaling formula:
   *   finalIntensity = baseSceneIntensity * (1 + expressionIntensity * 0.5)
   *
   * In Other Words:
   *   When the conductor opens their mouth wide or raises eyebrows
   *   (showing intensity), the stage lights get brighter to match.
   */
  public onExpressionIntensity(intensity: number, isCrescendo: boolean, isDiminuendo: boolean): void {
    if (!this.config.expressionSyncEnabled || !this.isRunning) return;

    // Smooth the intensity value
    this.currentExpressionIntensity =
      this.expressionSmoothing * intensity +
      (1 - this.expressionSmoothing) * this.currentExpressionIntensity;

    // Crescendo boost
    if (isCrescendo) {
      this.beatFlashIntensity = Math.min(1.0, this.beatFlashIntensity + 0.25);
    }

    // Diminuendo gentle fade
    if (isDiminuendo) {
      this.beatFlashIntensity *= 0.9;
    }
  }

  /**
   * This Area Of Code Is: Prayer State Handler
   * Explanation:
   *   Receives prayer detection from UnityMediaPipe.
   *   Activates prayer scene when eyes closed beyond threshold.
   *   Ends prayer scene when eyes reopen after grace period.
   * In Other Words:
   *   "The conductor has been praying with eyes closed for a while —
   *   dim the stage lights and bring up house lights."
   */
  public onPrayerState(isPraying: boolean): void {
    if (isPraying && !this.isPrayerActive) {
      this.activatePrayerScene();
    } else if (!isPraying && this.isPrayerActive) {
      this.endPrayerScene();
    }
  }

  /**
   * This Area Of Code Is: Fixture Group Pulse
   * Explanation:
   *   Briefly boosts intensity of all fixtures in a group.
   *   Used for beat-synchronized effects (downbeat pulse, etc.).
   * In Other Words:
   *   Make all the front wash lights flash brighter for a moment.
   */
  private pulseFixtureGroup(group: LEDFixture['group'], amount: number): void {
    const fixtures = this.config.fixtures.filter((f) => f.group === group);
    for (const fixture of fixtures) {
      if (fixture.channelMap.dimmer !== undefined) {
        const ch = fixture.startChannel + fixture.channelMap.dimmer - 1;
        const current = this.currentUniverse[ch];
        this.currentUniverse[ch] = Math.min(255, Math.round(current + amount * 255));
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER LOOP
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Render Loop Starter
   * Explanation:
   *   Starts the continuous animation frame loop that:
   *   1. Interpolates scene transitions
   *   2. Applies beat flash decay
   *   3. Applies expression intensity scaling
   *   4. Sends DMX frame to hardware
   *   5. Notifies subscribers of universe updates
   *
   *   Runs at display refresh rate (~60fps), but DMX output is
   *   throttled to maxFrameRate (default 44Hz = DMX standard).
   *
   * In Other Words:
   *   The engine that runs constantly, smoothly changing lights
   *   frame-by-frame and sending commands to the hardware.
   */
  private startRenderLoop(): void {
    let lastDmxOutput = 0;
    const dmxInterval = 1000 / this.config.maxFrameRate;

    const render = (timestamp: number) => {
      if (!this.isRunning) {
        this.animationFrameId = requestAnimationFrame(render);
        return;
      }

      // 1. Process active scene transitions
      this.processTransitions(timestamp);

      // 2. Apply beat flash decay
      if (this.beatFlashIntensity > 0.001) {
        this.beatFlashIntensity *= this.beatFlashDecay;
      } else {
        this.beatFlashIntensity = 0;
      }

      // 3. Build output universe (current + flash + expression)
      const outputUniverse = this.buildOutputUniverse();

      // 4. Send DMX frame (throttled to maxFrameRate)
      if (timestamp - lastDmxOutput >= dmxInterval) {
        this.sendDMXFrame(outputUniverse);
        lastDmxOutput = timestamp;
      }

      // 5. Notify subscribers
      const universeState: DMXUniverse = {
        channels: outputUniverse,
        timestamp,
        sceneId: this.currentScene?.id,
        checksum: this.computeChecksum(outputUniverse),
      };
      this.universeCallbacks.forEach((cb) => cb(universeState));

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  /**
   * This Area Of Code Is: Transition Processor
   * Explanation:
   *   Interpolates all active fixture transitions using the configured
   *   easing function. Computes per-channel values between start and target.
   *
   *   Easing functions:
   *   - linear: constant speed
   *   - ease-in: slow start, fast end
   *   - ease-out: fast start, slow end
   *   - ease-in-out: slow start/end, fast middle
   *   - snap: instant (no interpolation)
   *
   * In Other Words:
   *   The math that makes lights fade smoothly instead of jumping
   *   from one setting to another.
   */
  private processTransitions(timestamp: number): void {
    for (const [fixtureId, transition] of this.activeTransitions) {
      const fixture = this.config.fixtures.find((f) => f.id === fixtureId);
      if (!fixture) continue;

      const elapsed = timestamp - transition.startTime;
      const duration = transition.endTime - transition.startTime;

      // Compute progress [0, 1]
      let progress: number;
      if (duration <= 0 || transition.easing === 'snap') {
        progress = 1;
      } else {
        progress = Math.min(1, Math.max(0, elapsed / duration));
      }

      // Apply easing
      progress = this.applyEasing(progress, transition.easing);

      // Interpolate each channel
      const channels = this.targetScene?.fixtureValues.get(fixtureId);
      if (!channels) continue;

      for (let i = 0; i < channels.length; i++) {
        const ch = channels[i];
        const absoluteChannel = fixture.startChannel + ch.channel - 1;
        const startVal = transition.startValues[i];
        const targetVal = transition.targetValues[i];
        const interpolated = Math.round(startVal + (targetVal - startVal) * progress);
        this.currentUniverse[absoluteChannel] = interpolated;
      }

      // Remove completed transitions
      if (progress >= 1) {
        this.activeTransitions.delete(fixtureId);
      }
    }
  }

  /**
   * This Area Of Code Is: Easing Function Applicator
   * Explanation:
   *   Applies mathematical easing curves to transition progress.
   *   Makes lighting changes feel natural and musical.
   * In Other Words:
   *   The "curve" of a fade — does it start slow, end slow, or go
   *   at constant speed?
   */
  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return 1 - (1 - t) * (1 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'snap':
        return t >= 1 ? 1 : 0;
      default:
        return t;
    }
  }

  /**
   * This Area Of Code Is: Output Universe Builder
   * Explanation:
   *   Combines the current scene base with beat flash and expression
   *   intensity overlays to produce the final DMX output.
   *
   *   Formula per channel:
   *   output = base + (base * beatFlash * flashMask) + (base * expression * exprMask)
   *
   *   Where flashMask and exprMask are fixture-group-specific weights.
   * In Other Words:
   *   Takes the base lighting, adds the beat pulse, adds the expression
   *   boost, and produces the final numbers sent to the lights.
   */
  private buildOutputUniverse(): Uint8Array {
    const output = new Uint8Array(this.currentUniverse);

    // Apply beat flash (only to wash fixtures, not house or spots)
    if (this.beatFlashIntensity > 0) {
      const flashMultiplier = 1 + this.beatFlashIntensity * 0.3;
      for (const fixture of this.config.fixtures) {
        if (fixture.group === 'front-wash' || fixture.group === 'back-wash' || fixture.group === 'side-wash') {
          if (fixture.channelMap.dimmer !== undefined) {
            const ch = fixture.startChannel + fixture.channelMap.dimmer - 1;
            output[ch] = Math.min(255, Math.round(output[ch] * flashMultiplier));
          }
        }
      }
    }

    // Apply expression intensity scaling
    if (this.currentExpressionIntensity > 0) {
      const exprMultiplier = 1 + this.currentExpressionIntensity * 0.4;
      for (const fixture of this.config.fixtures) {
        if (fixture.group !== 'house') { // Don't scale house lights
          if (fixture.channelMap.dimmer !== undefined) {
            const ch = fixture.startChannel + fixture.channelMap.dimmer - 1;
            output[ch] = Math.min(255, Math.round(output[ch] * exprMultiplier));
          }
        }
      }
    }

    return output;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DMX OUTPUT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: DMX Frame Sender
   * Explanation:
   *   Sends the current DMX universe to the hardware interface.
   *   Handles three output modes:
   *   - Enttec USB Pro: DMX PRO API serial frames
   *   - Art-Net/sACN: UDP packets (Node.js backend required)
   *   - Simulation: Console logging for development
   *
   *   DMX PRO API Frame Format:
   *   [0x7E, 0x06, lenL, lenH, data(512 bytes), 0xE7]
   *
   * In Other Words:
   *   The actual "send" button — transmits all 512 channel values
   *   to the lights via USB, network, or console log.
   */
  private async sendDMXFrame(universe?: Uint8Array): Promise<void> {
    const data = universe || this.currentUniverse;

    if (this.simulationMode) {
      // Simulation: log active channels only (reduce console noise)
      const activeChannels: number[] = [];
      for (let i = 0; i < 512; i++) {
        if (data[i] > 0) activeChannels.push(i + 1);
      }
      if (activeChannels.length > 0 && Math.random() < 0.02) { // Log ~2% of frames
        console.log(`[UnityLED-SIM] ${activeChannels.length} active channels. Scene: ${this.currentScene?.id || 'none'}`);
      }
      return;
    }

    // Enttec USB Pro output
    if (this.dmxPort && this.config.dmxInterface === 'enttec-usb-pro') {
      try {
        const frame = this.buildEnttecFrame(data);
        const writer = this.dmxPort.writable.getWriter();
        await writer.write(frame);
        writer.releaseLock();
      } catch (err) {
        console.error('[UnityLED] DMX write failed:', err);
        if (this.config.blackoutOnError) {
          this.blackout();
        }
        this.errorCallbacks.forEach((cb) => cb(err as Error));
      }
    }
  }

  /**
   * This Area Of Code Is: Enttec DMX PRO Frame Builder
   * Explanation:
   *   Constructs a valid DMX PRO API serial frame for Enttec USB Pro.
   *   Format: [0x7E (start), 0x06 (send DMX), lenL, lenH, 512 bytes, 0xE7 (end)]
   * In Other Words:
   *   Packages the 512 channel values into the exact format the
   *   Enttec USB box expects to receive.
   */
  private buildEnttecFrame(universe: Uint8Array): Uint8Array {
    const frame = new Uint8Array(4 + 512 + 1);
    frame[0] = 0x7E; // Start delimiter
    frame[1] = 0x06; // Send DMX packet label
    frame[2] = 0x00; // Length LSB (512 = 0x0200)
    frame[3] = 0x02; // Length MSB
    frame.set(universe, 4);
    frame[516] = 0xE7; // End delimiter
    return frame;
  }

  /**
   * This Area Of Code Is: Universe Checksum Calculator
   * Explanation:
   *   Computes a simple XOR checksum of the DMX universe for integrity
   *   verification in distributed systems.
   * In Other Words:
   *   A quick math check to make sure the lighting data didn't get
   *   corrupted on the way to the lights.
   */
  private computeChecksum(universe: Uint8Array): number {
    let checksum = 0;
    for (let i = 0; i < universe.length; i++) {
      checksum ^= universe[i];
    }
    return checksum;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COLOR UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Color Lookup
   * Explanation:
   *   Retrieves a worship color from the NTCC palette by name.
   *   Returns RGBW values ready for DMX assignment.
   * In Other Words:
   *   "Give me the DMX values for Royal Purple."
   */
  public getColor(colorName: string): WorshipColor | undefined {
    return this.config.colorPalette.find((c) => c.name === colorName);
  }

  /**
   * This Area Of Code Is: Color to DMX Converter
   * Explanation:
   *   Converts a WorshipColor to per-channel DMX values for a specific fixture.
   *   Accounts for fixture profile (RGB, RGBW, RGBA, etc.) and intensity curve.
   * In Other Words:
   *   Takes a color like "Glory Gold" and figures out exactly what numbers
   *   to send to each channel of a specific light to make that color.
   */
  public colorToDMX(color: WorshipColor, fixture: LEDFixture, intensity: number = 1.0): DMXChannel[] {
    const channels: DMXChannel[] = [];
    const startCh = fixture.startChannel;

    // Apply intensity curve
    let adjustedIntensity: number;
    switch (color.intensityCurve) {
      case 'exponential':
        adjustedIntensity = Math.pow(intensity, 2);
        break;
      case 'sine':
        adjustedIntensity = Math.sin(intensity * Math.PI / 2);
        break;
      case 'linear':
      default:
        adjustedIntensity = intensity;
    }

    // Map color channels to fixture channels
    if (fixture.channelMap.red !== undefined) {
      channels.push({
        channel: startCh + fixture.channelMap.red - 1,
        value: Math.round(color.rgbw.r * adjustedIntensity),
        label: 'red',
      });
    }
    if (fixture.channelMap.green !== undefined) {
      channels.push({
        channel: startCh + fixture.channelMap.green - 1,
        value: Math.round(color.rgbw.g * adjustedIntensity),
        label: 'green',
      });
    }
    if (fixture.channelMap.blue !== undefined) {
      channels.push({
        channel: startCh + fixture.channelMap.blue - 1,
        value: Math.round(color.rgbw.b * adjustedIntensity),
        label: 'blue',
      });
    }
    if (fixture.channelMap.white !== undefined) {
      channels.push({
        channel: startCh + fixture.channelMap.white - 1,
        value: Math.round(color.rgbw.w * adjustedIntensity),
        label: 'white',
      });
    }
    if (fixture.channelMap.amber !== undefined && color.amber !== undefined) {
      channels.push({
        channel: startCh + fixture.channelMap.amber - 1,
        value: Math.round(color.amber * adjustedIntensity),
        label: 'amber',
      });
    }
    if (fixture.channelMap.uv !== undefined && color.uv !== undefined) {
      channels.push({
        channel: startCh + fixture.channelMap.uv - 1,
        value: Math.round(color.uv * adjustedIntensity),
        label: 'uv',
      });
    }

    return channels;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALLBACK SUBSCRIPTION API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Universe Update Subscription
   * Explanation:
   *   Registers a callback for every DMX universe update (~44Hz).
   *   Receives the complete 512-channel state with metadata.
   *   Returns unsubscribe function.
   * In Other Words:
   *   "Tell me the state of every light, constantly." Returns a cancel button.
   */
  public onUniverseUpdate(callback: (universe: DMXUniverse) => void): () => void {
    this.universeCallbacks.push(callback);
    return () => {
      this.universeCallbacks = this.universeCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * This Area Of Code Is: Scene Change Subscription
   * Explanation:
   *   Registers a callback for scene activation events.
   *   Fires when a new scene begins its transition.
   * In Other Words:
   *   "Tell me whenever the lighting scene changes."
   */
  public onSceneChange(callback: (scene: LightingScene) => void): () => void {
    this.sceneChangeCallbacks.push(callback);
    return () => {
      this.sceneChangeCallbacks = this.sceneChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * This Area Of Code Is: Error Subscription
   * Explanation:
   *   Registers a callback for hardware/communication errors.
   *   Includes DMX write failures, serial disconnections, etc.
   * In Other Words:
   *   "Tell me if the lighting hardware has a problem."
   */
  public onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE ACCESSORS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Current State Snapshot
   * Explanation:
   *   Returns a complete snapshot of the LED service state for
   *   debugging, UI display, or external integration.
   * In Other Words:
   *   "What's happening right now?" — for the debug panel.
   */
  public getCurrentState(): {
    isRunning: boolean;
    isInitialized: boolean;
    currentScene: LightingScene | null;
    isPrayerActive: boolean;
    beatFlashIntensity: number;
    expressionIntensity: number;
    activeTransitionCount: number;
    simulationMode: boolean;
    config: LEDConfig;
  } {
    return {
      isRunning: this.isRunning,
      isInitialized: this.isInitialized,
      currentScene: this.currentScene,
      isPrayerActive: this.isPrayerActive,
      beatFlashIntensity: this.beatFlashIntensity,
      expressionIntensity: this.currentExpressionIntensity,
      activeTransitionCount: this.activeTransitions.size,
      simulationMode: this.simulationMode,
      config: { ...this.config },
    };
  }

  /**
   * This Area Of Code Is: Configuration Updater
   * Explanation:
   *   Hot-swaps configuration parameters at runtime.
   *   Useful for sanctuary-specific tuning during sound check.
   * In Other Words:
   *   Adjust the dials while the service is running.
   */
  public updateConfig(updates: Partial<LEDConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('[UnityLED] Config updated:', updates);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: Module Exports
 * Explanation:
 *   Public API surface for UnityLED integration.
 *   Consumers import the singleton, types, config presets, and constants.
 * In Other Words:
 *   These are the door handles — what other parts of the app grab
 *   to use the lighting controller.
 */
export { UnityLED as default };
