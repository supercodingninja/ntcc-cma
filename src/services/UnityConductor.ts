/**
 * ============================================
 * This Area Of Code Is: Module Imports & Type Definitions
 * ============================================
 *
 * Explanation:
 * Imports all Unity services (MediaPipe, MIDI, Audio, BeatDetector) and defines
 * TypeScript interfaces for tempo events, section changes, conductor patterns,
 * and the unified configuration. This is the central nervous system that connects
 * blink detection to MIDI output for worship band synchronization.
 *
 * In Other Words:
 * This is the "air traffic control tower" — it receives blink signals from the
 * conductor's eyes, figures out the tempo, and radios the band to speed up or
 * slow down.
 * ============================================
 */

import UnityMediaPipe, {
  BlinkEvent,
  FacePresenceEvent,
  EARDebugData,
  UnityMediaPipeConfig,
  DEFAULT_CONFIG as MEDIAPIPE_DEFAULT,
} from "./UnityMediaPipe";

import { UnityMidi } from "./UnityMidi";
import { BeatDetector } from "../lib/beatDetector";
import { UnityAudio } from "./UnityAudio";

import {
  WORSHIP_DEFAULTS,
  SONG_SECTIONS,
  TEMPO_RANGES,
} from "../config/worship";

import {
  MidiMessage,
  TempoEvent,
  NoteEvent,
  UnityEvent,
} from "../types/midi";

// ─── Conductor Pattern Types ───
export type ConductorPattern = "2-beat" | "3-beat" | "4-beat" | "free";

// ─── Song Section Types ───
export type SongSection =
  | "intro"
  | "verse"
  | "chorus"
  | "bridge"
  | "pre-chorus"
  | "instrumental"
  | "outro"
  | "tag"
  | "spontaneous";

// ─── Tempo Change Event ───
export interface TempoChangeEvent {
  timestamp: number;
  bpm: number;
  previousBpm: number;
  delta: number;
  confidence: number;
  source: "blink" | "audio" | "manual" | "predicted";
  smoothingApplied: boolean;
}

// ─── Section Transition Event ───
export interface SectionTransitionEvent {
  timestamp: number;
  fromSection: SongSection | null;
  toSection: SongSection;
  confidence: number;
  trigger: "tempo-shift" | "pause" | "manual" | "pattern-change";
}

// ─── Pause Event ───
export interface PauseEvent {
  timestamp: number;
  duration: number;
  isIntentional: boolean;
}

// ─── Conductor State ───
export interface ConductorState {
  isActive: boolean;
  currentBpm: number;
  targetBpm: number;
  currentSection: SongSection | null;
  pattern: ConductorPattern;
  isPaused: boolean;
  faceDetected: boolean;
  lastBlinkTime: number;
  blinkIntervalMs: number;
  confidence: number;
  stability: number;
}

// ─── UnityConductor Configuration ───
export interface UnityConductorConfig {
  mediaPipe: Partial<UnityMediaPipeConfig>;
  smoothingFactor: number;
  maxTempoChange: number; // Max BPM change per second
  minBpm: number;
  maxBpm: number;
  defaultBpm: number;
  blinkToBeatRatio: number; // Blinks per beat (usually 1)
  tempoStabilityThreshold: number;
  sectionDetectionEnabled: boolean;
  pauseDetectionEnabled: boolean;
  patternDetectionEnabled: boolean;
  midiOutputEnabled: boolean;
  audioSyncEnabled: boolean;
  debugMode: boolean;
}

// ─── Default Configuration ───
export const DEFAULT_CONDUCTOR_CONFIG: UnityConductorConfig = {
  mediaPipe: MEDIAPIPE_DEFAULT,
  smoothingFactor: 0.7,
  maxTempoChange: 10,
  minBpm: 40,
  maxBpm: 200,
  defaultBpm: WORSHIP_DEFAULTS.defaultTempo,
  blinkToBeatRatio: 1,
  tempoStabilityThreshold: 0.85,
  sectionDetectionEnabled: true,
  pauseDetectionEnabled: true,
  patternDetectionEnabled: true,
  midiOutputEnabled: true,
  audioSyncEnabled: true,
  debugMode: false,
};

/**
 * ============================================
 * This Area Of Code Is: Tempo Smoother
 * ============================================
 *
 * Explanation:
 * Applies exponential moving average (EMA) smoothing to raw tempo values
 * to prevent jittery tempo changes from individual blink detection variance.
 * Also enforces maximum tempo change rate to prevent sudden jumps that
 * would confuse the worship band.
 *
 * In Other Words:
 * This is the "shock absorber" — if the conductor blinks a little faster
 * for one beat, we don't immediately jump to 180 BPM. We ease into it
 * smoothly so the band doesn't whiplash.
 * ============================================
 */

export class TempoSmoother {
  private config: UnityConductorConfig;
  private smoothedBpm: number;
  private lastUpdateTime: number = 0;
  private bpmHistory: number[] = [];
  private readonly historySize: number = 8;

  constructor(config: UnityConductorConfig) {
    this.config = config;
    this.smoothedBpm = config.defaultBpm;
  }

  /**
   * Process a new raw BPM value and return smoothed tempo
   */
  public smooth(rawBpm: number, timestamp: number): number {
    // Clamp to valid range
    const clampedBpm = Math.max(
      this.config.minBpm,
      Math.min(this.config.maxBpm, rawBpm)
    );

    // Calculate time delta
    const timeDelta = timestamp - this.lastUpdateTime;
    this.lastUpdateTime = timestamp;

    // Enforce maximum tempo change rate
    const maxDelta = (this.config.maxTempoChange * timeDelta) / 1000;
    const currentDelta = clampedBpm - this.smoothedBpm;
    const limitedDelta = Math.max(-maxDelta, Math.min(maxDelta, currentDelta));

    // Apply exponential smoothing
    const targetBpm = this.smoothedBpm + limitedDelta;
    this.smoothedBpm =
      this.config.smoothingFactor * this.smoothedBpm +
      (1 - this.config.smoothingFactor) * targetBpm;

    // Maintain history for stability calculation
    this.bpmHistory.push(this.smoothedBpm);
    if (this.bpmHistory.length > this.historySize) {
      this.bpmHistory.shift();
    }

    return Math.round(this.smoothedBpm);
  }

  /**
   * Calculate tempo stability (0-1) based on recent variance
   */
  public getStability(): number {
    if (this.bpmHistory.length < 3) return 0.5;

    const mean =
      this.bpmHistory.reduce((a, b) => a + b, 0) / this.bpmHistory.length;
    const variance =
      this.bpmHistory.reduce((sum, bpm) => sum + Math.pow(bpm - mean, 2), 0) /
      this.bpmHistory.length;

    // Lower variance = higher stability
    const stability = Math.max(0, 1 - variance / 100);
    return Math.min(1, stability);
  }

  /**
   * Get current smoothed BPM
   */
  public getCurrentBpm(): number {
    return Math.round(this.smoothedBpm);
  }

  /**
   * Reset smoother to default tempo
   */
  public reset(): void {
    this.smoothedBpm = this.config.defaultBpm;
    this.bpmHistory = [];
    this.lastUpdateTime = performance.now();
  }

  /**
   * Force set tempo (for manual overrides)
   */
  public setBpm(bpm: number): void {
    this.smoothedBpm = Math.max(
      this.config.minBpm,
      Math.min(this.config.maxBpm, bpm)
    );
    this.bpmHistory = [this.smoothedBpm];
  }
}

/**
 * ============================================
 * This Area Of Code Is: Section Detector
 * ============================================
 *
 * Explanation:
 * Analyzes tempo patterns, blink intervals, and pause durations to detect
 * song section transitions (verse → chorus → bridge). Uses heuristic rules
 * based on worship music conventions: choruses often have higher tempo,
 * bridges have sustained notes, verses are steady, spontaneous sections
 * have irregular patterns.
 *
 * In Other Words:
 * This is the "song structure guesser" — it watches how the conductor
 * moves and figures out "oh, we're in the chorus now" or "this is the
 * bridge with the long hold."
 * ============================================
 */

export class SectionDetector {
  private config: UnityConductorConfig;
  private currentSection: SongSection | null = null;
  private sectionHistory: Array<{ section: SongSection; timestamp: number }> = [];
  private tempoHistory: Array<{ bpm: number; timestamp: number }> = [];
  private pauseHistory: Array<{ duration: number; timestamp: number }> = [];

  constructor(config: UnityConductorConfig) {
    this.config = config;
  }

  /**
   * Process tempo change and detect potential section transition
   */
  public processTempoChange(
    tempoEvent: TempoChangeEvent
  ): SectionTransitionEvent | null {
    this.tempoHistory.push({
      bpm: tempoEvent.bpm,
      timestamp: tempoEvent.timestamp,
    });

    // Keep only last 30 seconds of tempo history
    const cutoff = tempoEvent.timestamp - 30000;
    this.tempoHistory = this.tempoHistory.filter((t) => t.timestamp > cutoff);

    if (!this.config.sectionDetectionEnabled) return null;

    // Detect section based on tempo patterns
    const newSection = this.inferSectionFromTempo(tempoEvent);

    if (newSection && newSection !== this.currentSection) {
      const transition: SectionTransitionEvent = {
        timestamp: tempoEvent.timestamp,
        fromSection: this.currentSection,
        toSection: newSection,
        confidence: this.calculateSectionConfidence(newSection),
        trigger: "tempo-shift",
      };

      this.currentSection = newSection;
      this.sectionHistory.push({
        section: newSection,
        timestamp: tempoEvent.timestamp,
      });

      return transition;
    }

    return null;
  }

  /**
   * Process pause and detect section boundary
   */
  public processPause(pauseEvent: PauseEvent): SectionTransitionEvent | null {
    this.pauseHistory.push({
      duration: pauseEvent.duration,
      timestamp: pauseEvent.timestamp,
    });

    if (!this.config.sectionDetectionEnabled || !pauseEvent.isIntentional)
      return null;

    // Long pauses often indicate section boundaries
    if (pauseEvent.duration > 2000) {
      const nextSection = this.predictNextSection();
      if (nextSection && nextSection !== this.currentSection) {
        const transition: SectionTransitionEvent = {
          timestamp: pauseEvent.timestamp,
          fromSection: this.currentSection,
          toSection: nextSection,
          confidence: 0.7,
          trigger: "pause",
        };
        this.currentSection = nextSection;
        return transition;
      }
    }

    return null;
  }

  /**
   * Infer song section from current tempo characteristics
   */
  private inferSectionFromTempo(
    tempoEvent: TempoChangeEvent
  ): SongSection | null {
    const recentTempos = this.tempoHistory.slice(-10);
    if (recentTempos.length < 3) return null;

    const avgBpm =
      recentTempos.reduce((sum, t) => sum + t.bpm, 0) / recentTempos.length;
    const bpmVariance =
      recentTempos.reduce((sum, t) => sum + Math.pow(t.bpm - avgBpm, 2), 0) /
      recentTempos.length;

    // High variance + high tempo = chorus (energetic)
    if (avgBpm > this.config.defaultBpm + 10 && bpmVariance > 25) {
      return "chorus";
    }

    // Steady tempo = verse
    if (bpmVariance < 10 && avgBpm >= this.config.defaultBpm - 5) {
      return "verse";
    }

    // Sustained high tempo with low variance = bridge buildup
    if (avgBpm > this.config.defaultBpm + 15 && bpmVariance < 15) {
      return "bridge";
    }

    // Very low variance + slightly slower = pre-chorus (building)
    if (bpmVariance < 8 && avgBpm < this.config.defaultBpm) {
      return "pre-chorus";
    }

    // High variance + irregular = spontaneous worship
    if (bpmVariance > 40) {
      return "spontaneous";
    }

    return null;
  }

  /**
   * Predict next section based on common worship song structures
   */
  private predictNextSection(): SongSection | null {
    const structure: SongSection[] = [
      "intro",
      "verse",
      "chorus",
      "verse",
      "chorus",
      "bridge",
      "chorus",
      "outro",
    ];

    const currentIndex = this.currentSection
      ? structure.indexOf(this.currentSection)
      : -1;

    if (currentIndex >= 0 && currentIndex < structure.length - 1) {
      return structure[currentIndex + 1];
    }

    return "chorus"; // Default fallback
  }

  /**
   * Calculate confidence score for section detection
   */
  private calculateSectionConfidence(section: SongSection): number {
    // Base confidence on tempo history consistency
    if (this.tempoHistory.length < 5) return 0.5;

    const recent = this.tempoHistory.slice(-5);
    const variance =
      recent.reduce((sum, t) => {
        const mean =
          recent.reduce((s, x) => s + x.bpm, 0) / recent.length;
        return sum + Math.pow(t.bpm - mean, 2);
      }, 0) / recent.length;

    // Lower variance = higher confidence
    return Math.min(0.95, 0.6 + (1 - Math.min(variance, 100) / 100) * 0.35);
  }

  /**
   * Get current detected section
   */
  public getCurrentSection(): SongSection | null {
    return this.currentSection;
  }

  /**
   * Force set section (manual override)
   */
  public setSection(section: SongSection): void {
    this.currentSection = section;
    this.sectionHistory.push({
      section,
      timestamp: performance.now(),
    });
  }

  /**
   * Get section history for analysis
   */
  public getSectionHistory(): Array<{ section: SongSection; timestamp: number }> {
    return [...this.sectionHistory];
  }

  /**
   * Reset detector state
   */
  public reset(): void {
    this.currentSection = null;
    this.sectionHistory = [];
    this.tempoHistory = [];
    this.pauseHistory = [];
  }
}

/**
 * ============================================
 * This Area Of Code Is: Pause Detector
 * ============================================
 *
 * Explanation:
 * Detects intentional musical pauses by monitoring the time between blinks.
 * Distinguishes between natural blink intervals (conducting) and extended
 * pauses (musical holds, prayer moments, transitions). Uses adaptive
 * thresholding based on recent blink history.
 *
 * In Other Words:
 * This is the "silence detector" — it knows the difference between the
 * conductor blinking normally and the conductor holding still for a
 * dramatic musical pause or prayer moment.
 * ============================================
 */

export class PauseDetector {
  private config: UnityConductorConfig;
  private lastBlinkTime: number = 0;
  private blinkIntervals: number[] = [];
  private isPaused: boolean = false;
  private pauseStartTime: number = 0;
  private readonly intervalHistorySize: number = 10;

  constructor(config: UnityConductorConfig) {
    this.config = config;
  }

  /**
   * Process a new blink and detect pauses
   */
  public processBlink(blinkEvent: BlinkEvent): PauseEvent | null {
    const now = blinkEvent.timestamp;

    if (this.lastBlinkTime > 0) {
      const interval = now - this.lastBlinkTime;
      this.blinkIntervals.push(interval);

      if (this.blinkIntervals.length > this.intervalHistorySize) {
        this.blinkIntervals.shift();
      }

      // Check if we were in a pause and now resumed
      if (this.isPaused) {
        const pauseDuration = now - this.pauseStartTime;
        this.isPaused = false;
        return {
          timestamp: this.pauseStartTime,
          duration: pauseDuration,
          isIntentional: this.isIntentionalPause(pauseDuration),
        };
      }
    }

    this.lastBlinkTime = now;
    return null;
  }

  /**
   * Check for ongoing pause (call periodically when no blink detected)
   */
  public checkForPause(currentTime: number): PauseEvent | null {
    if (!this.config.pauseDetectionEnabled || this.lastBlinkTime === 0)
      return null;

    const timeSinceLastBlink = currentTime - this.lastBlinkTime;
    const avgInterval = this.getAverageInterval();

    // If silence exceeds 2.5x average blink interval, consider it a pause
    if (timeSinceLastBlink > avgInterval * 2.5 && !this.isPaused) {
      this.isPaused = true;
      this.pauseStartTime = this.lastBlinkTime + avgInterval;
    }

    // If extended pause detected, emit event
    if (this.isPaused && timeSinceLastBlink > avgInterval * 4) {
      const pauseDuration = currentTime - this.pauseStartTime;
      return {
        timestamp: this.pauseStartTime,
        duration: pauseDuration,
        isIntentional: this.isIntentionalPause(pauseDuration),
      };
    }

    return null;
  }

  /**
   * Calculate average blink interval from recent history
   */
  private getAverageInterval(): number {
    if (this.blinkIntervals.length === 0) return 500; // Default 120 BPM
    const sum = this.blinkIntervals.reduce((a, b) => a + b, 0);
    return sum / this.blinkIntervals.length;
  }

  /**
   * Determine if pause is intentional musical pause or just lost tracking
   */
  private isIntentionalPause(duration: number): boolean {
    // Pauses between 1-8 seconds are likely intentional
    // Shorter = probably tracking glitch
    // Longer = probably stopped conducting
    return duration >= 1000 && duration <= 8000;
  }

  /**
   * Check if currently in a pause state
   */
  public getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Reset detector state
   */
  public reset(): void {
    this.lastBlinkTime = 0;
    this.blinkIntervals = [];
    this.isPaused = false;
    this.pauseStartTime = 0;
  }
}

/**
 * ============================================
 * This Area Of Code Is: Pattern Detector
 * ============================================
 *
 * Explanation:
 * Recognizes conductor beat patterns (2-beat, 3-beat, 4-beat, free) by
 * analyzing blink timing intervals. Standard conducting patterns have
 * characteristic interval ratios: 4-beat has steady intervals, 3-beat
 * has waltz-like patterns, 2-beat has strong-weak alternation.
 *
 * In Other Words:
 * This is the "pattern reader" — it watches the conductor's blink timing
 * and figures out "this is a 4/4 song" or "this is a 3/4 waltz" just from
 * how they conduct.
 * ============================================
 */

export class PatternDetector {
  private config: UnityConductorConfig;
  private currentPattern: ConductorPattern = "4-beat";
  private intervalRatios: number[] = [];
  private readonly historySize: number = 16;

  constructor(config: UnityConductorConfig) {
    this.config = config;
  }

  /**
   * Process blink interval and detect conducting pattern
   */
  public processInterval(intervalMs: number): ConductorPattern {
    if (!this.config.patternDetectionEnabled) return this.currentPattern;

    // Calculate ratio to average interval
    const avgInterval = this.getAverageInterval();
    if (avgInterval > 0) {
      this.intervalRatios.push(intervalMs / avgInterval);
      if (this.intervalRatios.length > this.historySize) {
        this.intervalRatios.shift();
      }
    }

    // Need enough data to detect pattern
    if (this.intervalRatios.length < 8) return this.currentPattern;

    // Analyze pattern characteristics
    const variance = this.calculateVariance(this.intervalRatios);
    const alternation = this.detectAlternation();

    // High variance + alternation = 2-beat (strong-weak)
    if (variance > 0.15 && alternation > 0.7) {
      this.currentPattern = "2-beat";
      return "2-beat";
    }

    // Moderate variance with triple grouping = 3-beat
    if (variance > 0.08 && this.detectTripleGrouping() > 0.6) {
      this.currentPattern = "3-beat";
      return "3-beat";
    }

    // Low variance = steady 4-beat
    if (variance < 0.05) {
      this.currentPattern = "4-beat";
      return "4-beat";
    }

    // Very high variance = free/spontaneous
    if (variance > 0.25) {
      this.currentPattern = "free";
      return "free";
    }

    return this.currentPattern;
  }

  /**
   * Calculate variance of interval ratios
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Detect strong-weak alternation (characteristic of 2-beat)
   */
  private detectAlternation(): number {
    if (this.intervalRatios.length < 4) return 0;

    let alternations = 0;
    for (let i = 2; i < this.intervalRatios.length; i++) {
      const isLongShort =
        this.intervalRatios[i] > 1.1 && this.intervalRatios[i - 1] < 0.9;
      const isShortLong =
        this.intervalRatios[i] < 0.9 && this.intervalRatios[i - 1] > 1.1;
      if (isLongShort || isShortLong) alternations++;
    }

    return alternations / (this.intervalRatios.length - 2);
  }

  /**
   * Detect triple grouping (characteristic of 3-beat/waltz)
   */
  private detectTripleGrouping(): number {
    if (this.intervalRatios.length < 6) return 0;

    let triples = 0;
    for (let i = 0; i < this.intervalRatios.length - 2; i += 3) {
      const group = this.intervalRatios.slice(i, i + 3);
      const avg = group.reduce((a, b) => a + b, 0) / 3;
      const variance =
        group.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / 3;
      if (variance < 0.1) triples++;
    }

    return triples / Math.floor(this.intervalRatios.length / 3);
  }

  /**
   * Get average interval from history
   */
  private getAverageInterval(): number {
    // This would be fed from PauseDetector's interval history
    // For now, return default based on 120 BPM
    return 500;
  }

  /**
   * Get current detected pattern
   */
  public getCurrentPattern(): ConductorPattern {
    return this.currentPattern;
  }

  /**
   * Reset detector state
   */
  public reset(): void {
    this.currentPattern = "4-beat";
    this.intervalRatios = [];
  }
}

/**
 * ============================================
 * This Area Of Code Is: UnityConductor Main Service
 * ============================================
 *
 * Explanation:
 * The central orchestrator that wires together all Unity subsystems:
 * MediaPipe (blink input), TempoSmoother (tempo processing), SectionDetector
 * (song structure), PauseDetector (musical pauses), PatternDetector (beat
 * patterns), UnityMidi (MIDI output), and UnityAudio (audio sync). Provides
 * a unified API for the React application layer.
 *
 * In Other Words:
 * This is the "conductor's brain." It takes blinks from the eyes, turns them
 * into tempo, figures out what part of the song we're in, detects pauses,
 * reads conducting patterns, and tells the MIDI system what tempo to send
 * to the band's in-ear monitors.
 * ============================================
 */

export type TempoChangeCallback = (event: TempoChangeEvent) => void;
export type SectionTransitionCallback = (event: SectionTransitionEvent) => void;
export type PauseCallback = (event: PauseEvent) => void;
export type PatternChangeCallback = (pattern: ConductorPattern) => void;
export type StateChangeCallback = (state: ConductorState) => void;
export type ConductorErrorCallback = (error: Error) => void;

export class UnityConductor {
  private config: UnityConductorConfig;

  // Subsystems
  private mediaPipe: UnityMediaPipe | null = null;
  private midiOutput: UnityMidi | null = null;
  private audioSync: UnityAudio | null = null;

  // Processing engines
  private tempoSmoother: TempoSmoother;
  private sectionDetector: SectionDetector;
  private pauseDetector: PauseDetector;
  private patternDetector: PatternDetector;

  // State
  private isRunning: boolean = false;
  private isInitialized: boolean = false;
  private currentState: ConductorState;

  // Blink-to-tempo tracking
  private lastBlinkTime: number = 0;
  private blinkIntervals: number[] = [];
  private readonly blinkIntervalHistorySize: number = 8;

  // Callback registries
  private tempoChangeCallbacks: TempoChangeCallback[] = [];
  private sectionTransitionCallbacks: SectionTransitionCallback[] = [];
  private pauseCallbacks: PauseCallback[] = [];
  private patternChangeCallbacks: PatternChangeCallback[] = [];
  private stateChangeCallbacks: StateChangeCallback[] = [];
  private errorCallbacks: ConductorErrorCallback[] = [];

  // Cleanup
  private unsubscribeBlink: (() => void) | null = null;
  private unsubscribeFacePresence: (() => void) | null = null;
  private unsubscribeDebug: (() => void) | null = null;
  private unsubscribeError: (() => void) | null = null;
  private pauseCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<UnityConductorConfig> = {}) {
    this.config = { ...DEFAULT_CONDUCTOR_CONFIG, ...config };

    this.tempoSmoother = new TempoSmoother(this.config);
    this.sectionDetector = new SectionDetector(this.config);
    this.pauseDetector = new PauseDetector(this.config);
    this.patternDetector = new PatternDetector(this.config);

    this.currentState = this.getInitialState();
  }

  /**
   * ============================================
   * This Area Of Code Is: Initialization
   * ============================================
   *
   * Explanation:
   * Initializes all subsystems: MediaPipe for blink detection, MIDI for
   * tempo output, and Audio for sync. Sets up event listeners between
   * components. Must be called before start().
   *
   * In Other Words:
   * "Powering up all the systems" — turns on the camera, connects to
   * MIDI devices, and wires up all the blink-to-beep machinery.
   * ============================================
   */

  public async initialize(
    videoElement: HTMLVideoElement,
    canvasElement?: HTMLCanvasElement,
    midiAccess?: WebMidi.MIDIAccess
  ): Promise<void> {
    try {
      // Initialize MediaPipe
      this.mediaPipe = new UnityMediaPipe(this.config.mediaPipe);
      await this.mediaPipe.initialize(videoElement, canvasElement);

      // Initialize MIDI if enabled
      if (this.config.midiOutputEnabled && midiAccess) {
        this.midiOutput = new UnityMidi();
        await this.midiOutput.initialize(midiAccess);
      }

      // Initialize Audio if enabled
      if (this.config.audioSyncEnabled) {
        this.audioSync = new UnityAudio();
        await this.audioSync.initialize();
      }

      // Subscribe to MediaPipe events
      this.unsubscribeBlink = this.mediaPipe.onBlink(
        this.handleBlink.bind(this)
      );
      this.unsubscribeFacePresence = this.mediaPipe.onFacePresence(
        this.handleFacePresence.bind(this)
      );
      this.unsubscribeDebug = this.mediaPipe.onDebug(
        this.handleDebug.bind(this)
      );
      this.unsubscribeError = this.mediaPipe.onError(
        this.handleError.bind(this)
      );

      // Start pause detection interval
      this.pauseCheckInterval = setInterval(() => {
        this.checkForPauses();
      }, 100);

      this.isInitialized = true;
      this.updateState({ isActive: false, faceDetected: false });
    } catch (error) {
      this.emitError(error as Error);
      throw error;
    }
  }

  /**
   * ============================================
   * This Area Of Code Is: Start/Stop Control
   * ============================================
   *
   * Explanation:
   * Starts or stops the conductor detection pipeline. When started, begins
   * camera capture and tempo processing. When stopped, pauses all processing
   * but maintains state for quick resume.
   *
   * In Other Words:
   * "Hitting play/pause on the conductor remote" — starts or stops
   * watching the conductor and sending tempo to the band.
   * ============================================
   */

  public async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("UnityConductor must be initialized before calling start()");
    }

    if (this.mediaPipe) {
      await this.mediaPipe.start();
    }

    this.isRunning = true;
    this.updateState({ isActive: true });
  }

  public async stop(): Promise<void> {
    this.isRunning = false;

    if (this.mediaPipe) {
      await this.mediaPipe.stop();
    }

    this.updateState({ isActive: false });
  }

  /**
   * ============================================
   * This Area Of Code Is: Blink Event Handler
   * ============================================
   *
   * Explanation:
   * Core processing logic triggered on every detected blink. Calculates
   * blink interval, converts to BPM, applies smoothing, detects patterns
   * and sections, and emits tempo change events to MIDI and subscribers.
   *
   * In Other Words:
   * "The conductor blinked — now what?" This figures out the new tempo
   * from that blink and tells everyone who needs to know.
   * ============================================
   */

  private handleBlink(blinkEvent: BlinkEvent): void {
    if (!this.isRunning) return;

    const now = blinkEvent.timestamp;

    // Calculate blink interval and convert to BPM
    let bpm = this.config.defaultBpm;
    if (this.lastBlinkTime > 0) {
      const intervalMs = now - this.lastBlinkTime;
      this.blinkIntervals.push(intervalMs);

      if (this.blinkIntervals.length > this.blinkIntervalHistorySize) {
        this.blinkIntervals.shift();
      }

      // Convert interval to BPM: BPM = 60000 / intervalMs
      // Adjust for blink-to-beat ratio (usually 1 blink = 1 beat)
      const rawBpm = 60000 / intervalMs / this.config.blinkToBeatRatio;
      bpm = rawBpm;
    }

    this.lastBlinkTime = now;

    // Apply tempo smoothing
    const smoothedBpm = this.tempoSmoother.smooth(bpm, now);

    // Detect conducting pattern
    const intervalMs = this.blinkIntervals[this.blinkIntervals.length - 1] || 0;
    const newPattern = this.patternDetector.processInterval(intervalMs);
    if (newPattern !== this.currentState.pattern) {
      this.emitPatternChange(newPattern);
      this.updateState({ pattern: newPattern });
    }

    // Create tempo change event
    const previousBpm = this.currentState.currentBpm;
    const tempoEvent: TempoChangeEvent = {
      timestamp: now,
      bpm: smoothedBpm,
      previousBpm,
      delta: smoothedBpm - previousBpm,
      confidence: blinkEvent.confidence,
      source: "blink",
      smoothingApplied: true,
    };

    // Update state
    this.updateState({
      currentBpm: smoothedBpm,
      targetBpm: smoothedBpm,
      lastBlinkTime: now,
      blinkIntervalMs: intervalMs,
      confidence: blinkEvent.confidence,
      stability: this.tempoSmoother.getStability(),
    });

    // Emit tempo change
    this.emitTempoChange(tempoEvent);

    // Send MIDI tempo message
    this.sendMidiTempo(smoothedBpm);

    // Check for section transitions
    const sectionTransition = this.sectionDetector.processTempoChange(tempoEvent);
    if (sectionTransition) {
      this.emitSectionTransition(sectionTransition);
      this.updateState({ currentSection: sectionTransition.toSection });
    }

    // Process pause detection
    const pauseEvent = this.pauseDetector.processBlink(blinkEvent);
    if (pauseEvent) {
      this.emitPause(pauseEvent);
      this.updateState({ isPaused: false });
    }
  }

  /**
   * ============================================
   * This Area Of Code Is: Face Presence Handler
   * ============================================
   *
   * Explanation:
   * Handles conductor face appearing or disappearing from camera view.
   * When face is lost, maintains last known tempo (does not stop MIDI).
   * When face returns, resumes tracking seamlessly.
   *
   * In Other Words:
   * "The conductor stepped away" or "the conductor came back" —
   * keeps the tempo going when they're gone, picks up when they return.
   * ============================================
   */

  private handleFacePresence(event: FacePresenceEvent): void {
    this.updateState({ faceDetected: event.present });

    if (!event.present) {
      // Face lost — maintain last tempo but note reduced confidence
      this.updateState({ confidence: this.currentState.confidence * 0.5 });
    } else {
      // Face found — reset confidence
      this.updateState({ confidence: Math.min(1, this.currentState.confidence * 2) });
    }
  }

  /**
   * ============================================
   * This Area Of Code Is: Pause Detection Loop
   * ============================================
   *
   * Explanation:
   * Periodic check (every 100ms) for musical pauses when no blinks are
   * detected. Distinguishes between brief gaps and intentional holds.
   *
   * In Other Words:
   * "Is the conductor taking a dramatic pause, or did we just lose them?"
   * This checks every tenth of a second to find out.
   * ============================================
   */

  private checkForPauses(): void {
    if (!this.isRunning) return;

    const pauseEvent = this.pauseDetector.checkForPause(performance.now());
    if (pauseEvent && pauseEvent.isIntentional) {
      this.emitPause(pauseEvent);
      this.updateState({ isPaused: true });

      // Check for section transition on pause
      const sectionTransition = this.sectionDetector.processPause(pauseEvent);
      if (sectionTransition) {
        this.emitSectionTransition(sectionTransition);
        this.updateState({ currentSection: sectionTransition.toSection });
      }
    }
  }

  /**
   * ============================================
   * This Area Of Code Is: MIDI Output Handler
   * ============================================
   *
   * Explanation:
   * Encodes tempo as MIDI System Real-Time messages and sends to connected
   * MIDI devices. Uses MIDI clock (0xF8) at 24 pulses per quarter note.
   * Also sends tempo change meta-messages for devices that support them.
   *
   * In Other Words:
   * "Translating the tempo into MIDI language" — turns "120 BPM" into
   * the specific digital signals that drum machines and keyboards understand.
   * ============================================
   */

  private sendMidiTempo(bpm: number): void {
    if (!this.config.midiOutputEnabled || !this.midiOutput) return;

    try {
      // Send MIDI clock tempo (System Real-Time)
      // MIDI clock: 24 pulses per quarter note
      // Interval = 60000 / (BPM * 24) milliseconds
      const clockInterval = 60000 / (bpm * 24);

      // Send tempo change meta-message (if supported by device)
      // BPM = 60000000 / microseconds per quarter note
      const mpqn = Math.round(60000000 / bpm);
      const tempoMessage: MidiMessage = {
        type: "meta",
        subtype: "setTempo",
        data: [
          (mpqn >> 16) & 0xff,
          (mpqn >> 8) & 0xff,
          mpqn & 0xff,
        ],
        timestamp: performance.now(),
      };

      this.midiOutput.sendTempo(tempoMessage);
    } catch (error) {
      this.emitError(error as Error);
    }
  }

  /**
   * ============================================
   * This Area Of Code Is: Debug & Error Handlers
   * ============================================
   *
   * Explanation:
   * Forwards debug data and errors from MediaPipe to conductor subscribers.
   * Allows the React UI layer to display EAR values, FPS, and error states.
   *
   * In Other Words:
   * "Passing along the status updates" — if MediaPipe has something to
   * say about performance or problems, this makes sure the UI hears it.
   * ============================================
   */

  private handleDebug(data: EARDebugData): void {
    // Debug data is handled by MediaPipe directly
    // This hook allows future conductor-level debug aggregation
  }

  private handleError(error: Error): void {
    this.emitError(error);
  }

  /**
   * ============================================
   * This Area Of Code Is: Manual Control API
   * ============================================
   *
   * Explanation:
   * Allows manual tempo and section overrides from the React UI. Used when
   * the worship leader wants to set tempo directly, override auto-detection,
   * or skip to a specific song section.
   *
   * In Other Words:
   * "Manual override buttons" — lets the worship leader grab the wheel
   * when the auto-detection isn't behaving.
   * ============================================
   */

  public setTempo(bpm: number): void {
    const clampedBpm = Math.max(
      this.config.minBpm,
      Math.min(this.config.maxBpm, bpm)
    );

    this.tempoSmoother.setBpm(clampedBpm);

    const tempoEvent: TempoChangeEvent = {
      timestamp: performance.now(),
      bpm: clampedBpm,
      previousBpm: this.currentState.currentBpm,
      delta: clampedBpm - this.currentState.currentBpm,
      confidence: 1.0,
      source: "manual",
      smoothingApplied: false,
    };

    this.updateState({
      currentBpm: clampedBpm,
      targetBpm: clampedBpm,
    });

    this.emitTempoChange(tempoEvent);
    this.sendMidiTempo(clampedBpm);
  }

  public setSection(section: SongSection): void {
    this.sectionDetector.setSection(section);
    this.updateState({ currentSection: section });
  }

  public tapTempo(): void {
    const now = performance.now();

    if (this.lastBlinkTime > 0) {
      const interval = now - this.lastBlinkTime;
      const bpm = 60000 / interval;
      this.setTempo(bpm);
    }

    this.lastBlinkTime = now;
  }

  /**
   * ============================================
   * This Area Of Code Is: State Management
   * ============================================
   *
   * Explanation:
   * Maintains and updates the unified ConductorState object. Emits state
   * change events to subscribers whenever any property changes. Provides
   * immutable state snapshots for React components.
   *
   * In Other Words:
   * "The conductor's current status board" — always knows and reports
   * the current tempo, section, pattern, and confidence level.
   * ============================================
   */

  private getInitialState(): ConductorState {
    return {
      isActive: false,
      currentBpm: this.config.defaultBpm,
      targetBpm: this.config.defaultBpm,
      currentSection: null,
      pattern: "4-beat",
      isPaused: false,
      faceDetected: false,
      lastBlinkTime: 0,
      blinkIntervalMs: 0,
      confidence: 0,
      stability: 0,
    };
  }

  private updateState(partial: Partial<ConductorState>): void {
    const previousState = { ...this.currentState };
    this.currentState = { ...this.currentState, ...partial };

    // Only emit if state actually changed
    if (JSON.stringify(previousState) !== JSON.stringify(this.currentState)) {
      this.emitStateChange(this.currentState);
    }
  }

  public getCurrentState(): ConductorState {
    return { ...this.currentState };
  }

  /**
   * ============================================
   * This Area Of Code Is: Event Subscription API
   * ============================================
   *
   * Explanation:
   * Public methods for registering callbacks on all conductor events:
   * tempo changes, section transitions, pauses, pattern changes, state
   * updates, and errors. Returns unsubscribe functions for cleanup.
   *
   * In Other Words:
   * "Sign up for notifications" — lets the rest of the app know when
   * tempo changes, sections switch, or something goes wrong.
   * ============================================
   */

  public onTempoChange(callback: TempoChangeCallback): () => void {
    this.tempoChangeCallbacks.push(callback);
    return () => {
      this.tempoChangeCallbacks = this.tempoChangeCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  public onSectionTransition(
    callback: SectionTransitionCallback
  ): () => void {
    this.sectionTransitionCallbacks.push(callback);
    return () => {
      this.sectionTransitionCallbacks = this.sectionTransitionCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  public onPause(callback: PauseCallback): () => void {
    this.pauseCallbacks.push(callback);
    return () => {
      this.pauseCallbacks = this.pauseCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onPatternChange(callback: PatternChangeCallback): () => void {
    this.patternChangeCallbacks.push(callback);
    return () => {
      this.patternChangeCallbacks = this.patternChangeCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  public onStateChange(callback: StateChangeCallback): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  public onError(callback: ConductorErrorCallback): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
    };
  }

  // Private emitters
  private emitTempoChange(event: TempoChangeEvent): void {
    this.tempoChangeCallbacks.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error("Tempo change callback error:", err);
      }
    });
  }

  private emitSectionTransition(event: SectionTransitionEvent): void {
    this.sectionTransitionCallbacks.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error("Section transition callback error:", err);
      }
    });
  }

  private emitPause(event: PauseEvent): void {
    this.pauseCallbacks.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error("Pause callback error:", err);
      }
    });
  }

  private emitPatternChange(pattern: ConductorPattern): void {
    this.patternChangeCallbacks.forEach((cb) => {
      try {
        cb(pattern);
      } catch (err) {
        console.error("Pattern change callback error:", err);
      }
    });
  }

  private emitStateChange(state: ConductorState): void {
    this.stateChangeCallbacks.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error("State change callback error:", err);
      }
    });
  }

  private emitError(error: Error): void {
    this.errorCallbacks.forEach((cb) => {
      try {
        cb(error);
      } catch (err) {
        console.error("Error callback error:", err);
      }
    });
  }

  /**
   * ============================================
   * This Area Of Code Is: Configuration & Debug
   * ============================================
   *
   * Explanation:
   * Runtime configuration updates and debug mode toggling. Allows the UI
   * to adjust sensitivity, enable/disable features, and tune performance
   * without restarting the conductor.
   *
   * In Other Words:
   * "Settings panel controls" — lets you tweak how the conductor detection
   * works while it's running.
   * ============================================
   */

  public updateConfig(newConfig: Partial<UnityConductorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.tempoSmoother = new TempoSmoother(this.config);
    this.sectionDetector = new SectionDetector(this.config);
    this.pauseDetector = new PauseDetector(this.config);
    this.patternDetector = new PatternDetector(this.config);

    if (this.mediaPipe) {
      this.mediaPipe.updateConfig(newConfig.mediaPipe || {});
    }
  }

  public setDebugMode(enabled: boolean): void {
    this.config.debugMode = enabled;
    if (this.mediaPipe) {
      this.mediaPipe.setDebugMode(enabled);
    }
  }

  public getConfig(): UnityConductorConfig {
    return { ...this.config };
  }

  /**
   * ============================================
   * This Area Of Code Is: Resource Cleanup
   * ============================================
   *
   * Explanation:
   * Complete teardown of all subsystems, event listeners, intervals, and
   * callback registries. Must be called before component unmount to prevent
   * memory leaks and dangling camera/MIDI connections.
   *
   * In Other Words:
   * "Shutdown sequence" — turns off everything, disconnects all wires,
   * and leaves no trace behind.
   * ============================================
   */

  public async dispose(): Promise<void> {
    await this.stop();

    // Clear intervals
    if (this.pauseCheckInterval) {
      clearInterval(this.pauseCheckInterval);
      this.pauseCheckInterval = null;
    }

    // Unsubscribe from MediaPipe events
    if (this.unsubscribeBlink) {
      this.unsubscribeBlink();
      this.unsubscribeBlink = null;
    }
    if (this.unsubscribeFacePresence) {
      this.unsubscribeFacePresence();
      this.unsubscribeFacePresence = null;
    }
    if (this.unsubscribeDebug) {
      this.unsubscribeDebug();
      this.unsubscribeDebug = null;
    }
    if (this.unsubscribeError) {
      this.unsubscribeError();
      this.unsubscribeError = null;
    }

    // Dispose subsystems
    if (this.mediaPipe) {
      await this.mediaPipe.dispose();
      this.mediaPipe = null;
    }

    if (this.midiOutput) {
      await this.midiOutput.dispose();
      this.midiOutput = null;
    }

    if (this.audioSync) {
      await this.audioSync.dispose();
      this.audioSync = null;
    }

    // Reset engines
    this.tempoSmoother.reset();
    this.sectionDetector.reset();
    this.pauseDetector.reset();
    this.patternDetector.reset();

    // Clear callbacks
    this.tempoChangeCallbacks = [];
    this.sectionTransitionCallbacks = [];
    this.pauseCallbacks = [];
    this.patternChangeCallbacks = [];
    this.stateChangeCallbacks = [];
    this.errorCallbacks = [];

    // Reset state
    this.currentState = this.getInitialState();
    this.isInitialized = false;
    this.isRunning = false;
    this.lastBlinkTime = 0;
    this.blinkIntervals = [];
  }
}

/**
 * ============================================
 * This Area Of Code Is: Module Exports
 * ============================================
 *
 * Explanation:
 * Named exports for all public classes, interfaces, constants, and types.
 * Enables tree-shaking and selective imports by consuming modules.
 *
 * In Other Words:
 * "Here's everything we built — take what you need."
 * ============================================
 */

export default UnityConductor;

/**
 * ============================================
 * This Area Of Code Is: Copyright & Attribution
 * ============================================
 *
 * Explanation:
 * Legal attribution and branding footer for the NTCC Music App Unity Solution™.
 * Required on all source files per project standards.
 *
 * In Other Words:
 * "This code belongs to Rev. Frederick Thomas and was built for NTCC Graham."
 * ============================================
 */

// © 2026 NTCC Music App | 𝑅𝑒𝑣. 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝐷𝑤𝑎𝑦𝑛𝑒 𝑇ℎ𝑜𝑚𝑎𝑠, 𝐽𝑟., 𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Gifted with 🫶🏿 to NTCCA
// SCN Technologies™ | SCNܫܘܐ™ (SCNshava™) | #FindAWay
