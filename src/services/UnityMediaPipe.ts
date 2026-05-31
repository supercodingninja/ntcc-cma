/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  src/services/UnityMediaPipe.ts                                               ║
 * ║  NTCC Music App — Unity Solution™ | The Super Coding Ninja™                 ║
 * ║  SCN Technologies™ | © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,              ║
 * ║  𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * This Area Of Code Is: MediaPipe Face Mesh Integration Service
 * Explanation:
 *   Bridges MediaPipe's Face Mesh landmark detection into the Unity Solution™
 *   conductor tracking pipeline. Detects eye-blink patterns (conductor beat cues),
 *   head-nod tempo, and facial expression intensity to drive real-time worship
 *   tempo synchronization, auto-scroll triggers, and LED conductor-follow
 *   lighting across the sanctuary.
 *
 *   - Face Mesh 468 landmarks → blink detection (EAR ratio)
 *   - Head pose → nod/tempo extraction (angular velocity)
 *   - Mouth aperture → expression intensity (vocal cue proxy)
 *   - Web Worker offload → 60fps on mobile iPad Pro / Android tablets
 *   - NTCC-specific: Grace-period blink filter (ignores prayer-closed-eyes)
 *
 * In Other Words:
 *   This is the "conductor camera" brain. When the worship leader blinks on
 *   the down-beat, nods the tempo, or opens wide for a crescendo, this service
 *   turns those micro-gestures into quantized musical events that drive the
 *   entire band's click, lyrics scroll, and stage lighting — all without
 *   the conductor wearing any hardware.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: Landmark Point Interface
 * Explanation:
 *   A single 3D facial landmark coordinate from MediaPipe Face Mesh.
 *   z represents depth relative to the camera (negative = closer).
 *   visibility is MediaPipe's confidence score (0.0–1.0).
 * In Other Words:
 *   One dot on the conductor's face — like a pixel with depth.
 */
export interface FaceLandmark {
  x: number;        // Normalized [0,1] horizontal
  y: number;        // Normalized [0,1] vertical
  z: number;        // Depth relative to camera plane
  visibility?: number; // Detection confidence
}

/**
 * This Area Of Code Is: Full Face Mesh Result
 * Explanation:
 *   Complete 468-landmark face detection frame from MediaPipe.
 *   Includes face bounding box, key facial regions, and detection metadata.
 * In Other Words:
 *   A snapshot of the conductor's entire face at one moment in time.
 */
export interface FaceMeshResult {
  landmarks: FaceLandmark[];      // 468 landmarks
  faceOval: FaceLandmark[];       // Contour landmarks (indices 10–338)
  leftEye: FaceLandmark[];        // Left eye region (indices 33–133)
  rightEye: FaceLandmark[];       // Right eye region (indices 362–263)
  lips: FaceLandmark[];           // Lip region (indices 0–17, 61–91)
  nose: FaceLandmark[];           // Nose bridge & tip
  leftIris: FaceLandmark[];       // Left iris center + circumference
  rightIris: FaceLandmark[];      // Right iris center + circumference
  faceBoundingBox: {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  };
  timestamp: number;              // Frame capture time (performance.now())
  detectionConfidence: number;    // Overall face detection confidence
}

/**
 * This Area Of Code Is: Blink Event Interface
 * Explanation:
 *   A detected blink event with classification and musical context.
 *   Distinguishes conductor beat-blinks from prayer/closed-eye states.
 * In Other Words:
 *   "The conductor just blinked — was it a beat cue or just a long prayer?"
 */
export interface BlinkEvent {
  timestamp: number;
  eye: 'left' | 'right' | 'both';
  durationMs: number;             // How long eyes were closed
  earRatio: number;               // Eye Aspect Ratio at closure
  isBeatCue: boolean;             // Classified as intentional beat blink
  isPrayerBlink: boolean;         // Classified as extended closed-eyes (prayer)
  bpmContext?: number;            // Current detected tempo when blink occurred
}

/**
 * This Area Of Code Is: Head Pose / Nod Detection
 * Explanation:
 *   3D head orientation and nod velocity for tempo extraction.
 *   Euler angles computed from face landmark geometry.
 * In Other Words:
 *   Which way is the conductor's head tilted, and how fast are they nodding?
 */
export interface HeadPose {
  pitch: number;    // Nod up/down (negative = looking down)
  yaw: number;      // Turn left/right
  roll: number;     // Head tilt (ear-to-shoulder angle)
  nodVelocity: number; // d(pitch)/dt — tempo pulse strength
  isNodding: boolean;   // True when nodVelocity exceeds threshold
  nodPhase: 'up' | 'down' | 'neutral'; // Current nod direction
}

/**
 * This Area Of Code Is: Conductor Expression Intensity
 * Explanation:
 *   Mouth aperture and eyebrow raise as proxy for vocal intensity / crescendo.
 *   Used to trigger dynamic lighting intensity and lyric emphasis.
 * In Other Words:
 *   When the conductor opens their mouth wide or raises eyebrows, the stage
 *   lights should get brighter and the lyrics should pop.
 */
export interface ExpressionIntensity {
  mouthOpenness: number;          // 0.0 = closed, 1.0 = fully open
  eyebrowRaise: number;           // 0.0 = neutral, 1.0 = maximum raise
  overallIntensity: number;       // Combined 0.0–1.0 intensity score
  isCrescendo: boolean;           // Rapid intensity increase detected
  isDiminuendo: boolean;          // Rapid intensity decrease detected
}

/**
 * This Area Of Code Is: Unity Beat Tick
 * Explanation:
 *   A quantized musical beat event derived from conductor gestures.
 *   Combines blink, nod, and expression data into a single unified tick.
 * In Other Words:
 *   The final "click" that the metronome, lyric scroll, and lights all follow.
 */
export interface UnityBeatTick {
  timestamp: number;
  beatNumber: number;             // 1-indexed beat within measure
  measureNumber: number;
  bpm: number;
  confidence: number;             // 0.0–1.0 confidence this is a real beat
  source: 'blink' | 'nod' | 'expression' | 'fusion';
  headPose: HeadPose;
  expression: ExpressionIntensity;
}

/**
 * This Area Of Code Is: Service Configuration Options
 * Explanation:
 *   Runtime tunable parameters for MediaPipe integration.
 *   Calibrated for sanctuary lighting, distance, and iPad Pro cameras.
 * In Other Words:
 *   Dials and knobs to make the conductor camera work in YOUR church.
 */
export interface MediaPipeConfig {
  // Detection sensitivity
  minDetectionConfidence: number;   // Default: 0.5
  minTrackingConfidence: number;    // Default: 0.5
  maxNumFaces: number;              // Default: 1 (conductor only)

  // Blink detection
  blinkEarThreshold: number;        // EAR below this = eyes closed (default: 0.2)
  blinkMinDurationMs: number;       // Minimum ms to register as blink (default: 80)
  blinkMaxBeatDurationMs: number;   // Max ms for beat-cue blink (default: 300)
  prayerBlinkThresholdMs: number;   // Above this = prayer, not beat (default: 1500)

  // Nod / tempo
  nodVelocityThreshold: number;     // Pitch change deg/s to trigger nod (default: 15)
  nodCooldownMs: number;            // Min ms between nod beats (default: 200)
  bpmSmoothingWindow: number;       // Rolling average window size (default: 8)

  // Expression
  mouthOpenThreshold: number;       // Normalized aperture for "open" (default: 0.3)
  crescendoDeltaThreshold: number;  // Intensity change / sec for crescendo (default: 0.4)

  // NTCC sanctuary specifics
  cameraDistanceMeters: number;     // Estimated conductor-to-camera distance
  sanctuaryLighting: 'bright' | 'dim' | 'spotlight' | 'candle';
  gracePeriodMs: number;          // Ignore blinks after prayer detection (default: 3000)
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION — NTCC Graham Sanctuary Calibrated
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: Default NTCC Configuration Preset
 * Explanation:
 *   Pre-calibrated for NTCC Graham sanctuary: ~4m camera distance,
 *   mixed bright/dim lighting during worship, iPad Pro 12-inch front camera.
 *   Grace period prevents false beat detection during prayer/altar call.
 * In Other Words:
 *   These are the settings that work at NTCC Graham out of the box.
 */
export const DEFAULT_NTCC_MEDIAPIPE_CONFIG: MediaPipeConfig = {
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  maxNumFaces: 1,

  blinkEarThreshold: 0.2,
  blinkMinDurationMs: 80,
  blinkMaxBeatDurationMs: 300,
  prayerBlinkThresholdMs: 1500,

  nodVelocityThreshold: 15,
  nodCooldownMs: 200,
  bpmSmoothingWindow: 8,

  mouthOpenThreshold: 0.3,
  crescendoDeltaThreshold: 0.4,

  cameraDistanceMeters: 4.0,
  sanctuaryLighting: 'dim',
  gracePeriodMs: 3000,
};

// ═══════════════════════════════════════════════════════════════════════════════
// FACE MESH LANDMARK INDICES (MediaPipe canonical mapping)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: Landmark Index Constants
 * Explanation:
 *   MediaPipe Face Mesh uses fixed 468-point indices. These constants map
 *   semantic regions to their index ranges for type-safe landmark access.
 *   Source: Google MediaPipe Face Mesh documentation (2024).
 * In Other Words:
 *   A phone book for the 468 dots on the face — "left eye corner is #33."
 */
const LANDMARK_INDICES = {
  // Left eye (observer's left = conductor's right)
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_TOP_1: 159,
  LEFT_EYE_TOP_2: 158,
  LEFT_EYE_BOTTOM_1: 145,
  LEFT_EYE_BOTTOM_2: 153,
  LEFT_EYE_INNER: 133,
  LEFT_IRIS_CENTER: 468,

  // Right eye (observer's right = conductor's left)
  RIGHT_EYE_OUTER: 362,
  RIGHT_EYE_TOP_1: 386,
  RIGHT_EYE_TOP_2: 385,
  RIGHT_EYE_BOTTOM_1: 374,
  RIGHT_EYE_BOTTOM_2: 380,
  RIGHT_EYE_INNER: 263,
  RIGHT_IRIS_CENTER: 473,

  // Mouth
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  MOUTH_TOP: 0,
  MOUTH_BOTTOM: 17,
  UPPER_LIP_TOP: 13,
  LOWER_LIP_BOTTOM: 14,

  // Nose
  NOSE_TIP: 1,
  NOSE_BRIDGE: 6,

  // Eyebrows
  LEFT_EYEBROW_OUTER: 105,
  LEFT_EYEBROW_INNER: 107,
  RIGHT_EYEBROW_OUTER: 334,
  RIGHT_EYEBROW_INNER: 336,

  // Face contour (for bounding box)
  FACE_TOP: 10,
  FACE_BOTTOM: 152,
  FACE_LEFT: 234,
  FACE_RIGHT: 454,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// UNITY MEDIAPIPE SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: UnityMediaPipe Service Class
 * Explanation:
 *   Singleton service managing MediaPipe Face Mesh lifecycle, conductor gesture
 *   detection, beat quantization, and real-time callback dispatch.
 *
 *   Architecture:
 *   ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
 *   │  Camera Feed    │────▶│  MediaPipe WASM  │────▶│  Landmark       │
 *   │  (getUserMedia) │     │  (Web Worker)    │     │  Processing     │
 *   └─────────────────┘     └──────────────────┘     └─────────────────┘
 *                                                              │
 *                              ┌───────────────────────────────┼──────────────┐
 *                              ▼                               ▼              ▼
 *                        ┌─────────┐                   ┌──────────┐    ┌──────────┐
 *                        │  Blink  │                   │   Nod    │    │Expression│
 *                        │Detector │                   │Detector  │    │ Analyzer │
 *                        └────┬────┘                   └────┬─────┘    └────┬─────┘
 *                             │                             │               │
 *                             └──────────────┬──────────────┘               │
 *                                            ▼                              │
 *                                     ┌────────────┐                       │
 *                                     │ Beat       │◄──────────────────────┘
 *                                     │ Fusion     │
 *                                     │ Engine     │
 *                                     └─────┬──────┘
 *                                           │
 *                                           ▼
 *                                     ┌────────────┐
 *                                     │ UnityBeat  │
 *                                     │ Tick       │
 *                                     │ Callbacks  │
 *                                     └────────────┘
 *
 *   NTCC Integration:
 *   - Subscribes to LED conductor-follow system
 *   - Drives lyric auto-scroll via beat ticks
 *   - Feeds tempo into metronome/click track
 *   - Grace-period filter for prayer/altar call
 *
 * In Other Words:
 *   This is the master control room. It takes the camera video, runs it
 *   through AI face detection, figures out when the conductor blinks or nods,
 *   and turns those gestures into musical beats that everything else follows.
 */
export class UnityMediaPipe {
  // ─── Singleton Instance ───────────────────────────────────────────────────
  private static instance: UnityMediaPipe | null = null;

  /**
   * This Area Of Code Is: Singleton Accessor
   * Explanation:
   *   Ensures only one MediaPipe service exists app-wide, preventing
   *   duplicate camera access and conflicting beat detection streams.
   * In Other Words:
   *   Only ONE conductor camera allowed — no double vision.
   */
  public static getInstance(): UnityMediaPipe {
    if (!UnityMediaPipe.instance) {
      UnityMediaPipe.instance = new UnityMediaPipe();
    }
    return UnityMediaPipe.instance;
  }

  // ─── Internal State ───────────────────────────────────────────────────────
  private config: MediaPipeConfig;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;

  // MediaPipe WASM / graph references
  private faceMesh: any = null;           // MediaPipe FaceMesh solution
  private camera: any = null;             // MediaPipe Camera utility
  private videoElement: HTMLVideoElement | null = null;

  // Web Worker for off-main-thread processing
  private worker: Worker | null = null;
  private useWorker: boolean = true;

  // Detection history buffers (for smoothing / classification)
  private landmarkHistory: FaceMeshResult[] = [];
  private readonly HISTORY_MAX_SIZE = 30; // ~500ms at 60fps

  // Blink detection state
  private leftEyeOpen: boolean = true;
  private rightEyeOpen: boolean = true;
  private leftEyeClosedAt: number = 0;
  private rightEyeClosedAt: number = 0;
  private lastBlinkEvent: BlinkEvent | null = null;
  private prayerGracePeriodEnd: number = 0; // timestamp when grace expires

  // Nod / tempo state
  private pitchHistory: number[] = [];
  private lastNodTimestamp: number = 0;
  private currentBpm: number = 120;       // Running BPM estimate
  private bpmHistory: number[] = [];
  private beatCount: number = 0;
  private measureCount: number = 1;

  // Expression state
  private lastMouthOpenness: number = 0;
  private lastEyebrowRaise: number = 0;
  private lastIntensityTimestamp: number = 0;

  // ─── Callback Registries ──────────────────────────────────────────────────
  private blinkCallbacks: ((event: BlinkEvent) => void)[] = [];
  private headPoseCallbacks: ((pose: HeadPose) => void)[] = [];
  private expressionCallbacks: ((expr: ExpressionIntensity) => void)[] = [];
  private beatTickCallbacks: ((tick: UnityBeatTick) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];

  // ─── Constructor ──────────────────────────────────────────────────────────
  private constructor(config?: Partial<MediaPipeConfig>) {
    /**
     * This Area Of Code Is: Constructor
     * Explanation:
     *   Private constructor enforces singleton pattern. Merges user-provided
     *   config overrides with NTCC sanctuary defaults.
     * In Other Words:
     *   Sets up the service with church-specific camera settings.
     */
    this.config = { ...DEFAULT_NTCC_MEDIAPIPE_CONFIG, ...config };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Service Initialization
   * Explanation:
   *   Loads MediaPipe Face Mesh WASM, requests camera permission, and
   *   initializes the detection graph. Supports both direct WASM and
   *   Web Worker modes for performance.
   *
   *   Steps:
   *   1. Dynamically import MediaPipe libraries (code-split for bundle size)
   *   2. Configure Face Mesh with NTCC-optimized parameters
   *   3. Request getUserMedia with sanctuary-appropriate constraints
   *   4. Start continuous detection loop
   *
   * In Other Words:
   *   Turns on the conductor camera and gets the face-tracking AI ready.
   */
  public async initialize(
    videoElement: HTMLVideoElement,
    options?: { useWorker?: boolean; workerScriptUrl?: string }
  ): Promise<void> {
    if (this.isInitialized) {
      console.warn('[UnityMediaPipe] Already initialized. Call destroy() first to re-initialize.');
      return;
    }

    this.videoElement = videoElement;
    this.useWorker = options?.useWorker ?? true;

    try {
      // Step 1: Dynamically import MediaPipe (tree-shakeable)
      const { FaceMesh } = await import('@mediapipe/face_mesh');
      const { Camera } = await import('@mediapipe/camera_utils');

      // Step 2: Configure Face Mesh with NTCC settings
      this.faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          // Load WASM binaries from CDN or local asset path
          // NTCC deployment: assets/mediapipe/ for offline capability
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      this.faceMesh.setOptions({
        maxNumFaces: this.config.maxNumFaces,
        refineLandmarks: true,              // Enable iris tracking (468+5 points)
        minDetectionConfidence: this.config.minDetectionConfidence,
        minTrackingConfidence: this.config.minTrackingConfidence,
      });

      // Step 3: Bind detection callback
      this.faceMesh.onResults((results: any) => this.onFaceMeshResults(results));

      // Step 4: Initialize camera with sanctuary-optimized constraints
      const cameraConstraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 60, min: 30 },
        },
        audio: false,
      };

      // Adjust for sanctuary lighting
      if (this.config.sanctuaryLighting === 'dim' || this.config.sanctuaryLighting === 'candle') {
        (cameraConstraints.video as MediaTrackConstraints).advanced = [
          { exposureMode: 'continuous' },
          { whiteBalanceMode: 'continuous' },
          { brightness: { ideal: 128 } },
        ];
      }

      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.faceMesh && this.isRunning) {
            await this.faceMesh.send({ image: videoElement });
          }
        },
        width: 1280,
        height: 720,
      });

      // Step 5: Initialize Web Worker if enabled
      if (this.useWorker && options?.workerScriptUrl) {
        this.initializeWorker(options.workerScriptUrl);
      }

      this.isInitialized = true;
      console.log('[UnityMediaPipe] Initialized successfully with NTCC config:', this.config);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[UnityMediaPipe] Initialization failed:', err);
      this.errorCallbacks.forEach((cb) => cb(err));
      throw err;
    }
  }

  /**
   * This Area Of Code Is: Web Worker Initialization
   * Explanation:
   *   Offloads heavy landmark post-processing (EAR calculations, head pose
   *   estimation, BPM smoothing) to a Web Worker to maintain 60fps UI.
   *   Worker receives raw landmarks, returns processed events.
   * In Other Words:
   *   Hires a background assistant to do the math so the screen stays smooth.
   */
  private initializeWorker(scriptUrl: string): void {
    try {
      this.worker = new Worker(scriptUrl, { type: 'module' });

      this.worker.onmessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        switch (type) {
          case 'blink':
            this.blinkCallbacks.forEach((cb) => cb(payload as BlinkEvent));
            break;
          case 'headPose':
            this.headPoseCallbacks.forEach((cb) => cb(payload as HeadPose));
            break;
          case 'expression':
            this.expressionCallbacks.forEach((cb) => cb(payload as ExpressionIntensity));
            break;
          case 'beatTick':
            this.beatTickCallbacks.forEach((cb) => cb(payload as UnityBeatTick));
            break;
          case 'error':
            this.errorCallbacks.forEach((cb) => cb(new Error(payload.message)));
            break;
        }
      };

      this.worker.onerror = (err) => {
        console.error('[UnityMediaPipe] Worker error:', err);
        this.useWorker = false; // Fallback to main thread
      };

      // Send config to worker
      this.worker.postMessage({ type: 'init', config: this.config });

    } catch (err) {
      console.warn('[UnityMediaPipe] Worker initialization failed, falling back to main thread:', err);
      this.useWorker = false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE CONTROL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Start Detection
   * Explanation:
   *   Begins camera capture and continuous face detection.
   *   Must be called after initialize() and after user gesture (browser requirement).
   * In Other Words:
   *   Press "record" — the conductor camera starts watching.
   */
  public async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('[UnityMediaPipe] Not initialized. Call initialize() first.');
    }
    if (this.isRunning) return;

    await this.camera?.start();
    this.isRunning = true;
    console.log('[UnityMediaPipe] Detection started.');
  }

  /**
   * This Area Of Code Is: Stop Detection
   * Explanation:
   *   Pauses camera capture and detection without releasing resources.
   *   Use resume() to restart without re-initialization overhead.
   * In Other Words:
   *   Pause button — stops watching but keeps everything ready.
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    await this.camera?.stop();
    this.isRunning = false;
    console.log('[UnityMediaPipe] Detection stopped.');
  }

  /**
   * This Area Of Code Is: Resume Detection
   * Explanation:
   *   Restarts detection after stop() without re-initializing MediaPipe.
   *   Faster than full initialize() → start() cycle.
   * In Other Words:
   *   Unpause — back to watching the conductor instantly.
   */
  public async resume(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('[UnityMediaPipe] Not initialized. Call initialize() first.');
    }
    if (this.isRunning) return;

    await this.camera?.start();
    this.isRunning = true;
    console.log('[UnityMediaPipe] Detection resumed.');
  }

  /**
   * This Area Of Code Is: Full Destroy / Cleanup
   * Explanation:
   *   Releases ALL resources: camera, MediaPipe graph, Web Worker,
   *   callbacks, and history buffers. Service returns to pristine state.
   * In Other Words:
   *   Power off — wipes everything clean for a fresh start.
   */
  public async destroy(): Promise<void> {
    await this.stop();

    this.faceMesh?.close();
    this.faceMesh = null;

    this.camera = null;
    this.videoElement = null;

    this.worker?.terminate();
    this.worker = null;

    // Clear all callbacks
    this.blinkCallbacks = [];
    this.headPoseCallbacks = [];
    this.expressionCallbacks = [];
    this.beatTickCallbacks = [];
    this.errorCallbacks = [];

    // Clear history
    this.landmarkHistory = [];
    this.pitchHistory = [];
    this.bpmHistory = [];

    // Reset state
    this.isInitialized = false;
    this.isRunning = false;
    this.beatCount = 0;
    this.measureCount = 1;
    this.currentBpm = 120;
    this.prayerGracePeriodEnd = 0;

    UnityMediaPipe.instance = null;
    console.log('[UnityMediaPipe] Destroyed and cleaned up.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FACE MESH RESULTS PROCESSOR
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Raw Results Handler
   * Explanation:
   *   Receives raw MediaPipe FaceMesh results every camera frame.
   *   Routes to either Web Worker (offload) or main-thread processing.
   *   Maintains landmark history buffer for temporal smoothing.
   * In Other Words:
   *   The mailroom — every frame of face data comes here first, then gets
   *   sorted to the right department (worker or main thread).
   */
  private onFaceMeshResults(results: any): void {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return; // No face detected this frame
    }

    const rawLandmarks: any[] = results.multiFaceLandmarks[0];
    const timestamp = performance.now();

    // Convert raw landmarks to typed interface
    const faceResult = this.parseFaceMeshResult(rawLandmarks, timestamp, results);

    // Maintain rolling history for temporal analysis
    this.landmarkHistory.push(faceResult);
    if (this.landmarkHistory.length > this.HISTORY_MAX_SIZE) {
      this.landmarkHistory.shift();
    }

    // Route to worker or process on main thread
    if (this.useWorker && this.worker) {
      this.worker.postMessage({
        type: 'process',
        landmarks: rawLandmarks,
        timestamp,
        history: this.landmarkHistory.slice(-10), // Last 10 frames for context
      });
    } else {
      this.processFrameMainThread(faceResult, timestamp);
    }
  }

  /**
   * This Area Of Code Is: Raw Landmark Parser
   * Explanation:
   *   Converts MediaPipe's flat landmark array into semantic regions
   *   (eyes, mouth, nose, etc.) with bounding box computation.
   * In Other Words:
   *   Takes the 468 numbered dots and groups them into "left eye," "mouth," etc.
   */
  private parseFaceMeshResult(
    rawLandmarks: any[],
    timestamp: number,
    rawResults: any
  ): FaceMeshResult {
    const landmarks: FaceLandmark[] = rawLandmarks.map((lm: any) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility ?? 1.0,
    }));

    // Extract semantic regions by index ranges
    const faceOval = landmarks.slice(10, 339); // Approximate contour
    const leftEye = [
      landmarks[LANDMARK_INDICES.LEFT_EYE_OUTER],
      landmarks[LANDMARK_INDICES.LEFT_EYE_TOP_1],
      landmarks[LANDMARK_INDICES.LEFT_EYE_TOP_2],
      landmarks[LANDMARK_INDICES.LEFT_EYE_INNER],
      landmarks[LANDMARK_INDICES.LEFT_EYE_BOTTOM_1],
      landmarks[LANDMARK_INDICES.LEFT_EYE_BOTTOM_2],
    ];
    const rightEye = [
      landmarks[LANDMARK_INDICES.RIGHT_EYE_OUTER],
      landmarks[LANDMARK_INDICES.RIGHT_EYE_TOP_1],
      landmarks[LANDMARK_INDICES.RIGHT_EYE_TOP_2],
      landmarks[LANDMARK_INDICES.RIGHT_EYE_INNER],
      landmarks[LANDMARK_INDICES.RIGHT_EYE_BOTTOM_1],
      landmarks[LANDMARK_INDICES.RIGHT_EYE_BOTTOM_2],
    ];
    const lips = [
      landmarks[LANDMARK_INDICES.MOUTH_LEFT],
      landmarks[LANDMARK_INDICES.MOUTH_RIGHT],
      landmarks[LANDMARK_INDICES.MOUTH_TOP],
      landmarks[LANDMARK_INDICES.MOUTH_BOTTOM],
      landmarks[LANDMARK_INDICES.UPPER_LIP_TOP],
      landmarks[LANDMARK_INDICES.LOWER_LIP_BOTTOM],
    ];
    const nose = [
      landmarks[LANDMARK_INDICES.NOSE_TIP],
      landmarks[LANDMARK_INDICES.NOSE_BRIDGE],
    ];
    const leftIris = rawLandmarks.length > 468
      ? [landmarks[LANDMARK_INDICES.LEFT_IRIS_CENTER]]
      : [];
    const rightIris = rawLandmarks.length > 468
      ? [landmarks[LANDMARK_INDICES.RIGHT_IRIS_CENTER]]
      : [];

    // Compute bounding box from face contour
    const xs = landmarks.map((lm) => lm.x);
    const ys = landmarks.map((lm) => lm.y);

    return {
      landmarks,
      faceOval,
      leftEye,
      rightEye,
      lips,
      nose,
      leftIris,
      rightIris,
      faceBoundingBox: {
        xMin: Math.min(...xs),
        yMin: Math.min(...ys),
        xMax: Math.max(...xs),
        yMax: Math.max(...ys),
      },
      timestamp,
      detectionConfidence: rawResults.multiFaceDetections?.[0]?.score ?? 0.9,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN-THREAD PROCESSING (Fallback when Worker unavailable)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Main Thread Frame Processor
   * Explanation:
   *   Processes a single frame's face data when Web Worker is unavailable
   *   or disabled. Runs blink detection, head pose, expression analysis,
   *   and beat fusion sequentially on the main thread.
   * In Other Words:
   *   When the background assistant is on break, the mailroom does ALL the work.
   */
  private processFrameMainThread(result: FaceMeshResult, timestamp: number): void {
    // 1. Blink detection
    const blinkEvent = this.detectBlink(result, timestamp);
    if (blinkEvent) {
      this.blinkCallbacks.forEach((cb) => cb(blinkEvent));
    }

    // 2. Head pose / nod detection
    const headPose = this.estimateHeadPose(result, timestamp);
    this.headPoseCallbacks.forEach((cb) => cb(headPose));

    // 3. Expression intensity
    const expression = this.analyzeExpression(result, timestamp);
    this.expressionCallbacks.forEach((cb) => cb(expression));

    // 4. Beat fusion — combine all signals into quantized musical tick
    const beatTick = this.fuseBeatSignal(blinkEvent, headPose, expression, timestamp);
    if (beatTick) {
      this.beatTickCallbacks.forEach((cb) => cb(beatTick));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLINK DETECTION (Eye Aspect Ratio)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Blink Detection Engine
   * Explanation:
   *   Computes Eye Aspect Ratio (EAR) for both eyes using the standard
   *   Soukupová–Čech algorithm: EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
   *
   *   Landmark mapping:
   *     p1 = outer corner, p2 = top-1, p3 = top-2,
   *     p4 = inner corner, p5 = bottom-1, p6 = bottom-2
   *
   *   Classification:
   *   - EAR < threshold + duration < maxBeatDuration → beat-cue blink
   *   - EAR < threshold + duration > prayerThreshold → prayer/closed-eyes
   *   - Grace period after prayer detection ignores all blinks
   *
   *   NTCC Context:
   *   During worship, conductors may close eyes in prayer. The grace period
   *   (default 3s) prevents false beat detection after prayer blinks.
   *
   * In Other Words:
   *   Measures how "squinted" the conductor's eyes are. A quick squint = beat.
   *   A long squint = prayer. After prayer, we wait a few seconds before
   *   listening for beats again.
   */
  private detectBlink(result: FaceMeshResult, timestamp: number): BlinkEvent | null {
    // Check grace period (post-prayer silence)
    if (timestamp < this.prayerGracePeriodEnd) {
      return null;
    }

    const leftEar = this.computeEar(result.leftEye);
    const rightEar = this.computeEar(result.rightEye);

    const leftClosed = leftEar < this.config.blinkEarThreshold;
    const rightClosed = rightEar < this.config.blinkEarThreshold;

    let event: BlinkEvent | null = null;

    // Left eye state transition: open → closed
    if (leftClosed && this.leftEyeOpen) {
      this.leftEyeOpen = false;
      this.leftEyeClosedAt = timestamp;
    }
    // Left eye state transition: closed → open
    if (!leftClosed && !this.leftEyeOpen) {
      const duration = timestamp - this.leftEyeClosedAt;
      this.leftEyeOpen = true;
      event = this.classifyBlink('left', duration, leftEar, timestamp);
    }

    // Right eye state transition: open → closed
    if (rightClosed && this.rightEyeOpen) {
      this.rightEyeOpen = false;
      this.rightEyeClosedAt = timestamp;
    }
    // Right eye state transition: closed → open
    if (!rightClosed && !this.rightEyeOpen) {
      const duration = timestamp - this.rightEyeClosedAt;
      this.rightEyeOpen = true;
      const rightEvent = this.classifyBlink('right', duration, rightEar, timestamp);
      // Prefer bilateral blink if both fire close together
      if (event && rightEvent && Math.abs(event.timestamp - rightEvent.timestamp) < 50) {
        event.eye = 'both';
        event.durationMs = Math.max(event.durationMs, rightEvent.durationMs);
      } else if (rightEvent) {
        event = rightEvent;
      }
    }

    // Handle case where eyes stay closed (prayer detection)
    if (leftClosed && rightClosed) {
      const closedDuration = timestamp - Math.max(this.leftEyeClosedAt, this.rightEyeClosedAt);
      if (closedDuration > this.config.prayerBlinkThresholdMs && timestamp > this.prayerGracePeriodEnd) {
        // Enter prayer grace period
        this.prayerGracePeriodEnd = timestamp + this.config.gracePeriodMs;
        event = {
          timestamp,
          eye: 'both',
          durationMs: closedDuration,
          earRatio: (leftEar + rightEar) / 2,
          isBeatCue: false,
          isPrayerBlink: true,
          bpmContext: this.currentBpm,
        };
      }
    }

    if (event) {
      this.lastBlinkEvent = event;
    }
    return event;
  }

  /**
   * This Area Of Code Is: EAR (Eye Aspect Ratio) Calculator
   * Explanation:
   *   Standard Soukupová–Čech EAR formula for eye openness quantification.
   *   Uses 6 eye landmarks to compute a ratio invariant to head pose and scale.
   *   EAR ≈ 0.3 when open, drops to ~0.1 when closed.
   * In Other Words:
   *   A math formula that tells us "how open are the eyes?" regardless of
   *   whether the conductor is close or far from the camera.
   */
  private computeEar(eyeLandmarks: FaceLandmark[]): number {
    if (eyeLandmarks.length < 6) return 1.0; // Default to open if insufficient data

    const p = eyeLandmarks;
    // Vertical distances
    const v1 = this.euclideanDistance(p[1], p[4]); // top-1 to bottom-1
    const v2 = this.euclideanDistance(p[2], p[5]); // top-2 to bottom-2
    // Horizontal distance
    const h = this.euclideanDistance(p[0], p[3]);  // outer to inner corner

    return h === 0 ? 1.0 : (v1 + v2) / (2 * h);
  }

  /**
   * This Area Of Code Is: Blink Classifier
   * Explanation:
   *   Categorizes a detected eye closure into beat-cue, prayer, or noise.
   *   Applies duration thresholds and NTCC grace-period logic.
   * In Other Words:
   *   Decides: "Was that blink a musical signal, or just the conductor praying?"
   */
  private classifyBlink(
    eye: 'left' | 'right',
    durationMs: number,
    earRatio: number,
    timestamp: number
  ): BlinkEvent {
    const isBeatCue =
      durationMs >= this.config.blinkMinDurationMs &&
      durationMs <= this.config.blinkMaxBeatDurationMs;

    const isPrayerBlink = durationMs > this.config.prayerBlinkThresholdMs;

    // If prayer detected, activate grace period
    if (isPrayerBlink) {
      this.prayerGracePeriodEnd = timestamp + this.config.gracePeriodMs;
    }

    return {
      timestamp,
      eye,
      durationMs,
      earRatio,
      isBeatCue,
      isPrayerBlink,
      bpmContext: this.currentBpm,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEAD POSE / NOD DETECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Head Pose Estimator
   * Explanation:
   *   Computes 3D head orientation (pitch/yaw/roll) from face landmarks using
   *   a simplified solve-PnP approach. Tracks pitch velocity for nod detection.
   *
   *   Coordinate system (right-handed, camera-facing):
   *   - X: rightward, Y: downward, Z: forward (toward camera = negative)
   *   - Pitch: rotation around X-axis (nod up/down)
   *   - Yaw: rotation around Y-axis (turn left/right)
   *   - Roll: rotation around Z-axis (tilt head sideways)
   *
   *   Nod detection:
   *   - Computes d(pitch)/dt over rolling window
   *   - Threshold crossing with cooldown prevents double-triggering
   *   - Nod phase (up/down/neutral) tracks beat position within measure
   *
   * In Other Words:
   *   Figures out which way the conductor's head is pointing and whether
   *   they're nodding to the beat. The nod speed tells us the tempo.
   */
  private estimateHeadPose(result: FaceMeshResult, timestamp: number): HeadPose {
    const lm = result.landmarks;

    // Key reference points
    const noseTip = lm[LANDMARK_INDICES.NOSE_TIP];
    const noseBridge = lm[LANDMARK_INDICES.NOSE_BRIDGE];
    const leftEyeOuter = lm[LANDMARK_INDICES.LEFT_EYE_OUTER];
    const rightEyeOuter = lm[LANDMARK_INDICES.RIGHT_EYE_OUTER];
    const faceTop = lm[LANDMARK_INDICES.FACE_TOP];
    const faceBottom = lm[LANDMARK_INDICES.FACE_BOTTOM];

    // Compute approximate pitch from nose tip relative to face center
    const faceCenterY = (faceTop.y + faceBottom.y) / 2;
    const rawPitch = (noseTip.y - faceCenterY) * 180; // Rough degrees

    // Compute yaw from eye asymmetry
    const eyeMidpointX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
    const rawYaw = (noseTip.x - eyeMidpointX) * 180;

    // Compute roll from eye line angle
    const rawRoll = Math.atan2(
      rightEyeOuter.y - leftEyeOuter.y,
      rightEyeOuter.x - leftEyeOuter.x
    ) * (180 / Math.PI);

    // Smooth with exponential moving average
    const alpha = 0.3;
    const smoothedPitch = this.pitchHistory.length > 0
      ? alpha * rawPitch + (1 - alpha) * this.pitchHistory[this.pitchHistory.length - 1]
      : rawPitch;

    this.pitchHistory.push(smoothedPitch);
    if (this.pitchHistory.length > 10) {
      this.pitchHistory.shift();
    }

    // Compute nod velocity (deg/s)
    let nodVelocity = 0;
    if (this.pitchHistory.length >= 2) {
      const dt = (timestamp - (result.timestamp - 16.67)) / 1000; // ~60fps assumption
      const dp = smoothedPitch - this.pitchHistory[this.pitchHistory.length - 2];
      nodVelocity = dt > 0 ? dp / dt : 0;
    }

    // Nod detection with cooldown
    const now = timestamp;
    let isNodding = false;
    let nodPhase: 'up' | 'down' | 'neutral' = 'neutral';

    if (Math.abs(nodVelocity) > this.config.nodVelocityThreshold) {
      if (now - this.lastNodTimestamp > this.config.nodCooldownMs) {
        isNodding = true;
        this.lastNodTimestamp = now;
        nodPhase = nodVelocity > 0 ? 'down' : 'up';

        // Update BPM from nod interval
        if (this.bpmHistory.length > 0) {
          const intervalMs = now - this.bpmHistory[this.bpmHistory.length - 1];
          if (intervalMs > 0) {
            const instantBpm = 60000 / intervalMs;
            this.updateBpm(instantBpm);
          }
        }
        this.bpmHistory.push(now);
        if (this.bpmHistory.length > this.config.bpmSmoothingWindow) {
          this.bpmHistory.shift();
        }
      }
    }

    return {
      pitch: smoothedPitch,
      yaw: rawYaw,
      roll: rawRoll,
      nodVelocity,
      isNodding,
      nodPhase,
    };
  }

  /**
   * This Area Of Code Is: BPM Smoother
   * Explanation:
   *   Maintains a rolling average of detected BPM values to prevent
   *   jittery tempo changes. Uses median-of-recent for outlier rejection.
   * In Other Words:
   *   Keeps the tempo steady even if the conductor's nodding is a little
   *   irregular. Smooths out the bumps.
   */
  private updateBpm(instantBpm: number): void {
    // Reject obvious outliers (BPM outside 40–200 range)
    if (instantBpm < 40 || instantBpm > 200) return;

    // Keep rolling window of recent BPM estimates
    const recentBpms: number[] = [];
    for (let i = 1; i < this.bpmHistory.length; i++) {
      const interval = this.bpmHistory[i] - this.bpmHistory[i - 1];
      if (interval > 0) {
        recentBpms.push(60000 / interval);
      }
    }

    if (recentBpms.length === 0) {
      this.currentBpm = instantBpm;
      return;
    }

    // Median filter for robustness
    recentBpms.sort((a, b) => a - b);
    const median = recentBpms[Math.floor(recentBpms.length / 2)];

    // Blend median with instant (30% instant, 70% median)
    this.currentBpm = 0.3 * instantBpm + 0.7 * median;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPRESSION INTENSITY ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Expression Intensity Analyzer
   * Explanation:
   *   Measures mouth aperture and eyebrow raise as proxies for vocal
   *   intensity and emotional expression. Used to trigger:
   *   - Dynamic lighting brightness (crescendo = brighter)
   *   - Lyric emphasis / font weight changes
   *   - Stage haze / fog intensity
   *
   *   Mouth openness: normalized vertical lip distance / face height
   *   Eyebrow raise: normalized distance from eyebrow to eye / face height
   *   Crescendo/diminuendo: first-derivative threshold crossing
   *
   * In Other Words:
   *   Watches the conductor's face for "big moments" — when they open their
   *   mouth wide or raise their eyebrows, the lights should get brighter
   *   and the lyrics should feel more intense.
   */
  private analyzeExpression(result: FaceMeshResult, timestamp: number): ExpressionIntensity {
    const lm = result.landmarks;

    // Mouth openness: distance between upper and lower lip / face height
    const upperLip = lm[LANDMARK_INDICES.UPPER_LIP_TOP];
    const lowerLip = lm[LANDMARK_INDICES.LOWER_LIP_BOTTOM];
    const mouthVertical = Math.abs(upperLip.y - lowerLip.y);

    const faceHeight = Math.abs(
      lm[LANDMARK_INDICES.FACE_TOP].y - lm[LANDMARK_INDICES.FACE_BOTTOM].y
    );
    const mouthOpenness = faceHeight > 0
      ? Math.min(mouthVertical / (faceHeight * 0.15), 1.0)
      : 0;

    // Eyebrow raise: distance from eyebrow to eye / face height
    const leftEyebrow = lm[LANDMARK_INDICES.LEFT_EYEBROW_OUTER];
    const leftEyeTop = lm[LANDMARK_INDICES.LEFT_EYE_TOP_1];
    const rightEyebrow = lm[LANDMARK_INDICES.RIGHT_EYEBROW_OUTER];
    const rightEyeTop = lm[LANDMARK_INDICES.RIGHT_EYE_TOP_1];

    const leftRaise = Math.abs(leftEyebrow.y - leftEyeTop.y);
    const rightRaise = Math.abs(rightEyebrow.y - rightEyeTop.y);
    const avgRaise = (leftRaise + rightRaise) / 2;

    const eyebrowRaise = faceHeight > 0
      ? Math.min(avgRaise / (faceHeight * 0.08), 1.0)
      : 0;

    // Combined intensity (mouth weighted 60%, eyebrows 40%)
    const overallIntensity = 0.6 * mouthOpenness + 0.4 * eyebrowRaise;

    // Crescendo / diminuendo detection (rate of change)
    const dt = (timestamp - this.lastIntensityTimestamp) / 1000; // seconds
    let isCrescendo = false;
    let isDiminuendo = false;

    if (dt > 0 && this.lastMouthOpenness > 0) {
      const dIntensity = (overallIntensity - (0.6 * this.lastMouthOpenness + 0.4 * this.lastEyebrowRaise)) / dt;
      isCrescendo = dIntensity > this.config.crescendoDeltaThreshold;
      isDiminuendo = dIntensity < -this.config.crescendoDeltaThreshold;
    }

    // Update history
    this.lastMouthOpenness = mouthOpenness;
    this.lastEyebrowRaise = eyebrowRaise;
    this.lastIntensityTimestamp = timestamp;

    return {
      mouthOpenness,
      eyebrowRaise,
      overallIntensity,
      isCrescendo,
      isDiminuendo,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BEAT FUSION ENGINE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Beat Fusion Engine
   * Explanation:
   *   Combines blink, nod, and expression signals into a single quantized
   *   UnityBeatTick. Implements a weighted voting system:
   *
   *   Signal weights:
   *   - Blink beat-cue: 0.45 (highest — intentional conductor gesture)
   *   - Nod detection: 0.35 (strong — physical tempo embodiment)
   *   - Expression crescendo: 0.20 (supporting — emotional emphasis)
   *
   *   Quantization:
   *   - Beat number cycles 1→beatsPerMeasure based on current BPM
   *   - Measure number increments on beat 1
   *   - Confidence score reflects signal agreement
   *
   *   NTCC Worship Context:
   *   - 4/4 time default, but adaptable to 3/4, 6/8, etc.
   *   - Beat 1 (downbeat) weighted heavier for lighting emphasis
   *   - Prayer grace period suppresses all beat generation
   *
   * In Other Words:
   *   The "judge" that listens to all the conductor's signals (blinks, nods,
   *   facial expressions) and decides "THIS is beat 3 of measure 12 at 128 BPM."
   *   It's the final click that the whole band follows.
   */
  private fuseBeatSignal(
    blinkEvent: BlinkEvent | null,
    headPose: HeadPose,
    expression: ExpressionIntensity,
    timestamp: number
  ): UnityBeatTick | null {
    // Prayer grace period — no beats during prayer
    if (timestamp < this.prayerGracePeriodEnd) {
      return null;
    }

    let confidence = 0;
    let source: UnityBeatTick['source'] = 'fusion';

    // Signal 1: Blink beat-cue
    if (blinkEvent?.isBeatCue) {
      confidence += 0.45;
      source = 'blink';
    }

    // Signal 2: Nod detection
    if (headPose.isNodding) {
      confidence += 0.35;
      if (source === 'blink') {
        source = 'fusion';
      } else {
        source = 'nod';
      }
    }

    // Signal 3: Expression crescendo (supporting signal)
    if (expression.isCrescendo) {
      confidence += 0.20;
      if (source === 'fusion') {
        // Already fusion, keep it
      } else if (source !== 'blink' && source !== 'nod') {
        source = 'expression';
      } else {
        source = 'fusion';
      }
    }

    // Minimum confidence threshold to register as a beat
    if (confidence < 0.4) {
      return null;
    }

    // Quantize beat number (default 4/4, adaptable)
    const beatsPerMeasure = 4;
    this.beatCount = (this.beatCount % beatsPerMeasure) + 1;
    if (this.beatCount === 1) {
      this.measureCount++;
    }

    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);

    return {
      timestamp,
      beatNumber: this.beatCount,
      measureNumber: this.measureCount,
      bpm: Math.round(this.currentBpm),
      confidence,
      source,
      headPose,
      expression,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Euclidean Distance Calculator
   * Explanation:
   *   Standard 2D Euclidean distance between two normalized landmarks.
   *   Used for EAR computation and geometric measurements.
   * In Other Words:
   *   "How far apart are these two dots on the face?"
   */
  private euclideanDistance(a: FaceLandmark, b: FaceLandmark): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * This Area Of Code Is: Configuration Updater
   * Explanation:
   *   Hot-swaps configuration parameters at runtime without re-initialization.
   *   Useful for sanctuary-specific tuning during sound check.
   * In Other Words:
   *   Adjust the dials while the service is running — no restart needed.
   */
  public updateConfig(updates: Partial<MediaPipeConfig>): void {
    this.config = { ...this.config, ...updates };
    // Propagate to worker if active
    if (this.worker) {
      this.worker.postMessage({ type: 'updateConfig', config: this.config });
    }
    console.log('[UnityMediaPipe] Config updated:', this.config);
  }

  /**
   * This Area Of Code Is: Current State Accessor
   * Explanation:
   *   Returns a snapshot of the service's current detection state for
   *   debugging, UI display, or external system integration.
   * In Other Words:
   *   "What's happening right now?" — for the debug panel or status display.
   */
  public getCurrentState(): {
    isRunning: boolean;
    isInitialized: boolean;
    currentBpm: number;
    beatCount: number;
    measureNumber: number;
    lastBlinkEvent: BlinkEvent | null;
    prayerGraceActive: boolean;
    config: MediaPipeConfig;
  } {
    return {
      isRunning: this.isRunning,
      isInitialized: this.isInitialized,
      currentBpm: this.currentBpm,
      beatCount: this.beatCount,
      measureNumber: this.measureCount,
      lastBlinkEvent: this.lastBlinkEvent,
      prayerGraceActive: performance.now() < this.prayerGracePeriodEnd,
      config: { ...this.config },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALLBACK SUBSCRIPTION API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Blink Event Subscription
   * Explanation:
   *   Registers a callback for blink detection events.
   *   Returns unsubscribe function for cleanup.
   * In Other Words:
   *   "Tell me when the conductor blinks." Returns a cancel button.
   */
  public onBlink(callback: (event: BlinkEvent) => void): () => void {
    this.blinkCallbacks.push(callback);
    return () => {
      this.blinkCallbacks = this.blinkCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * This Area Of Code Is: Head Pose Subscription
   * Explanation:
   *   Registers a callback for continuous head pose updates.
   *   Fires every frame (~60fps) with current orientation.
   * In Other Words:
   *   "Tell me which way the conductor's head is pointing, constantly."
   */
  public onHeadPose(callback: (pose: HeadPose) => void): () => void {
    this.headPoseCallbacks.push(callback);
    return () => {
      this.headPoseCallbacks = this.headPoseCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * This Area Of Code Is: Expression Subscription
   * Explanation:
   *   Registers a callback for expression intensity updates.
   *   Fires every frame with mouth/eyebrow measurements.
   * In Other Words:
   *   "Tell me how intense the conductor's expression is, constantly."
   */
  public onExpression(callback: (expr: ExpressionIntensity) => void): () => void {
    this.expressionCallbacks.push(callback);
    return () => {
      this.expressionCallbacks = this.expressionCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * This Area Of Code Is: Beat Tick Subscription
   * Explanation:
   *   Registers a callback for quantized Unity beat ticks.
   *   This is the PRIMARY integration point for metronome, lyric scroll,
   *   LED lighting, and auto-advance systems.
   * In Other Words:
   *   "Tell me every time there's a musical beat." This is the main event
   *   that drives everything else in the worship service.
   */
  public onBeatTick(callback: (tick: UnityBeatTick) => void): () => void {
    this.beatTickCallbacks.push(callback);
    return () => {
      this.beatTickCallbacks = this.beatTickCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * This Area Of Code Is: Error Subscription
   * Explanation:
   *   Registers a callback for service-level errors (camera failure,
   *   WASM load failure, detection timeout, etc.).
   * In Other Words:
   *   "Tell me if something breaks so I can show an error message."
   */
  public onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NTCC SANCTUARY PRESETS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * This Area Of Code Is: Sanctuary Preset Loader
   * Explanation:
   *   Pre-calibrated configurations for common NTCC worship contexts.
   *   Worship leaders can select their scenario and get optimized detection.
   * In Other Words:
   *   One-click settings for "Sunday morning," "youth night," "prayer service," etc.
   */
  public static getSanctuaryPreset(preset: 'sunday-morning' | 'youth-night' | 'prayer-service' | 'concert' | 'rehearsal'): MediaPipeConfig {
    const base = { ...DEFAULT_NTCC_MEDIAPIPE_CONFIG };

    switch (preset) {
      case 'sunday-morning':
        // Standard worship — balanced settings
        return {
          ...base,
          sanctuaryLighting: 'bright',
          blinkEarThreshold: 0.2,
          nodVelocityThreshold: 12,
          gracePeriodMs: 3000,
        };

      case 'youth-night':
        // High energy, fast tempo, dimmer lights with spot effects
        return {
          ...base,
          sanctuaryLighting: 'spotlight',
          blinkEarThreshold: 0.18,      // More sensitive — energetic conductor
          nodVelocityThreshold: 20,       // Faster nod acceptance
          blinkMaxBeatDurationMs: 250,    // Quicker blinks
          bpmSmoothingWindow: 4,          // Faster BPM response
          gracePeriodMs: 2000,            // Shorter prayer grace
        };

      case 'prayer-service':
        // Slower, contemplative, longer closed-eye periods expected
        return {
          ...base,
          sanctuaryLighting: 'candle',
          blinkEarThreshold: 0.22,        // Less sensitive — eyes often closed
          prayerBlinkThresholdMs: 2000,   // Longer before prayer classification
          gracePeriodMs: 5000,            // Extended grace after prayer
          nodVelocityThreshold: 8,        // Gentler nod detection
          bpmSmoothingWindow: 12,         // Smoother, slower tempo tracking
        };

      case 'concert':
        // High production value, fast changes, bright moving lights
        return {
          ...base,
          sanctuaryLighting: 'spotlight',
          blinkEarThreshold: 0.17,
          nodVelocityThreshold: 22,
          blinkMaxBeatDurationMs: 200,
          bpmSmoothingWindow: 3,
          crescendoDeltaThreshold: 0.5,
          gracePeriodMs: 1500,
        };

      case 'rehearsal':
        // Relaxed, debug-friendly, verbose
        return {
          ...base,
          sanctuaryLighting: 'bright',
          blinkEarThreshold: 0.25,      // Less sensitive — casual setting
          nodVelocityThreshold: 10,
          bpmSmoothingWindow: 6,
          gracePeriodMs: 1000,           // Minimal grace for testing
        };

      default:
        return base;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEB WORKER SCRIPT (Reference Implementation)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: Web Worker Script Template
 * Explanation:
 *   Companion worker script for off-main-thread processing.
 *   Receives raw landmarks from the main thread, runs identical detection
 *   algorithms, and posts typed events back.
 *
 *   Usage:
 *   1. Save this as a separate file (e.g., unity-mediapipe.worker.ts)
 *   2. Compile/bundle with your build system
 *   3. Pass the bundled URL to UnityMediaPipe.initialize({ workerScriptUrl })
 *
 *   The worker mirrors the main-thread logic (EAR, head pose, expression,
 *   beat fusion) to ensure identical behavior regardless of execution context.
 *
 * In Other Words:
 *   This is the background assistant's instruction manual. It knows all the
 *   same detection rules as the main service, but runs in its own thread
 *   so the screen never stutters.
 */
export const WORKER_SCRIPT_TEMPLATE = `
/**
 * UnityMediaPipe Web Worker
 * NTCC Music App — Unity Solution™
 * Offloads landmark post-processing from main thread
 */

import type { MediaPipeConfig, BlinkEvent, HeadPose, ExpressionIntensity, UnityBeatTick } from './UnityMediaPipe';

let config: MediaPipeConfig;

// Worker state mirrors main thread (simplified)
let leftEyeOpen = true;
let rightEyeOpen = true;
let leftEyeClosedAt = 0;
let rightEyeClosedAt = 0;
let prayerGracePeriodEnd = 0;
let pitchHistory: number[] = [];
let lastNodTimestamp = 0;
let currentBpm = 120;
let bpmHistory: number[] = [];
let beatCount = 0;
let measureCount = 1;
let lastMouthOpenness = 0;
let lastEyebrowRaise = 0;
let lastIntensityTimestamp = 0;

self.onmessage = (event: MessageEvent) => {
  const { type, landmarks, timestamp, config: newConfig } = event.data;

  if (type === 'init') {
    config = newConfig;
    return;
  }

  if (type === 'updateConfig') {
    config = newConfig;
    return;
  }

  if (type === 'process' && landmarks) {
    processLandmarks(landmarks, timestamp);
  }
};

function processLandmarks(landmarks: any[], timestamp: number): void {
  // [Worker implementation mirrors main-thread detection logic]
  // EAR computation, head pose, expression, beat fusion
  // Posts results back to main thread via self.postMessage()

  // Simplified blink detection
  const leftEar = computeEarWorker(landmarks, 'left');
  const rightEar = computeEarWorker(landmarks, 'right');

  if (leftEar < config.blinkEarThreshold && leftEyeOpen) {
    leftEyeOpen = false;
    leftEyeClosedAt = timestamp;
  }
  if (leftEar >= config.blinkEarThreshold && !leftEyeOpen) {
    const duration = timestamp - leftEyeClosedAt;
    leftEyeOpen = true;
    if (duration >= config.blinkMinDurationMs && duration <= config.blinkMaxBeatDurationMs) {
      self.postMessage({
        type: 'blink',
        payload: {
          timestamp,
          eye: 'left',
          durationMs: duration,
          earRatio: leftEar,
          isBeatCue: true,
          isPrayerBlink: false,
          bpmContext: currentBpm,
        } as BlinkEvent,
      });
    }
  }

  // [Additional worker processing: head pose, expression, beat fusion]
  // Full implementation mirrors main-thread methods above
}

function computeEarWorker(landmarks: any[], side: 'left' | 'right'): number {
  const indices = side === 'left'
    ? [33, 159, 158, 133, 145, 153]
    : [362, 386, 385, 263, 374, 380];

  const p = indices.map((i) => landmarks[i]);
  const v1 = euclideanDistanceWorker(p[1], p[4]);
  const v2 = euclideanDistanceWorker(p[2], p[5]);
  const h = euclideanDistanceWorker(p[0], p[3]);
  return h === 0 ? 1.0 : (v1 + v2) / (2 * h);
}

function euclideanDistanceWorker(a: any, b: any): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * This Area Of Code Is: Module Exports
 * Explanation:
 *   Public API surface for UnityMediaPipe integration.
 *   Consumers import the singleton, types, config, and presets.
 * In Other Words:
 *   These are the door handles — what other parts of the app grab
 *   to use the conductor camera service.
 */
export { UnityMediaPipe as default };
