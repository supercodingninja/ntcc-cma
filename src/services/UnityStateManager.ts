/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  src/services/unity/UnityStateManager.ts                                      ║
 * ║  NTCC Music App — Unity Solution™ | The Super Coding Ninja™                 ║
 * ║  SCN Technologies™ | © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,              ║
 * ║  𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * This Area Of Code Is: Global State Manager for Unity Solution™
 * Explanation:
 *   Single source of truth for ALL runtime state across the Unity pipeline.
 *   Manages song position, section, tempo, prayer mode, conductor detection,
 *   and lighting state. Uses reactive subscriptions so every subsystem
 *   (MediaPipe, LED, lyric scroll, metronome) stays synchronized without
 *   direct coupling.
 *
 *   State Tree:
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  UnityState                                                 │
 *   │  ├── song: Song | null           (current song loaded)      │
 *   │  ├── section: SongSection        (verse/chorus/bridge/etc)  │
 *   │  ├── measure: number             (current measure 1-indexed)│
 *   │  ├── beat: number                (current beat 1–4)         │
 *   │  ├── bpm: number                 (detected/conductor BPM)   │
 *   │  ├── isPlaying: boolean          (song actively progressing)│
 *   │  ├── isPrayerActive: boolean     (MediaPipe prayer detect)  │
 *   │  ├── conductor: {                  (live conductor data)    │
 *   │  │   isDetected: boolean                                   │
 *   │  │   headPose: HeadPose                                    │
 *   │  │   expression: ExpressionIntensity                       │
 *   │  │   lastBlink: BlinkEvent | null                          │
 *   │  │   blinkRate: number           (blinks per minute)       │
 *   │  │   nodRate: number             (nods per minute)         │
 *   │  │   confidence: number          (0.0–1.0 tracking quality)│
 *   │  │}                                                        │
 *   │  ├── lighting: {                 (current lighting state)  │
 *   │  │   currentSceneId: string | null                         │
 *   │  │   transitionProgress: number  (0.0–1.0)                 │
 *   │  │   isBlackout: boolean                                   │
 *   │  │   masterDimmer: number        (0.0–1.0)                 │
 *   │  │}                                                        │
 *   │  └── timing: {                   (precision timing)        │
 *   │      startTime: number           (performance.now() at go) │
 *   │      elapsedMs: number                                     │
 *   │      nextBeatTime: number                                  │
 *   │      beatDurationMs: number                                │
 *   │  }                                                         │
 *   └─────────────────────────────────────────────────────────────┘
 *
 *   NTCC Integration:
 *   - Drives the entire worship service flow from one state object
 *   - Prayer mode auto-pauses song progression, dims lights
 *   - Conductor confidence below threshold triggers fallback to manual mode
 *   - Section changes auto-advance lyric scroll and lighting scenes
 *
 * In Other Words:
 *   This is the "mission control dashboard" — one place that knows
 *   EVERYTHING happening in the worship service right now. Every other
 *   system reads from here instead of talking to each other directly.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTS (from previously built Unity files)
// ═══════════════════════════════════════════════════════════════════════════════

import type {
  HeadPose,
  ExpressionIntensity,
  BlinkEvent,
} from '../UnityMediaPipe';

import type {
  LightingScene,
} from '../UnityLED';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: Song Structure Types
 * Explanation:
 *   Minimal song/section types for state management.
 *   Full Song type lives in SongLibrary.tsx; these are the
 *   Unity-relevant subsets.
 * In Other Words:
 *   The song info that the lighting and conductor systems care about.
 */
export interface SongSection {
  id: string;
  name: 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'tag' | 'outro' | 'interlude';
  label: string;           // Display label: "Verse 1", "Chorus", "Bridge"
  startMeasure: number;    // 1-indexed measure where section begins
  endMeasure: number;      // 1-indexed measure where section ends
  bpm: number;             // Section-specific tempo
  timeSignature: [number, number]; // e.g., [4, 4] or [6, 8]
  key?: string;            // Musical key for chord display
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  sections: SongSection[];
  defaultBpm: number;
  defaultTimeSignature: [number, number];
  durationMs: number;
  ccliNumber?: string;
}

/**
 * This Area Of Code Is: Conductor State
 * Explanation:
 *   Live snapshot of conductor detection from UnityMediaPipe.
 *   Updated every frame (~60fps) when conductor is visible.
 * In Other Words:
 *   Everything we know about the worship leader's face right now.
 */
export interface ConductorState {
  isDetected: boolean;              // Face currently in frame
  isTracking: boolean;              // MediaPipe actively tracking
  headPose: HeadPose | null;        // 3D orientation + nod data
  expression: ExpressionIntensity | null; // Mouth/eyebrow intensity
  lastBlink: BlinkEvent | null;     // Most recent blink event
  blinkRate: number;                // Blinks per minute (rolling)
  nodRate: number;                  // Nods per minute (rolling)
  confidence: number;               // Overall tracking quality 0.0–1.0
  lastSeenAt: number;               // Timestamp of last detection
  detectionDurationMs: number;      // How long face has been tracked
}

/**
 * This Area Of Code Is: Lighting State
 * Explanation:
 *   Current lighting rig state snapshot.
 *   Mirrors relevant data from UnityLED for UI display and logic.
 * In Other Words:
 *   What the lights are doing right now — scene name, brightness, etc.
 */
export interface LightingState {
  currentSceneId: string | null;
  currentSceneName: string | null;
  transitionProgress: number;       // 0.0 = start, 1.0 = complete
  isTransitioning: boolean;
  isBlackout: boolean;
  isWhiteout: boolean;
  masterDimmer: number;             // 0.0–1.0 global scale
  prayerOverride: boolean;          // Prayer scene active
  simulationMode: boolean;          // No physical DMX connected
  activeFixtureCount: number;
  lastUpdateAt: number;
}

/**
 * This Area Of Code Is: Precision Timing State
 * Explanation:
 *   High-resolution timing data for beat-synchronized systems.
 *   Uses performance.now() for sub-millisecond accuracy.
 * In Other Words:
 *   The metronome's brain — exact beat positions and timing.
 */
export interface TimingState {
  isRunning: boolean;
  startTime: number;                // performance.now() when song started
  elapsedMs: number;                // Total elapsed since start
  currentMeasure: number;           // 1-indexed
  currentBeat: number;              // 1–beatsPerMeasure
  beatsPerMeasure: number;
  bpm: number;
  beatDurationMs: number;           // 60000 / BPM
  nextBeatTime: number;             // performance.now() when next beat fires
  lastBeatTime: number;             // performance.now() of last beat
  beatProgress: number;             // 0.0–1.0 within current beat
  measureProgress: number;          // 0.0–1.0 within current measure
}

/**
 * This Area Of Code Is: Unity Global State
 * Explanation:
 *   The complete state tree. This is the single source of truth
 *   that ALL Unity subsystems read from and write to.
 * In Other Words:
 *   The entire mission control dashboard in one object.
 */
export interface UnityGlobalState {
  // Song
  currentSong: Song | null;
  currentSection: SongSection | null;
  currentSectionIndex: number;

  // Playback
  isPlaying: boolean;
  isPaused: boolean;
  isStopped: boolean;

  // Prayer / Service Mode
  isPrayerActive: boolean;
  isSermonMode: boolean;
  serviceMode: 'worship' | 'prayer' | 'sermon' | 'offering' | 'announcements' | 'transition';

  // Conductor
  conductor: ConductorState;

  // Lighting
  lighting: LightingState;

  // Timing
  timing: TimingState;

  // System
  isInitialized: boolean;
  lastError: Error | null;
  lastUpdateAt: number;
}

/**
 * This Area Of Code Is: State Change Event
 * Explanation:
 *   Emitted on every state mutation. Includes the changed path,
 *   previous value, new value, and timestamp for audit/debugging.
 * In Other Words:
 *   A detailed log entry every time something changes —
 *   "the BPM went from 120 to 128 at 14:32:05.123."
 */
export interface StateChangeEvent {
  path: string;                     // Dot-notation path: "timing.bpm"
  previousValue: unknown;
  newValue: unknown;
  timestamp: number;
  source: 'conductor' | 'lighting' | 'timing' | 'user' | 'system' | 'prayer';
}

/**
 * This Area Of Code Is: State Selector Function Type
 * Explanation:
 *   Typed selector for extracting specific state slices.
 *   Enables performant subscriptions that only fire when relevant
 *   data changes (similar to Redux selectors or Zustand slices).
 * In Other Words:
 *   A filter that says "only tell me when the BPM changes, ignore
 *   everything else."
 */
export type StateSelector<T> = (state: UnityGlobalState) => T;

/**
 * This Area Of Code Is: State Subscription Callback
 * Explanation:
 *   Callback signature for state change listeners.
 *   Receives the new state, previous state, and change event details.
 * In Other Words:
 *   The function signature for "tell me when something changes."
 */
export type StateSubscription = (
  newState: UnityGlobalState,
  previousState: UnityGlobalState,
  change: StateChangeEvent
) => void;

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT STATE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: Default Conductor State
 * Explanation:
 *   Initial conductor state before any face detection.
 *   All values at neutral/unknown defaults.
 * In Other Words:
 *   "No conductor detected yet" — the starting point.
 */
export const DEFAULT_CONDUCTOR_STATE: ConductorState = {
  isDetected: false,
  isTracking: false,
  headPose: null,
  expression: null,
  lastBlink: null,
  blinkRate: 0,
  nodRate: 0,
  confidence: 0,
  lastSeenAt: 0,
  detectionDurationMs: 0,
};

/**
 * This Area Of Code Is: Default Lighting State
 * Explanation:
 *   Initial lighting state — blackout, no scene, simulation mode.
 * In Other Words:
 *   "All lights off, nothing loaded" — the starting point.
 */
export const DEFAULT_LIGHTING_STATE: LightingState = {
  currentSceneId: null,
  currentSceneName: null,
  transitionProgress: 0,
  isTransitioning: false,
  isBlackout: true,
  isWhiteout: false,
  masterDimmer: 1.0,
  prayerOverride: false,
  simulationMode: true,
  activeFixtureCount: 0,
  lastUpdateAt: 0,
};

/**
 * This Area Of Code Is: Default Timing State
 * Explanation:
 *   Initial timing state — stopped, 120 BPM default, no elapsed time.
 * In Other Words:
 *   "Metronome stopped at 120 BPM" — the starting point.
 */
export const DEFAULT_TIMING_STATE: TimingState = {
  isRunning: false,
  startTime: 0,
  elapsedMs: 0,
  currentMeasure: 1,
  currentBeat: 1,
  beatsPerMeasure: 4,
  bpm: 120,
  beatDurationMs: 500,
  nextBeatTime: 0,
  lastBeatTime: 0,
  beatProgress: 0,
  measureProgress: 0,
};

/**
 * This Area Of Code Is: Default Global State
 * Explanation:
 *   Complete initial state tree. Used on service startup and reset.
 * In Other Words:
 *   The "factory reset" button — everything back to starting values.
 */
export const DEFAULT_GLOBAL_STATE: UnityGlobalState = {
  currentSong: null,
  currentSection: null,
  currentSectionIndex: -1,

  isPlaying: false,
  isPaused: false,
  isStopped: true,

  isPrayerActive: false,
  isSermonMode: false,
  serviceMode: 'transition',

  conductor: { ...DEFAULT_CONDUCTOR_STATE },
  lighting: { ...DEFAULT_LIGHTING_STATE },
  timing: { ...DEFAULT_TIMING_STATE },

  isInitialized: false,
  lastError: null,
  lastUpdateAt: 0,
};

// ═══════════════════════════════════════════════════════════════════════════════
// UNITY STATE MANAGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: UnityStateManager Class
 * Explanation:
 *   Centralized reactive state container for the entire Unity Solution™.
 *   Implements:
 *   - Immutable state updates (always returns new state object)
 *   - Path-based subscriptions (only fire when specific paths change)
 *   - Change event auditing (who changed what and when)
 *   - Batch updates (multiple changes in one frame = one notification)
 *   - State persistence (save/restore for service continuity)
 *
 *   Subscription Pattern:
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  UnityStateManager                                          │
 *   │  ├── subscribe(callback)         (all changes)              │
 *   │  ├── subscribeSelector(selector, callback) (filtered)       │
 *   │  ├── subscribePath("timing.bpm", callback) (path-specific)  │
 *   │  └── subscribePath("conductor.*", callback) (wildcard)      │
 *   └─────────────────────────────────────────────────────────────┘
 *
 *   NTCC Integration:
 *   - SongLibrary reads/writes: currentSong, currentSection
 *   - UnityMediaPipe writes: conductor state
 *   - UnityLED reads: lighting state, writes: lighting feedback
 *   - UnitySyncEngine reads: timing, writes: beat advancement
 *   - UI components read: everything for display
 *
 * In Other Words:
 *   This is the "central nervous system" of the worship service.
 *   Every subsystem reports its data here, and reads what it needs
 *   from here. Nothing talks directly to anything else.
 */
export class UnityStateManager {
  // ─── Singleton Instance ───────────────────────────────────────────────────
  private static instance: UnityStateManager | null = null;

  /**
   * This Area Of Code Is: Singleton Accessor
   * Explanation:
   *   Ensures only one state manager exists app-wide, guaranteeing
   *   all subsystems see the same data.
   * In Other Words:
   *   Only ONE mission control dashboard allowed.
   */
  public static getInstance(): UnityStateManager {
    if (!UnityStateManager.instance) {
      UnityStateManager.instance = new UnityStateManager();
    }
    return UnityStateManager.instance;
  }

  // ─── Internal State ───────────────────────────────────────────────────────
  private state: UnityGlobalState;
  private previousState: UnityGlobalState;

  // Subscription registries
  private globalSubscriptions: StateSubscription[] = [];
  private pathSubscriptions: Map<string, StateSubscription[]> = new Map();
  private selectorSubscriptions: Map<string, { selector: StateSelector<unknown>; lastValue: unknown; callbacks: StateSubscription[] }> = new Map();

  // Batch update control
  private isBatching: boolean = false;
  private pendingChanges: StateChangeEvent[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly BATCH_DELAY_MS = 16; // ~1 frame at 60fps

  // Blink/nod rate tracking (rolling windows)
  private blinkTimestamps: number[] = [];
  private nodTimestamps: number[] = [];
  private readonly RATE_WINDOW_MS = 60000; // 1 minute rolling window

  // ─── Constructor ──────────────────────────────────────────────────────────
  private constructor() {
    /**
     * This Area Of Code Is: Constructor
     * Explanation:
     *   Private constructor enforces singleton. Deep-copies default state
     *   to prevent external mutation of the template.
     * In Other Words:
     *   Creates a fresh copy of the starting dashboard.
     */
    this.state = this.deepClone(DEFAULT_GLOBAL_STATE);
    this.previousState = this.deepClone(DEFAULT_GLOBAL_STATE);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE STATE ACCESS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: State Reader
   * Explanation:
   *   Returns a deep-cloned copy of the current global state.
   *   Prevents accidental external mutation.
   * In Other Words:
   *   "Show me the dashboard" — gives a snapshot, not the live board.
   */
  public getState(): UnityGlobalState {
    return this.deepClone(this.state);
  }

  /**
   * This Area Of Code Is: State Path Reader
   * Explanation:
   *   Reads a specific value from the state tree using dot notation.
   *   Supports wildcard paths for partial matching.
   *   Examples:
   *   - "timing.bpm" → returns number
   *   - "conductor.isDetected" → returns boolean
   *   - "lighting.*" → returns entire lighting state
   * In Other Words:
   *   "Just tell me the BPM" — no need to fetch the whole dashboard.
   */
  public getStatePath<T>(path: string): T | undefined {
    const parts = path.split('.');
    let current: unknown = this.state;

    for (const part of parts) {
      if (part === '*') {
        return current as T; // Wildcard returns current level
      }
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current as T;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MUTATION API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: State Setter
   * Explanation:
   *   Updates a specific path in the state tree. Creates immutable
   *   copy, records change event, and notifies subscribers.
   *
   *   Path format: dot-notation string (e.g., "timing.bpm", "conductor.confidence")
   *   Value: any serializable value
   *   Source: who initiated the change (for auditing)
   *
   * In Other Words:
   *   "Set the BPM to 128" — updates one dial on the dashboard
   *   and tells everyone who cares about BPM.
   */
  public setState<T>(path: string, value: T, source: StateChangeEvent['source'] = 'system'): void {
    const previousValue = this.getStatePath(path);

    // Only update if value actually changed
    if (this.valuesEqual(previousValue, value)) {
      return;
    }

    // Create new state with path updated
    this.previousState = this.deepClone(this.state);
    this.state = this.setPath(this.state, path, value);
    this.state.lastUpdateAt = performance.now();

    const change: StateChangeEvent = {
      path,
      previousValue,
      newValue: value,
      timestamp: performance.now(),
      source,
    };

    if (this.isBatching) {
      this.pendingChanges.push(change);
    } else {
      this.notifySubscribers(change);
    }
  }

  /**
   * This Area Of Code Is: Batch State Update
   * Explanation:
   *   Queues multiple state changes and notifies subscribers once
   *   after a brief delay. Prevents notification storms during
   *   complex multi-field updates.
   *
   *   Usage:
   *   manager.batch(() => {
   *     manager.setState("timing.bpm", 128);
   *     manager.setState("timing.beatDurationMs", 468.75);
   *     manager.setState("currentSection", newSection);
   *   });
   *
   * In Other Words:
   *   "I'm changing three dials at once — don't notify people
   *   three separate times, just tell them once when I'm done."
   */
  public batch(updateFn: () => void): void {
    this.isBatching = true;
    this.pendingChanges = [];

    try {
      updateFn();
    } finally {
      this.isBatching = false;

      if (this.pendingChanges.length > 0) {
        // Deduplicate by path (keep last change per path)
        const deduped = new Map<string, StateChangeEvent>();
        for (const change of this.pendingChanges) {
          deduped.set(change.path, change);
        }

        // Notify with all changes
        for (const change of deduped.values()) {
          this.notifySubscribers(change);
        }
      }
      this.pendingChanges = [];
    }
  }

  /**
   * This Area Of Code Is: State Reset
   * Explanation:
   *   Resets the entire state tree to defaults. Used between songs
   *   or when stopping the service.
   * In Other Words:
   *   "Clear the dashboard — new song starting."
   */
  public resetState(): void {
    this.previousState = this.deepClone(this.state);
    this.state = this.deepClone(DEFAULT_GLOBAL_STATE);
    this.blinkTimestamps = [];
    this.nodTimestamps = [];

    const change: StateChangeEvent = {
      path: '*',
      previousValue: this.previousState,
      newValue: this.state,
      timestamp: performance.now(),
      source: 'system',
    };
    this.notifySubscribers(change);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVENIENCE SETTERS (Domain-Specific)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Song Loader
   * Explanation:
   *   Loads a new song into state, resets timing, and sets initial section.
   *   Called when worship leader selects a song from the library.
   * In Other Words:
   *   "Load 'Amazing Grace' — reset everything and start at the intro."
   */
  public loadSong(song: Song): void {
    this.batch(() => {
      this.setState('currentSong', song, 'user');
      this.setState('currentSection', song.sections[0] || null, 'user');
      this.setState('currentSectionIndex', 0, 'user');
      this.setState('timing.bpm', song.defaultBpm, 'user');
      this.setState('timing.beatsPerMeasure', song.defaultTimeSignature[0], 'user');
      this.setState('timing.beatDurationMs', 60000 / song.defaultBpm, 'system');
      this.setState('timing.currentMeasure', 1, 'system');
      this.setState('timing.currentBeat', 1, 'system');
      this.setState('isStopped', true, 'user');
      this.setState('isPlaying', false, 'user');
      this.setState('isPaused', false, 'user');
      this.setState('serviceMode', 'worship', 'user');
    });
  }

  /**
   * This Area Of Code Is: Playback Starter
   * Explanation:
   *   Begins song playback from current position. Sets timing start
   *   reference and marks isPlaying = true.
   * In Other Words:
   *   "Press play — start the metronome and advance beats."
   */
  public startPlayback(): void {
    const now = performance.now();
    this.batch(() => {
      this.setState('isPlaying', true, 'user');
      this.setState('isPaused', false, 'user');
      this.setState('isStopped', false, 'user');
      this.setState('timing.isRunning', true, 'system');
      this.setState('timing.startTime', now, 'system');
      this.setState('timing.lastBeatTime', now, 'system');
      this.setState('timing.nextBeatTime', now + this.state.timing.beatDurationMs, 'system');
    });
  }

  /**
   * This Area Of Code Is: Playback Pauser
   * Explanation:
   *   Pauses playback at current position. Preserves timing state
   *   for resume().
   * In Other Words:
   *   "Pause — freeze the metronome where it is."
   */
  public pausePlayback(): void {
    this.batch(() => {
      this.setState('isPlaying', false, 'user');
      this.setState('isPaused', true, 'user');
      this.setState('timing.isRunning', false, 'system');
    });
  }

  /**
   * This Area Of Code Is: Playback Stopper
   * Explanation:
   *   Stops playback and resets to beginning of song.
   *   Does NOT unload the song.
   * In Other Words:
   *   "Stop and go back to the beginning — but keep the song loaded."
   */
  public stopPlayback(): void {
    this.batch(() => {
      this.setState('isPlaying', false, 'user');
      this.setState('isPaused', false, 'user');
      this.setState('isStopped', true, 'user');
      this.setState('timing.isRunning', false, 'system');
      this.setState('timing.elapsedMs', 0, 'system');
      this.setState('timing.currentMeasure', 1, 'system');
      this.setState('timing.currentBeat', 1, 'system');
      this.setState('timing.beatProgress', 0, 'system');
      this.setState('timing.measureProgress', 0, 'system');
    });
  }

  /**
   * This Area Of Code Is: Section Advancer
   * Explanation:
   *   Advances to the next song section (verse → chorus → bridge, etc.).
   *   Updates timing BPM if section has different tempo.
   *   Called by UnitySceneEngine when section boundary detected.
   * In Other Words:
   *   "We just finished the verse — move to the chorus and update the tempo."
   */
  public advanceSection(): void {
    const song = this.state.currentSong;
    if (!song) return;

    const nextIndex = this.state.currentSectionIndex + 1;
    if (nextIndex >= song.sections.length) {
      // End of song
      this.stopPlayback();
      return;
    }

    const nextSection = song.sections[nextIndex];
    this.batch(() => {
      this.setState('currentSection', nextSection, 'system');
      this.setState('currentSectionIndex', nextIndex, 'system');
      this.setState('timing.bpm', nextSection.bpm || song.defaultBpm, 'system');
      this.setState('timing.beatDurationMs', 60000 / (nextSection.bpm || song.defaultBpm), 'system');
      this.setState('timing.beatsPerMeasure', nextSection.timeSignature[0], 'system');
    });
  }

  /**
   * This Area Of Code Is: Beat Advancer
   * Explanation:
   *   Advances timing by one beat. Updates measure/beat counters,
   *   computes next beat time, and checks for section boundaries.
   *   Called by UnitySyncEngine on every detected beat tick.
   * In Other Words:
   *   "Tick — advance the metronome one beat."
   */
  public advanceBeat(): void {
    const timing = this.state.timing;
    let newBeat = timing.currentBeat + 1;
    let newMeasure = timing.currentMeasure;

    if (newBeat > timing.beatsPerMeasure) {
      newBeat = 1;
      newMeasure++;
    }

    const now = performance.now();
    const nextBeatTime = now + timing.beatDurationMs;

    this.batch(() => {
      this.setState('timing.currentBeat', newBeat, 'system');
      this.setState('timing.currentMeasure', newMeasure, 'system');
      this.setState('timing.lastBeatTime', now, 'system');
      this.setState('timing.nextBeatTime', nextBeatTime, 'system');
      this.setState('timing.elapsedMs', now - timing.startTime, 'system');
    });

    // Check for section boundary
    const section = this.state.currentSection;
    if (section && newMeasure > section.endMeasure) {
      this.advanceSection();
    }
  }

  /**
   * This Area Of Code Is: Conductor State Updater
   * Explanation:
   *   Updates conductor detection state from UnityMediaPipe.
   *   Computes rolling blink/nod rates and tracking confidence.
   *   Called every frame (~60fps) with fresh Face Mesh data.
   * In Other Words:
   *   "The camera just saw the conductor — update their face data."
   */
  public updateConductor(
    isDetected: boolean,
    headPose: HeadPose | null,
    expression: ExpressionIntensity | null,
    blinkEvent: BlinkEvent | null,
    isNodding: boolean
  ): void {
    const now = performance.now();

    // Update blink rate
    if (blinkEvent) {
      this.blinkTimestamps.push(now);
      this.pruneOldTimestamps(this.blinkTimestamps);
    }

    // Update nod rate
    if (isNodding) {
      this.nodTimestamps.push(now);
      this.pruneOldTimestamps(this.nodTimestamps);
    }

    const blinkRate = this.blinkTimestamps.length;
    const nodRate = this.nodTimestamps.length;

    // Compute confidence based on detection consistency
    const prevConductor = this.state.conductor;
    let confidence = 0;
    if (isDetected) {
      const detectionDuration = prevConductor.isDetected
        ? prevConductor.detectionDurationMs + (now - prevConductor.lastSeenAt)
        : 0;
      confidence = Math.min(1.0, detectionDuration / 3000); // Max confidence after 3s
    }

    const newConductor: ConductorState = {
      isDetected,
      isTracking: isDetected,
      headPose,
      expression,
      lastBlink: blinkEvent,
      blinkRate,
      nodRate,
      confidence,
      lastSeenAt: isDetected ? now : prevConductor.lastSeenAt,
      detectionDurationMs: isDetected
        ? prevConductor.detectionDurationMs + (now - prevConductor.lastSeenAt)
        : prevConductor.detectionDurationMs,
    };

    this.setState('conductor', newConductor, 'conductor');
  }

  /**
   * This Area Of Code Is: Prayer State Toggler
   * Explanation:
   *   Sets prayer mode from MediaPipe detection or manual override.
   *   Pauses song progression and triggers prayer lighting scene.
   * In Other Words:
   *   "Prayer time — pause the song, dim the stage, light up the house."
   */
  public setPrayerActive(isActive: boolean): void {
    this.batch(() => {
      this.setState('isPrayerActive', isActive, 'prayer');
      this.setState('serviceMode', isActive ? 'prayer' : 'worship', 'prayer');
      this.setState('lighting.prayerOverride', isActive, 'prayer');

      if (isActive) {
        // Pause timing during prayer
        this.setState('timing.isRunning', false, 'prayer');
      } else {
        // Resume if we were playing
        if (this.state.isPlaying) {
          this.setState('timing.isRunning', true, 'prayer');
        }
      }
    });
  }

  /**
   * This Area Of Code Is: Lighting State Updater
   * Explanation:
   *   Updates lighting state feedback from UnityLED.
   *   Called when scenes change, transitions progress, or errors occur.
   * In Other Words:
   *   "The lights just changed to the chorus scene — update the dashboard."
   */
  public updateLighting(updates: Partial<LightingState>): void {
    const current = this.state.lighting;
    const merged: LightingState = { ...current, ...updates, lastUpdateAt: performance.now() };
    this.setState('lighting', merged, 'lighting');
  }

  /**
   * This Area Of Code Is: Service Mode Setter
   * Explanation:
   *   Changes the overall service mode (worship, prayer, sermon, etc.).
   *   Affects default behaviors, lighting presets, and conductor sensitivity.
   * In Other Words:
   *   "Switch from worship to sermon mode — change all the defaults."
   */
  public setServiceMode(mode: UnityGlobalState['serviceMode']): void {
    this.setState('serviceMode', mode, 'user');
    this.setState('isSermonMode', mode === 'sermon', 'user');
  }

  /**
   * This Area Of Code Is: Error Recorder
   * Explanation:
   *   Records service errors for display and logging.
   *   Does NOT throw — errors are non-fatal state for UI display.
   * In Other Words:
   *   "Something went wrong — write it on the dashboard so we can see it."
   */
  public setError(error: Error | null): void {
    this.setState('lastError', error, 'system');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBSCRIPTION API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Global State Subscription
   * Explanation:
   *   Registers a callback for ALL state changes. Use sparingly —
   *   prefer path-specific or selector subscriptions for performance.
   *   Returns unsubscribe function.
   * In Other Words:
   *   "Tell me about EVERY change" — heavy, but comprehensive.
   */
  public subscribe(callback: StateSubscription): () => void {
    this.globalSubscriptions.push(callback);
    return () => {
      this.globalSubscriptions = this.globalSubscriptions.filter((cb) => cb !== callback);
    };
  }

  /**
   * This Area Of Code Is: Path-Based Subscription
   * Explanation:
   *   Registers a callback for changes to a specific state path.
   *   Supports wildcards:
   *   - "timing.bpm" → only BPM changes
   *   - "conductor.*" → any conductor sub-field change
   *   - "lighting.currentSceneId" → scene changes only
   *   Returns unsubscribe function.
   * In Other Words:
   *   "Only tell me when the BPM changes" — efficient and focused.
   */
  public subscribePath(path: string, callback: StateSubscription): () => void {
    if (!this.pathSubscriptions.has(path)) {
      this.pathSubscriptions.set(path, []);
    }
    this.pathSubscriptions.get(path)!.push(callback);
    return () => {
      const subs = this.pathSubscriptions.get(path);
      if (subs) {
        this.pathSubscriptions.set(
          path,
          subs.filter((cb) => cb !== callback)
        );
      }
    };
  }

  /**
   * This Area Of Code Is: Selector-Based Subscription
   * Explanation:
   *   Registers a callback that only fires when the selected value changes.
   *   Uses deep equality comparison. Most performant subscription type.
   *
   *   Example:
   *   manager.subscribeSelector(
   *     (state) => state.timing.bpm,
   *     (newState, prevState, change) => console.log(`BPM: ${change.newValue}`)
   *   );
   *
   * In Other Words:
   *   "Only tell me when THIS specific computed value changes" —
   *   the most efficient way to watch state.
   */
  public subscribeSelector<T>(
    selector: StateSelector<T>,
    callback: StateSubscription
  ): () => void {
    const key = this.selectorKey(selector);
    const currentValue = selector(this.state);

    if (!this.selectorSubscriptions.has(key)) {
      this.selectorSubscriptions.set(key, {
        selector: selector as StateSelector<unknown>,
        lastValue: currentValue,
        callbacks: [],
      });
    }

    const entry = this.selectorSubscriptions.get(key)!;
    entry.callbacks.push(callback);

    return () => {
      entry.callbacks = entry.callbacks.filter((cb) => cb !== callback);
      if (entry.callbacks.length === 0) {
        this.selectorSubscriptions.delete(key);
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATION ENGINE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Subscriber Notifier
   * Explanation:
   *   Dispatches change events to all relevant subscribers:
   *   1. Global subscribers (all changes)
   *   2. Path-specific subscribers (exact path match)
   *   3. Path wildcard subscribers (parent path match)
   *   4. Selector subscribers (selected value changed)
   *
   *   Called automatically after every state mutation.
   * In Other Words:
   *   The intercom system — "BPM changed, calling all BPM listeners."
   */
  private notifySubscribers(change: StateChangeEvent): void {
    const newState = this.state;
    const prevState = this.previousState;

    // 1. Global subscribers
    for (const callback of this.globalSubscriptions) {
      try {
        callback(newState, prevState, change);
      } catch (err) {
        console.error('[UnityStateManager] Global subscriber error:', err);
      }
    }

    // 2. Path-specific subscribers
    const pathSubs = this.pathSubscriptions.get(change.path);
    if (pathSubs) {
      for (const callback of pathSubs) {
        try {
          callback(newState, prevState, change);
        } catch (err) {
          console.error(`[UnityStateManager] Path subscriber error for "${change.path}":`, err);
        }
      }
    }

    // 3. Wildcard subscribers (check parent paths)
    const pathParts = change.path.split('.');
    for (let i = 1; i < pathParts.length; i++) {
      const parentPath = pathParts.slice(0, i).join('.') + '.*';
      const parentSubs = this.pathSubscriptions.get(parentPath);
      if (parentSubs) {
        for (const callback of parentSubs) {
          try {
            callback(newState, prevState, change);
          } catch (err) {
            console.error(`[UnityStateManager] Wildcard subscriber error for "${parentPath}":`, err);
          }
        }
      }
    }

    // 4. Selector subscribers
    for (const [key, entry] of this.selectorSubscriptions) {
      const newValue = entry.selector(newState);
      if (!this.valuesEqual(entry.lastValue, newValue)) {
        entry.lastValue = newValue;
        for (const callback of entry.callbacks) {
          try {
            callback(newState, prevState, change);
          } catch (err) {
            console.error(`[UnityStateManager] Selector subscriber error for "${key}":`, err);
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Deep Clone Utility
   * Explanation:
   *   Creates a deep copy of an object using structured clone algorithm.
   *   Handles nested objects, arrays, and primitive values.
   *   Used to prevent external mutation of internal state.
   * In Other Words:
   *   Makes a perfect copy of something so the original stays safe.
   */
  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Uint8Array) return new Uint8Array(obj) as unknown as T;
    if (Array.isArray(obj)) return obj.map((item) => this.deepClone(item)) as unknown as T;
    if (obj instanceof Map) {
      const cloned = new Map();
      for (const [key, value] of obj) {
        cloned.set(key, this.deepClone(value));
      }
      return cloned as unknown as T;
    }
    const cloned: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone((obj as Record<string, unknown>)[key]);
      }
    }
    return cloned as T;
  }

  /**
   * This Area Of Code Is: Deep Path Setter
   * Explanation:
   *   Sets a value at a dot-notation path in an object, creating
   *   intermediate objects as needed. Returns a new object (immutable).
   * In Other Words:
   *   "Set timing.bpm to 128" — navigates the nested object and
   *   creates a new version with the updated value.
   */
  private setPath<T>(obj: T, path: string, value: unknown): T {
    const parts = path.split('.');
    const result = this.deepClone(obj) as Record<string, unknown>;
    let current: Record<string, unknown> = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
    return result as T;
  }

  /**
   * This Area Of Code Is: Deep Equality Checker
   * Explanation:
   *   Compares two values for deep equality.
   *   Handles primitives, objects, arrays, and special cases.
   * In Other Words:
   *   "Are these two things exactly the same?" — checks every level.
   */
  private valuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return a === b;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a)) {
      if ((a as unknown[]).length !== (b as unknown[]).length) return false;
      return (a as unknown[]).every((val, i) => this.valuesEqual(val, (b as unknown[])[i]));
    }

    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) =>
      keysB.includes(key) && this.valuesEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  /**
   * This Area Of Code Is: Timestamp Pruner
   * Explanation:
   *   Removes timestamps older than the rate window (1 minute).
   *   Maintains rolling blink/nod rate calculations.
   * In Other Words:
   *   "Forget blinks from more than a minute ago" — keeps the rate
   *   calculation current.
   */
  private pruneOldTimestamps(timestamps: number[]): void {
    const cutoff = performance.now() - this.RATE_WINDOW_MS;
    while (timestamps.length > 0 && timestamps[0] < cutoff) {
      timestamps.shift();
    }
  }

  /**
   * This Area Of Code Is: Selector Key Generator
   * Explanation:
   *   Generates a unique string key for a selector function.
   *   Uses function toString() as identifier.
   * In Other Words:
   *   Gives each selector a name so we can track which ones changed.
   */
  private selectorKey(selector: StateSelector<unknown>): string {
    return selector.toString();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: State Serializer
   * Explanation:
   *   Serializes the current state to JSON for localStorage/sessionStorage
   *   persistence. Excludes non-serializable fields (Uint8Array, functions).
   *   Used for service recovery after page refresh.
   * In Other Words:
   *   "Save the dashboard to disk" — so if the page refreshes,
   *   we can restore where we were.
   */
  public serialize(): string {
    const serializable = {
      currentSong: this.state.currentSong,
      currentSection: this.state.currentSection,
      currentSectionIndex: this.state.currentSectionIndex,
      isPlaying: this.state.isPlaying,
      isPaused: this.state.isPaused,
      isStopped: this.state.isStopped,
      isPrayerActive: this.state.isPrayerActive,
      isSermonMode: this.state.isSermonMode,
      serviceMode: this.state.serviceMode,
      timing: {
        bpm: this.state.timing.bpm,
        beatsPerMeasure: this.state.timing.beatsPerMeasure,
        currentMeasure: this.state.timing.currentMeasure,
        currentBeat: this.state.timing.currentBeat,
        elapsedMs: this.state.timing.elapsedMs,
      },
      lastUpdateAt: this.state.lastUpdateAt,
    };
    return JSON.stringify(serializable);
  }

  /**
   * This Area Of Code Is: State Deserializer
   * Explanation:
   *   Restores state from a serialized JSON string.
   *   Merges with defaults for missing fields (forward compatibility).
   *   Does NOT restore conductor or lighting state (those are live).
   * In Other Words:
   *   "Load the dashboard from disk" — restores song position and
   *   playback state after a refresh.
   */
  public deserialize(serialized: string): void {
    try {
      const parsed = JSON.parse(serialized);
      this.batch(() => {
        if (parsed.currentSong) this.setState('currentSong', parsed.currentSong, 'system');
        if (parsed.currentSection) this.setState('currentSection', parsed.currentSection, 'system');
        if (parsed.currentSectionIndex !== undefined) this.setState('currentSectionIndex', parsed.currentSectionIndex, 'system');
        if (parsed.isPlaying !== undefined) this.setState('isPlaying', parsed.isPlaying, 'system');
        if (parsed.isPaused !== undefined) this.setState('isPaused', parsed.isPaused, 'system');
        if (parsed.isStopped !== undefined) this.setState('isStopped', parsed.isStopped, 'system');
        if (parsed.isPrayerActive !== undefined) this.setState('isPrayerActive', parsed.isPrayerActive, 'system');
        if (parsed.isSermonMode !== undefined) this.setState('isSermonMode', parsed.isSermonMode, 'system');
        if (parsed.serviceMode) this.setState('serviceMode', parsed.serviceMode, 'system');
        if (parsed.timing) {
          this.setState('timing.bpm', parsed.timing.bpm, 'system');
          this.setState('timing.beatsPerMeasure', parsed.timing.beatsPerMeasure, 'system');
          this.setState('timing.currentMeasure', parsed.timing.currentMeasure, 'system');
          this.setState('timing.currentBeat', parsed.timing.currentBeat, 'system');
          this.setState('timing.elapsedMs', parsed.timing.elapsedMs, 'system');
        }
      });
    } catch (err) {
      console.error('[UnityStateManager] Deserialization failed:', err);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEBUG / DIAGNOSTICS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: State Dumper
   * Explanation:
   *   Returns a formatted JSON string of the current state for debugging.
   *   Useful for console inspection and bug reports.
   * In Other Words:
   *   "Print the whole dashboard" — for troubleshooting.
   */
  public dumpState(): string {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * This Area Of Code Is: Subscription Stats
   * Explanation:
   *   Returns counts of active subscriptions for memory leak detection.
   * In Other Words:
   *   "How many people are listening to the dashboard?"
   */
  public getSubscriptionStats(): {
    global: number;
    pathBased: number;
    selectors: number;
    total: number;
  } {
    let pathBased = 0;
    for (const subs of this.pathSubscriptions.values()) {
      pathBased += subs.length;
    }
    let selectorCount = 0;
    for (const entry of this.selectorSubscriptions.values()) {
      selectorCount += entry.callbacks.length;
    }
    return {
      global: this.globalSubscriptions.length,
      pathBased,
      selectors: selectorCount,
      total: this.globalSubscriptions.length + pathBased + selectorCount,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: Module Exports
 * Explanation:
 *   Public API for UnityStateManager and all related types.
 *   Barrel-exported via src/services/unity/index.ts.
 * In Other Words:
 *   The door handles for the state management system.
 */
export { UnityStateManager as default };
