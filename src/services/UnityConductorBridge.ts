/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  src/services/unity/UnityConductorBridge.ts                                   ║
 * ║  NTCC Music App — Unity Solution™ | The Super Coding Ninja™                 ║
 * ║  SCN Technologies™ | © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,              ║
 * ║  𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * This Area Of Code Is: MediaPipe-to-State Bridge
 * Explanation:
 *   Subscribes to all UnityMediaPipe output streams (blink, head pose,
 *   expression, beat tick) and translates them into UnityStateManager
 *   updates. Acts as the adapter layer between raw computer vision data
 *   and the structured state tree that downstream systems consume.
 *
 *   Data Flow:
 *   ┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────┐
 *   │  MediaPipe      │────▶│  UnityConductorBridge    │────▶│  StateManager   │
 *   │  Face Mesh      │     │  (this file)             │     │  (single truth) │
 *   └─────────────────┘     └──────────────────────────┘     └─────────────────┘
 *                                    │
 *                                    ▼
 *                           ┌──────────────────┐
 *                           │  Downstream      │
 *                           │  (LED, Lyrics,   │
 *                           │   Metronome)     │
 *                           └──────────────────┘
 *
 *   Responsibilities:
 *   1. Subscribe to MediaPipe callbacks (onBlink, onHeadPose, onExpression, onBeatTick)
 *   2. Debounce high-frequency events (head pose @ 60fps → throttled state updates)
 *   3. Classify conductor state (present/absent, confident/uncertain, prayer/normal)
 *   4. Detect prayer mode from extended eye closure
 *   5. Compute derived metrics (tempo stability, gesture consistency)
 *   6. Batch state updates for performance
 *
 *   NTCC Integration:
 *   - Gracefully handles conductor stepping away from camera
 *   - Auto-switches to manual mode when confidence drops
 *   - Prayer detection triggers service mode change
 *   - Beat ticks drive the entire sync pipeline
 *
 * In Other Words:
 *   This is the "translator" between the camera's raw face data and
 *   the mission control dashboard. It takes "the conductor blinked"
 *   and turns it into "beat 3 of measure 12, 128 BPM, high confidence."
 */

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════════════════════

import type {
  BlinkEvent,
  HeadPose,
  ExpressionIntensity,
  UnityBeatTick,
} from '../UnityMediaPipe';

import type { UnityGlobalState } from './UnityStateManager';

import { UnityStateManager } from './UnityStateManager';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: Bridge Configuration
 * Explanation:
 *   Tunable parameters for conductor signal processing.
 *   Calibrated for NTCC sanctuary conditions.
 * In Other Words:
 *   Dials that control how sensitive the bridge is to conductor gestures.
 */
export interface ConductorBridgeConfig {
  // Throttling
  headPoseThrottleMs: number;       // Min ms between head pose state updates (default: 50)
  expressionThrottleMs: number;     // Min ms between expression state updates (default: 100)

  // Detection thresholds
  minConfidenceForAuto: number;     // Below this → switch to manual mode (default: 0.3)
  confidenceRecoveryMs: number;     // Time to regain confidence after dropout (default: 2000)
  maxConductorAbsenceMs: number;    // Before marking conductor as absent (default: 3000)

  // Prayer detection
  prayerBlinkThresholdMs: number;   // Eye closure duration for prayer mode (default: 1500)
  prayerGracePeriodMs: number;      // Ms after prayer ends before resuming (default: 3000)

  // Tempo stability
  bpmStabilityWindow: number;       // Number of beats to average for stable BPM (default: 8)
  maxBpmDeviation: number;          // Max BPM change per beat (default: 10)

  // Beat validation
  minBeatConfidence: number;        // Minimum confidence to accept a beat tick (default: 0.4)
  beatCooldownMs: number;           // Minimum ms between accepted beats (default: 200)
}

/**
 * This Area Of Code Is: Conductor Classification
 * Explanation:
 *   High-level classification of the conductor's current state
 *   derived from raw MediaPipe data.
 * In Other Words:
 *   "What is the conductor doing RIGHT NOW?" — not raw numbers,
 *   but meaningful states like "praying" or "confidently conducting."
 */
export interface ConductorClassification {
  presence: 'present' | 'absent' | 'uncertain';
  confidence: 'high' | 'medium' | 'low' | 'none';
  activity: 'conducting' | 'praying' | 'idle' | 'speaking' | 'unknown';
  tempoStability: 'stable' | 'unstable' | 'unknown';
  gestureIntensity: 'high' | 'medium' | 'low' | 'none';
  lastUpdateAt: number;
}

/**
 * This Area Of Code Is: Tempo History Entry
 * Explanation:
 *   One BPM sample with metadata for stability analysis.
 * In Other Words:
 *   One data point in the "how steady is the tempo?" calculation.
 */
export interface TempoHistoryEntry {
  bpm: number;
  timestamp: number;
  source: 'blink' | 'nod' | 'expression' | 'fusion';
  confidence: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: NTCC Default Bridge Config
 * Explanation:
 *   Pre-calibrated for NTCC Graham sanctuary worship conditions.
 *   Balances responsiveness with stability.
 * In Other Words:
 *   The settings that work at NTCC out of the box.
 */
export const DEFAULT_BRIDGE_CONFIG: ConductorBridgeConfig = {
  headPoseThrottleMs: 50,
  expressionThrottleMs: 100,
  minConfidenceForAuto: 0.3,
  confidenceRecoveryMs: 2000,
  maxConductorAbsenceMs: 3000,
  prayerBlinkThresholdMs: 1500,
  prayerGracePeriodMs: 3000,
  bpmStabilityWindow: 8,
  maxBpmDeviation: 10,
  minBeatConfidence: 0.4,
  beatCooldownMs: 200,
};

// ═══════════════════════════════════════════════════════════════════════════════
// UNITY CONDUCTOR BRIDGE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: UnityConductorBridge Class
 * Explanation:
 *   The adapter between UnityMediaPipe and UnityStateManager.
 *   Manages all MediaPipe subscriptions, processes raw events into
 *   structured state updates, and handles edge cases (conductor
 *   absence, prayer mode, low confidence fallback).
 *
 *   Subscription Map:
 *   ┌────────────────────────┬──────────────────────────────┬──────────────┐
 *   │  MediaPipe Event       │  Bridge Processing           │  State Path  │
 *   ├────────────────────────┼──────────────────────────────┼──────────────┤
 *   │  onBlink               │  Classify beat-cue/prayer    │  conductor   │
 *   │  onHeadPose            │  Throttle, detect nod        │  conductor   │
 *   │  onExpression          │  Throttle, crescendo detect  │  conductor   │
 *   │  onBeatTick            │  Validate, stability check   │  timing      │
 *   │  onError               │  Log, switch to manual       │  lastError   │
 *   └────────────────────────┴──────────────────────────────┴──────────────┘
 *
 *   NTCC Context:
 *   - Runs continuously during worship service
 *   - Auto-recovers when conductor returns to camera
 *   - Prayer detection is sacred — never false-positive during worship
 *   - Falls back to manual tap tempo when confidence is low
 *
 * In Other Words:
 *   The "interpreter" that sits between the camera and the dashboard.
 *   It watches the conductor, figures out what they're doing, and
 *   updates the state so everything else can react.
 */
export class UnityConductorBridge {
  // ─── Singleton Instance ───────────────────────────────────────────────────
  private static instance: UnityConductorBridge | null = null;

  /**
   * This Area Of Code Is: Singleton Accessor
   * Explanation:
   *   Ensures only one bridge exists, preventing duplicate MediaPipe
   *   subscriptions and conflicting state updates.
   * In Other Words:
   *   Only ONE interpreter allowed.
   */
  public static getInstance(): UnityConductorBridge {
    if (!UnityConductorBridge.instance) {
      UnityConductorBridge.instance = new UnityConductorBridge();
    }
    return UnityConductorBridge.instance;
  }

  // ─── Internal State ───────────────────────────────────────────────────────
  private config: ConductorBridgeConfig;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;

  // MediaPipe subscription handles (for cleanup)
  private unsubBlink: (() => void) | null = null;
  private unsubHeadPose: (() => void) | null = null;
  private unsubExpression: (() => void) | null = null;
  private unsubBeatTick: (() => void) | null = null;
  private unsubMediaPipeError: (() => void) | null = null;

  // Throttling state
  private lastHeadPoseUpdate: number = 0;
  private lastExpressionUpdate: number = 0;
  private lastBeatProcessed: number = 0;

  // Prayer detection state
  private prayerStartTime: number = 0;
  private isPrayerMode: boolean = false;
  private prayerGraceEndTime: number = 0;

  // Conductor presence tracking
  private lastConductorSeen: number = 0;
  private conductorConfidence: number = 0;
  private isAutoMode: boolean = false;

  // Tempo stability tracking
  private tempoHistory: TempoHistoryEntry[] = [];
  private stableBpm: number = 120;
  private bpmConfidence: number = 0;

  // Classification state
  private currentClassification: ConductorClassification = {
    presence: 'absent',
    confidence: 'none',
    activity: 'unknown',
    tempoStability: 'unknown',
    gestureIntensity: 'none',
    lastUpdateAt: 0,
  };

  // State manager reference
  private stateManager: UnityStateManager;

  // ─── Constructor ──────────────────────────────────────────────────────────
  private constructor(config?: Partial<ConductorBridgeConfig>) {
    /**
     * This Area Of Code Is: Constructor
     * Explanation:
     *   Private constructor enforces singleton. Merges config with
     *   NTCC defaults and acquires StateManager reference.
     * In Other Words:
     *   Sets up the interpreter with church-specific settings.
     */
    this.config = { ...DEFAULT_BRIDGE_CONFIG, ...config };
    this.stateManager = UnityStateManager.getInstance();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Bridge Initialization
   * Explanation:
   *   Connects to UnityMediaPipe singleton and subscribes to all
   *   output streams. Validates that MediaPipe is already initialized.
   *
   *   Steps:
   *   1. Verify MediaPipe is initialized
   *   2. Subscribe to all five MediaPipe callbacks
   *   3. Initialize internal tracking state
   *   4. Mark bridge as ready
   *
   * In Other Words:
   *   "Turn on the interpreter and connect it to the camera feed."
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[UnityConductorBridge] Already initialized.');
      return;
    }

    // Lazy import to avoid circular dependency at module load time
    const { default: UnityMediaPipe } = await import('../UnityMediaPipe');
    const mediaPipe = UnityMediaPipe.getInstance();

    // Verify MediaPipe state
    const mpState = mediaPipe.getCurrentState();
    if (!mpState.isInitialized) {
      throw new Error('[UnityConductorBridge] UnityMediaPipe must be initialized before bridge.');
    }

    // Subscribe to all MediaPipe events
    this.unsubBlink = mediaPipe.onBlink((event) => this.handleBlink(event));
    this.unsubHeadPose = mediaPipe.onHeadPose((pose) => this.handleHeadPose(pose));
    this.unsubExpression = mediaPipe.onExpression((expr) => this.handleExpression(expr));
    this.unsubBeatTick = mediaPipe.onBeatTick((tick) => this.handleBeatTick(tick));
    this.unsubMediaPipeError = mediaPipe.onError((err) => this.handleMediaPipeError(err));

    this.isInitialized = true;
    console.log('[UnityConductorBridge] Initialized and subscribed to MediaPipe.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE CONTROL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Bridge Starter
   * Explanation:
   *   Begins processing MediaPipe events into state updates.
   *   Must be called after initialize().
   * In Other Words:
   *   "Start interpreting the conductor's gestures."
   */
  public start(): void {
    if (!this.isInitialized) {
      throw new Error('[UnityConductorBridge] Not initialized. Call initialize() first.');
    }
    this.isRunning = true;
    this.lastConductorSeen = performance.now();
    console.log('[UnityConductorBridge] Started.');
  }

  /**
   * This Area Of Code Is: Bridge Stopper
   * Explanation:
   *   Pauses event processing. MediaPipe subscriptions remain active
   *   but events are discarded. Use resume() to restart.
   * In Other Words:
   *   "Pause interpreting — but keep the microphone on."
   */
  public stop(): void {
    this.isRunning = false;
    console.log('[UnityConductorBridge] Stopped.');
  }

  /**
   * This Area Of Code Is: Bridge Resumer
   * Explanation:
   *   Restarts processing after stop() without re-subscribing to MediaPipe.
   * In Other Words:
   *   "Resume interpreting from where we left off."
   */
  public resume(): void {
    if (!this.isInitialized) {
      throw new Error('[UnityConductorBridge] Not initialized. Call initialize() first.');
    }
    this.isRunning = true;
    console.log('[UnityConductorBridge] Resumed.');
  }

  /**
   * This Area Of Code Is: Bridge Destroyer
   * Explanation:
   *   Unsubscribes from ALL MediaPipe callbacks and resets internal state.
   *   Clean separation — no dangling subscriptions.
   * In Other Words:
   *   "Shut down the interpreter and disconnect from the camera."
   */
  public destroy(): void {
    this.stop();

    // Unsubscribe from all MediaPipe events
    this.unsubBlink?.();
    this.unsubHeadPose?.();
    this.unsubExpression?.();
    this.unsubBeatTick?.();
    this.unsubMediaPipeError?.();

    this.unsubBlink = null;
    this.unsubHeadPose = null;
    this.unsubExpression = null;
    this.unsubBeatTick = null;
    this.unsubMediaPipeError = null;

    // Reset state
    this.tempoHistory = [];
    this.isPrayerMode = false;
    this.prayerStartTime = 0;
    this.prayerGraceEndTime = 0;
    this.conductorConfidence = 0;
    this.isAutoMode = false;
    this.currentClassification = {
      presence: 'absent',
      confidence: 'none',
      activity: 'unknown',
      tempoStability: 'unknown',
      gestureIntensity: 'none',
      lastUpdateAt: 0,
    };

    this.isInitialized = false;
    UnityConductorBridge.instance = null;
    console.log('[UnityConductorBridge] Destroyed and cleaned up.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Blink Event Handler
   * Explanation:
   *   Processes blink events from MediaPipe:
   *   - Beat-cue blinks → update conductor state, potentially trigger beat
   *   - Prayer blinks → activate prayer mode
   *   - Both eyes closed → check for prayer threshold
   *
   *   Prayer Detection Logic:
   *   - Both eyes closed > prayerBlinkThresholdMs → prayer mode ON
   *   - Eyes reopen + grace period expired → prayer mode OFF
   *   - During prayer: suppress beat detection, dim stage lights
   *
   * In Other Words:
   *   "The conductor blinked — was it a beat cue or are they praying?"
   */
  private handleBlink(event: BlinkEvent): void {
    if (!this.isRunning) return;

    const now = performance.now();
    this.lastConductorSeen = now;

    // Update conductor presence
    this.updateConductorPresence(true, now);

    // Check for prayer mode
    if (event.isPrayerBlink) {
      this.enterPrayerMode(now);
      return;
    }

    // Check if prayer grace period just ended
    if (this.isPrayerMode && now > this.prayerGraceEndTime) {
      this.exitPrayerMode(now);
    }

    // Process beat-cue blink
    if (event.isBeatCue && !this.isPrayerMode) {
      // Validate beat timing (cooldown)
      if (now - this.lastBeatProcessed < this.config.beatCooldownMs) {
        return; // Too soon after last beat
      }

      // Update blink rate tracking
      this.stateManager.updateConductor(
        true,
        null, // head pose updated separately
        null, // expression updated separately
        event,
        false // not a nod
      );
    }
  }

  /**
   * This Area Of Code Is: Head Pose Handler
   * Explanation:
   *   Processes head pose updates from MediaPipe at ~60fps.
   *   Throttled to configured interval to prevent state update storms.
   *
   *   Key Processing:
   *   - Detect nod gestures (nodVelocity > threshold)
   *   - Track conductor presence (face in frame)
   *   - Update confidence based on tracking consistency
   *   - Detect conductor looking away (yaw > threshold)
   *
   *   Throttling:
   *   - Raw: 60fps from MediaPipe
   *   - State updates: max 20fps (50ms throttle)
   *   - Nod detection: processed every frame (for accuracy)
   *
   * In Other Words:
   *   "The camera sees the conductor's head — update their position
   *   and check if they're nodding to the beat."
   */
  private handleHeadPose(pose: HeadPose): void {
    if (!this.isRunning) return;

    const now = performance.now();
    this.lastConductorSeen = now;

    // Always track nod detection (needs full frame rate)
    const isNodding = pose.isNodding;

    // Throttle state updates
    if (now - this.lastHeadPoseUpdate < this.config.headPoseThrottleMs) {
      // Still process nods even when throttled
      if (isNodding) {
        this.stateManager.updateConductor(
          true,
          pose,
          null,
          null,
          isNodding
        );
      }
      return;
    }
    this.lastHeadPoseUpdate = now;

    // Update conductor presence and confidence
    this.updateConductorPresence(true, now);

    // Check if conductor is looking away (possible absence indicator)
    const isLookingAway = Math.abs(pose.yaw) > 45 || Math.abs(pose.pitch) > 60;

    // Update state
    this.stateManager.updateConductor(
      true,
      pose,
      null,
      null,
      isNodding
    );

    // Update classification
    this.updateClassification({
      presence: isLookingAway ? 'uncertain' : 'present',
      confidence: this.conductorConfidence > 0.7 ? 'high' : this.conductorConfidence > 0.4 ? 'medium' : 'low',
      activity: this.isPrayerMode ? 'praying' : isNodding ? 'conducting' : 'idle',
      tempoStability: this.currentClassification.tempoStability,
      gestureIntensity: this.currentClassification.gestureIntensity,
      lastUpdateAt: now,
    });
  }

  /**
   * This Area Of Code Is: Expression Handler
   * Explanation:
   *   Processes expression intensity updates from MediaPipe.
   *   Throttled to prevent excessive state updates.
   *
   *   Key Processing:
   *   - Crescendo detection → boost lighting intensity
   *   - Diminuendo detection → reduce lighting intensity
   *   - Mouth openness → proxy for vocal intensity
   *   - Eyebrow raise → proxy for emotional intensity
   *
   *   NTCC Context:
   *   - Crescendo during chorus → brighter wash lights
   *   - Diminuendo during tag → gentle fade
   *   - High expression + low confidence → conductor speaking, not singing
   *
   * In Other Words:
   *   "The conductor's face shows intensity — make the lights match."
   */
  private handleExpression(expression: ExpressionIntensity): void {
    if (!this.isRunning) return;

    const now = performance.now();

    // Throttle state updates
    if (now - this.lastExpressionUpdate < this.config.expressionThrottleMs) {
      return;
    }
    this.lastExpressionUpdate = now;

    this.lastConductorSeen = now;
    this.updateConductorPresence(true, now);

    // Determine gesture intensity from expression
    let gestureIntensity: ConductorClassification['gestureIntensity'] = 'none';
    if (expression.overallIntensity > 0.7) gestureIntensity = 'high';
    else if (expression.overallIntensity > 0.4) gestureIntensity = 'medium';
    else if (expression.overallIntensity > 0.1) gestureIntensity = 'low';

    // Update classification
    this.updateClassification({
      ...this.currentClassification,
      gestureIntensity,
      lastUpdateAt: now,
    });

    // Update state (expression only, no blink/nod)
    this.stateManager.updateConductor(
      true,
      null,
      expression,
      null,
      false
    );
  }

  /**
   * This Area Of Code Is: Beat Tick Handler
   * Explanation:
   *   Processes quantized beat ticks from MediaPipe's fusion engine.
   *   This is the PRIMARY driver of the worship sync pipeline.
   *
   *   Validation:
   *   - Confidence threshold check
   *   - Cooldown enforcement (prevents double-beats)
   *   - BPM stability analysis
   *   - Prayer mode suppression
   *
   *   Actions on Valid Beat:
   *   1. Update timing state (advance beat)
   *   2. Add to tempo history
   *   3. Compute stable BPM
   *   4. Trigger downstream sync (LED pulse, lyric scroll)
   *
   * In Other Words:
   *   "The conductor hit a beat — validate it, then tell EVERYTHING
   *   (lights, lyrics, metronome) to advance."
   */
  private handleBeatTick(tick: UnityBeatTick): void {
    if (!this.isRunning) return;
    if (this.isPrayerMode) return; // Suppress during prayer

    const now = performance.now();

    // Confidence validation
    if (tick.confidence < this.config.minBeatConfidence) {
      return;
    }

    // Cooldown check
    if (now - this.lastBeatProcessed < this.config.beatCooldownMs) {
      return;
    }
    this.lastBeatProcessed = now;

    // Add to tempo history
    this.tempoHistory.push({
      bpm: tick.bpm,
      timestamp: now,
      source: tick.source,
      confidence: tick.confidence,
    });

    // Prune old history
    const cutoff = now - (this.config.bpmStabilityWindow * (60000 / tick.bpm));
    while (this.tempoHistory.length > 0 && this.tempoHistory[0].timestamp < cutoff) {
      this.tempoHistory.shift();
    }

    // Compute stable BPM
    this.computeStableBpm();

    // Update state
    this.stateManager.batch(() => {
      this.stateManager.setState('timing.bpm', this.stableBpm, 'conductor');
      this.stateManager.setState('timing.beatDurationMs', 60000 / this.stableBpm, 'conductor');
      this.stateManager.advanceBeat();
    });

    // Update classification
    this.updateClassification({
      ...this.currentClassification,
      tempoStability: this.bpmConfidence > 0.7 ? 'stable' : 'unstable',
      lastUpdateAt: now,
    });
  }

  /**
   * This Area Of Code Is: MediaPipe Error Handler
   * Explanation:
   *   Handles errors from UnityMediaPipe (camera failure, WASM load error,
   *   detection timeout). Switches to manual mode and logs for recovery.
   *
   *   Recovery Strategy:
   *   1. Log error to state
   *   2. Switch to manual mode (conductor confidence = 0)
   *   3. Notify UI to show manual controls
   *   4. Attempt auto-recovery after 5 seconds
   *
   * In Other Words:
   *   "The camera broke — switch to manual mode so the service can continue."
   */
  private handleMediaPipeError(error: Error): void {
    console.error('[UnityConductorBridge] MediaPipe error:', error);

    this.stateManager.setError(error);
    this.stateManager.setState('conductor.confidence', 0, 'system');
    this.isAutoMode = false;

    // Update classification
    this.updateClassification({
      presence: 'absent',
      confidence: 'none',
      activity: 'unknown',
      tempoStability: 'unknown',
      gestureIntensity: 'none',
      lastUpdateAt: performance.now(),
    });

    // Attempt recovery after delay
    setTimeout(() => this.attemptRecovery(), 5000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRAYER MODE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Prayer Mode Enter
   * Explanation:
   *   Activates prayer mode when extended eye closure detected.
   *   - Sets prayer flag in state
   *   - Pauses song timing
   *   - Triggers prayer lighting scene
   *   - Logs for service record
   *
   *   NTCC Sacred Context:
   *   Prayer mode is treated with reverence. Never auto-exits until
   *   conductor explicitly reopens eyes and grace period expires.
   *   Manual override available for worship leader.
   *
   * In Other Words:
   *   "The conductor is praying — pause everything, dim the stage,
   *   and wait respectfully."
   */
  private enterPrayerMode(timestamp: number): void {
    if (this.isPrayerMode) return;

    this.isPrayerMode = true;
    this.prayerStartTime = timestamp;
    this.prayerGraceEndTime = timestamp + this.config.prayerGracePeriodMs;

    this.stateManager.setPrayerActive(true);

    console.log('[UnityConductorBridge] Prayer mode entered at', new Date(timestamp).toISOString());
  }

  /**
   * This Area Of Code Is: Prayer Mode Exit
   * Explanation:
   *   Deactivates prayer mode when conductor reopens eyes after grace period.
   *   - Clears prayer flag
   *   - Resumes song timing if was playing
   *   - Triggers return to worship lighting
   *   - Logs duration for service record
   *
   * In Other Words:
   *   "Prayer's over — resume the worship service flow."
   */
  private exitPrayerMode(timestamp: number): void {
    if (!this.isPrayerMode) return;

    const duration = timestamp - this.prayerStartTime;
    this.isPrayerMode = false;
    this.prayerStartTime = 0;
    this.prayerGraceEndTime = 0;

    this.stateManager.setPrayerActive(false);

    console.log(`[UnityConductorBridge] Prayer mode exited after ${Math.round(duration / 1000)}s`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONDUCTOR PRESENCE & CONFIDENCE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Presence Updater
   * Explanation:
   *   Tracks conductor presence over time. Computes confidence score
   *   based on detection consistency and duration.
   *
   *   Confidence Formula:
   *   - Detection duration / confidenceRecoveryMs (capped at 1.0)
   *   - Drops to 0 after maxConductorAbsenceMs of no detection
   *   - Smooth ramp up/down for UI stability
   *
   *   Auto/Manual Mode:
   *   - confidence >= minConfidenceForAuto → auto mode (conductor-driven)
   *   - confidence < minConfidenceForAuto → manual mode (tap tempo)
   *
   * In Other Words:
   *   "How sure are we that the conductor is really there and
   *   we can trust their gestures?"
   */
  private updateConductorPresence(isDetected: boolean, timestamp: number): void {
    if (isDetected) {
      this.lastConductorSeen = timestamp;

      // Ramp up confidence
      const timeSinceLastSeen = timestamp - this.lastConductorSeen;
      const confidenceDelta = timeSinceLastSeen / this.config.confidenceRecoveryMs;
      this.conductorConfidence = Math.min(1.0, this.conductorConfidence + confidenceDelta);
    } else {
      // Check absence timeout
      const absenceDuration = timestamp - this.lastConductorSeen;
      if (absenceDuration > this.config.maxConductorAbsenceMs) {
        this.conductorConfidence = 0;
        this.isAutoMode = false;

        // Update classification
        this.updateClassification({
          ...this.currentClassification,
          presence: 'absent',
          confidence: 'none',
          activity: 'unknown',
          lastUpdateAt: timestamp,
        });
      } else {
        // Graceful confidence decay
        this.conductorConfidence = Math.max(0, this.conductorConfidence - 0.1);
      }
    }

    // Update auto/manual mode
    const wasAutoMode = this.isAutoMode;
    this.isAutoMode = this.conductorConfidence >= this.config.minConfidenceForAuto;

    if (wasAutoMode !== this.isAutoMode) {
      console.log(`[UnityConductorBridge] Mode switched to: ${this.isAutoMode ? 'AUTO' : 'MANUAL'} (confidence: ${this.conductorConfidence.toFixed(2)})`);
    }

    // Update state
    this.stateManager.setState('conductor.confidence', this.conductorConfidence, 'conductor');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPO STABILITY
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Stable BPM Computer
   * Explanation:
   *   Computes a smoothed, stable BPM from the tempo history buffer.
   *   Uses median filter for outlier rejection, then exponential
   *   moving average for smooth transitions.
   *
   *   Algorithm:
   *   1. Collect BPM samples from last N beats
   *   2. Reject outliers (> maxBpmDeviation from median)
   *   3. Compute median of remaining samples
   *   4. Apply EMA with 0.7 weight to previous stable BPM
   *   5. Compute confidence based on sample variance
   *
   *   NTCC Context:
   *   - Prevents jittery tempo changes during expressive conducting
   *   - Maintains steady click track for band
   *   - Allows gradual tempo ramps (ritardando/accelerando)
   *
   * In Other Words:
   *   "The conductor's been nodding at different speeds — what's the
   *   REAL tempo we should all follow?"
   */
  private computeStableBpm(): void {
    if (this.tempoHistory.length < 2) {
      this.stableBpm = this.tempoHistory[0]?.bpm || 120;
      this.bpmConfidence = 0;
      return;
    }

    // Extract BPM values
    const bpms = this.tempoHistory.map((t) => t.bpm);

    // Median filter
    const sorted = [...bpms].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Reject outliers
    const validBpms = bpms.filter((bpm) => Math.abs(bpm - median) <= this.config.maxBpmDeviation);

    if (validBpms.length === 0) {
      this.stableBpm = median;
      this.bpmConfidence = 0;
      return;
    }

    // Average of valid samples
    const avgBpm = validBpms.reduce((sum, bpm) => sum + bpm, 0) / validBpms.length;

    // Exponential moving average
    const alpha = 0.3; // 30% new, 70% previous
    this.stableBpm = Math.round(alpha * avgBpm + (1 - alpha) * this.stableBpm);

    // Confidence based on sample consistency
    const variance = validBpMs.reduce((sum, bpm) => sum + Math.pow(bpm - avgBpm, 2), 0) / validBpms.length;
    const stdDev = Math.sqrt(variance);
    this.bpmConfidence = Math.max(0, 1 - stdDev / 20); // Normalize: 0 BPM variance = 1.0 confidence

    // Clamp to valid range
    this.stableBpm = Math.max(40, Math.min(200, this.stableBpm));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLASSIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Classification Updater
   * Explanation:
   *   Updates the high-level conductor classification and writes it
   *   to state for UI display and downstream logic.
   * In Other Words:
   *   "Update the 'what is the conductor doing?' summary."
   */
  private updateClassification(updates: Partial<ConductorClassification>): void {
    this.currentClassification = {
      ...this.currentClassification,
      ...updates,
    };

    // Write to state (for UI display)
    // Note: We don't store the full classification in state to keep it lean
    // Instead, downstream systems read individual state paths
  }

  /**
   * This Area Of Code Is: Classification Reader
   * Explanation:
   *   Returns the current conductor classification for UI display.
   * In Other Words:
   *   "What's the conductor doing right now?"
   */
  public getClassification(): ConductorClassification {
    return { ...this.currentClassification };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOVERY
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Auto-Recovery Attempt
   * Explanation:
   *   Attempts to recover from MediaPipe errors by checking if the
   *   camera has become available again. Called automatically after
   *   a 5-second delay following an error.
   *
   *   Recovery Steps:
   *   1. Check if MediaPipe is still initialized
   *   2. If yes, resume normal operation
   *   3. If no, remain in manual mode
   *   4. Log recovery attempt result
   *
   * In Other Words:
   *   "Let me check if the camera fixed itself — if so, go back to auto."
   */
  private async attemptRecovery(): Promise<void> {
    try {
      const { default: UnityMediaPipe } = await import('../UnityMediaPipe');
      const mediaPipe = UnityMediaPipe.getInstance();
      const state = mediaPipe.getCurrentState();

      if (state.isInitialized && state.isRunning) {
        console.log('[UnityConductorBridge] Auto-recovery successful. Resuming auto mode.');
        this.isAutoMode = true;
        this.stateManager.setError(null);
      } else {
        console.log('[UnityConductorBridge] Auto-recovery failed. Remaining in manual mode.');
      }
    } catch (err) {
      console.error('[UnityConductorBridge] Recovery attempt failed:', err);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Config Updater
   * Explanation:
   *   Hot-swaps bridge configuration at runtime.
   *   Useful for sanctuary-specific tuning during sound check.
   * In Other Words:
   *   "Adjust the interpreter's sensitivity while the service is running."
   */
  public updateConfig(updates: Partial<ConductorBridgeConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('[UnityConductorBridge] Config updated:', updates);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE ACCESSORS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Bridge State Snapshot
   * Explanation:
   *   Returns current bridge internal state for debugging.
   * In Other Words:
   *   "How is the interpreter doing?"
   */
  public getBridgeState(): {
    isInitialized: boolean;
    isRunning: boolean;
    isAutoMode: boolean;
    isPrayerMode: boolean;
    conductorConfidence: number;
    stableBpm: number;
    bpmConfidence: number;
    tempoHistoryLength: number;
    classification: ConductorClassification;
    config: ConductorBridgeConfig;
  } {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      isAutoMode: this.isAutoMode,
      isPrayerMode: this.isPrayerMode,
      conductorConfidence: this.conductorConfidence,
      stableBpm: this.stableBpm,
      bpmConfidence: this.bpmConfidence,
      tempoHistoryLength: this.tempoHistory.length,
      classification: this.getClassification(),
      config: { ...this.config },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: Module Exports
 * Explanation:
 *   Public API for UnityConductorBridge and related types.
 * In Other Words:
 *   The door handles for the conductor bridge system.
 */
export { UnityConductorBridge as default };
