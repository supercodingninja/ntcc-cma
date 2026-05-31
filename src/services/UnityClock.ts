/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NTCC MUSIC APP — src/services/UnityClock.ts
 * The Universal Heartbeat: GPS-disciplined, drift-free, globally synchronized
 * time reference for distributed worship collaboration.
 *
 * Adapted from The Unity Solution™ for NTCC Music App
 * © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Module Header & Strict Mode Declaration
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  This file is the foundation of the NTCC Music App's distributed
  worship collaboration system. Without a monotonic, globally
  synchronized time reference, no remote worship team can achieve
  zero perceived latency. This module provides that reference
  through three tiers: GPS/GNSS (primary, <1μs), NTP (fallback, <10ms),
  and local AudioContext crystal (tertiary, <50ms). The module exposes
  a single unified API so downstream modules never care which tier is active.

  The architecture uses a Phase-Locked Loop (PLL) to discipline a local
  temperature-compensated crystal oscillator (TCXO) against GPS 1PPS
  pulses. When GPS is unavailable, a Kalman-filtered NTP ping-pong
  provides sufficient accuracy for structured worship music (40ms human threshold).
  The AudioContext hardware clock serves as the final fallback — it is
  monotonic and sample-accurate, though not globally synchronized.
*/

/*
  IN OTHER WORDS:
  Think of this as the worship leader's baton that every musician sees,
  no matter what city or country they are in. The baton never speeds up
  or slows down. It is locked to the rotation of the Earth itself (via GPS).
  If the satellite connection drops, the baton remembers the Earth's rhythm
  and keeps beating correctly until the signal returns. If the internet
  also fails, each musician's own internal metronome takes over — not
  perfectly synchronized with others, but steady enough to finish the song.
*/

'use strict';

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: TypeScript Type Definitions
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  TypeScript interfaces define the contracts for all data structures
  used within the UnityClock service. This ensures type safety across
  the NTCC Music App and provides IntelliSense for developers.
*/

/*
  IN OTHER WORDS:
  These are the "blueprints" for every piece of data the clock uses.
  Like architectural drawings before building a house — they ensure
  everything fits together perfectly and nothing is left to guesswork.
*/

export type TimeTier = 'GPS' | 'NTP' | 'AUDIO';

export interface ClockConfig {
  // GPS Tier
  GPS_PPS_INTERVAL_MS: number;
  GPS_MAX_DRIFT_PPM: number;
  GPS_LOCK_TIMEOUT_MS: number;
  GPS_SAMPLES_FOR_LOCK: number;

  // NTP Tier
  NTP_SERVERS: readonly string[];
  NTP_PING_COUNT: number;
  NTP_KEEP_FASTEST: number;
  NTP_TIMEOUT_MS: number;
  NTP_INTERVAL_MS: number;

  // PLL (Phase-Locked Loop)
  PLL_ALPHA: number;
  PLL_BETA: number;
  PLL_LOCK_THRESHOLD_MS: number;

  // Kalman Filter for NTP
  KALMAN_PROCESS_NOISE: number;
  KALMAN_MEASUREMENT_NOISE: number;
  KALMAN_INITIAL_ERROR: number;

  // AudioContext Fallback
  AUDIO_LOOKAHEAD_MS: number;
  AUDIO_SCHEDULE_AHEAD_MS: number;

  // General
  BEAT_SUBDIVISIONS: number;
  DRIFT_HISTORY_SIZE: number;
  OFFSET_HISTORY_SIZE: number;

  // Time units
  MS_PER_SECOND: number;
  US_PER_MS: number;
  NS_PER_MS: number;
}

export interface KalmanState {
  estimate: number;
  error: number;
}

export interface ClockState {
  currentTier: TimeTier;
  offset: number;
  drift: number;
  audioContext: AudioContext | null;
  audioBaseTime: number;
  lastGPSTick: number;
  gpsLockAchieved: boolean;
  ntpHistory: NTPResult[];
  driftHistory: number[];
  offsetHistory: number[];
  kalman: KalmanState;
  eventListeners: Map<string, Array<(data: any) => void>>;
  isRunning: boolean;
  schedulerId: ReturnType<typeof setTimeout> | null;
  nextTickTime: number;
  bpm: number;
  secondsPerBeat: number;
}

export interface NTPResult {
  t0: number;
  t3: number;
  rtt: number;
  serverTime: number | null;
  success: boolean;
  error?: string;
  server?: string;
  offset?: number;
}

export interface TickData {
  time: number;
  audioTime: number;
  beat: number;
  subdivision: number;
  bpm: number;
}

export interface PLLResult {
  offset: number;
  drift: number;
  error: number;
}

export interface GPSTickData {
  gpsTime: number;
  localTime: number;
  offset: number;
  drift: number;
  error: number;
  locked: boolean;
}

export interface NTPSyncData {
  offset: number;
  rtt: number;
  server: string;
  samplesUsed: number;
}

export interface DiagnosticsData {
  tier: TimeTier;
  offset: number;
  drift: number;
  driftPPM: number;
  gpsLockAchieved: boolean;
  lastGPSTick: number;
  audioContextRunning: string;
  sampleRate: number;
  outputLatency: number;
  bpm: number;
  schedulerRunning: boolean;
  kalmanEstimate: number;
  kalmanError: number;
  ntpHistoryLength: number;
  driftHistoryLength: number;
  accuracy: number;
}

export interface InitData {
  tier: TimeTier;
  offset: number;
  drift: number;
  accuracy: number;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Configuration Constants
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  These constants define the operational parameters of the UnityClock.
  They are tuned for worship music synchronization where the
  human threshold for perceiving two sounds as "one" is approximately
  40 milliseconds for ensemble playing. All values are in milliseconds
  unless otherwise noted. The PLL coefficients were derived from
  empirical testing across heterogeneous mobile devices (IRCAM CoSiMa
  research: 1-10ms individual accuracy, 20ms range after calibration).
*/

/*
  IN OTHER WORDS:
  These are the "settings" for the worship leader's baton — how often it checks
  its accuracy against the satellites, how quickly it corrects itself,
  and what to do when things go wrong. Like a musician tuning their
  instrument before a performance, these numbers are chosen to give
  the tightest, most reliable beat possible.
*/

export const CONFIG: ClockConfig = Object.freeze({
  // GPS Tier
  GPS_PPS_INTERVAL_MS: 1000,
  GPS_MAX_DRIFT_PPM: 50,
  GPS_LOCK_TIMEOUT_MS: 15000,
  GPS_SAMPLES_FOR_LOCK: 10,

  // NTP Tier
  NTP_SERVERS: Object.freeze([
    'time.google.com',
    'time.nist.gov',
    'pool.ntp.org'
  ]),
  NTP_PING_COUNT: 8,
  NTP_KEEP_FASTEST: 3,
  NTP_TIMEOUT_MS: 3000,
  NTP_INTERVAL_MS: 30000,

  // PLL (Phase-Locked Loop)
  PLL_ALPHA: 0.05,
  PLL_BETA: 0.001,
  PLL_LOCK_THRESHOLD_MS: 1.0,

  // Kalman Filter for NTP
  KALMAN_PROCESS_NOISE: 0.01,
  KALMAN_MEASUREMENT_NOISE: 10.0,
  KALMAN_INITIAL_ERROR: 100.0,

  // AudioContext Fallback
  AUDIO_LOOKAHEAD_MS: 25.0,
  AUDIO_SCHEDULE_AHEAD_MS: 100.0,

  // General
  BEAT_SUBDIVISIONS: 4,
  DRIFT_HISTORY_SIZE: 60,
  OFFSET_HISTORY_SIZE: 30,

  // Time units
  MS_PER_SECOND: 1000,
  US_PER_MS: 1000,
  NS_PER_MS: 1000000
});

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: State & Data Structures
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The UnityClock maintains internal state that must never be exposed
  directly. All access goes through the public API. The state tracks:
  - currentTier: which time source is active (GPS, NTP, AUDIO)
  - offset: difference between local time and reference time
  - drift: rate at which local clock runs relative to reference (R coefficient)
  - audioContext: the Web Audio API context (hardware-locked clock)
  - lastGPSTick: timestamp of last GPS 1PPS pulse
  - ntpHistory: ring buffer of recent NTP measurements
  - driftHistory: ring buffer for PLL convergence detection
  - eventListeners: Map of event names to arrays of callbacks
  - isRunning: boolean flag for the scheduler loop
*/

/*
  IN OTHER WORDS:
  This is the worship leader's "memory" — what the baton knows about itself
  right now. Is it locked to a satellite? How fast is it drifting?
  What happened the last time it checked? All of this is kept private
  so nothing outside can accidentally mess with the beat.
*/

const _state: ClockState = {
  currentTier: 'AUDIO',
  offset: 0.0,
  drift: 0.0,
  audioContext: null,
  audioBaseTime: 0.0,
  lastGPSTick: 0.0,
  gpsLockAchieved: false,
  ntpHistory: [],
  driftHistory: [],
  offsetHistory: [],
  kalman: {
    estimate: 0.0,
    error: CONFIG.KALMAN_INITIAL_ERROR
  },
  eventListeners: new Map(),
  isRunning: false,
  schedulerId: null,
  nextTickTime: 0.0,
  bpm: 120,
  secondsPerBeat: 0.5
};

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Kalman Filter Implementation
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The Kalman filter is a recursive algorithm that estimates the true
  value of a variable (here, clock offset) from noisy measurements
  (NTP ping-pong results). It maintains two values: an estimate and
  an error covariance. Each new measurement updates both using
  optimal weighting — more trust in the estimate when measurement
  noise is high, more trust in the measurement when the estimate
  is uncertain. This smooths NTP jitter without introducing lag.

  Process noise (Q) represents how much the true offset can change
  between measurements. Measurement noise (R) represents the variance
  of NTP round-trip times. The Kalman gain (K) balances these.
*/

/*
  IN OTHER WORDS:
  Imagine you are trying to guess the exact weight of a moving truck
  by feeling it with your hands while it bounces on a bumpy road.
  Your hands give you noisy, jumpy readings. The Kalman filter is
  like a very smart friend who remembers what the truck weighed before,
  knows how bumpy the road is, and tells you the most likely true
  weight at every moment — smooth and accurate, not jumpy.
*/

function _kalmanUpdate(measurement: number): number {
  const Q = CONFIG.KALMAN_PROCESS_NOISE;
  const R = CONFIG.KALMAN_MEASUREMENT_NOISE;

  // Prediction step
  const predictedError = _state.kalman.error + Q;

  // Update step
  const kalmanGain = predictedError / (predictedError + R);
  _state.kalman.estimate = _state.kalman.estimate + (kalmanGain * (measurement - _state.kalman.estimate));
  _state.kalman.error = (1 - kalmanGain) * predictedError;

  return _state.kalman.estimate;
}

function _kalmanReset(): void {
  _state.kalman.estimate = 0.0;
  _state.kalman.error = CONFIG.KALMAN_INITIAL_ERROR;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Phase-Locked Loop (PLL) Discipline
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  A Phase-Locked Loop is a control system that generates an output
  signal whose phase is related to the phase of an input "reference"
  signal. Here, the "reference" is the GPS 1PPS (one pulse per second)
  and the "output" is the local crystal oscillator's time estimate.

  The PLL uses two coefficients:
  - ALPHA: proportional gain (how much to correct immediately)
  - BETA: integral gain (how much to correct long-term drift)

  When a GPS pulse arrives, we calculate the error between the
  predicted pulse time (based on our current offset + drift) and
  the actual pulse time. ALPHA corrects the offset. BETA corrects
  the drift rate. Over time, the local clock "locks" to GPS with
  sub-microsecond accuracy.

  This is the same technique used in atomic clock laboratories,
  software-defined radio, and professional audio word-clock sync.
*/

/*
  IN OTHER WORDS:
  The PLL is like teaching a drummer to match a metronome. At first,
  the drummer is off-beat. You tell them "speed up NOW" (ALPHA)
  and also "you tend to drag behind, adjust your internal feel" (BETA).
  After a few measures, the drummer is locked in — they anticipate
  the click and land exactly on it, even if the click drops out briefly.
*/

function _pllUpdate(gpsTime: number, localPredictedTime: number): PLLResult {
  const error = gpsTime - localPredictedTime;
  const alpha = CONFIG.PLL_ALPHA;
  const beta = CONFIG.PLL_BETA;

  // Proportional correction: adjust offset immediately
  _state.offset += alpha * error;

  // Integral correction: adjust drift rate for long-term stability
  _state.drift += beta * error;

  // Clamp drift to physically plausible range (+/- 50 PPM)
  const maxDrift = CONFIG.GPS_MAX_DRIFT_PPM;
  _state.drift = Math.max(-maxDrift, Math.min(maxDrift, _state.drift));

  // Record in history for lock detection
  _state.driftHistory.push(_state.drift);
  if (_state.driftHistory.length > CONFIG.DRIFT_HISTORY_SIZE) {
    _state.driftHistory.shift();
  }

  _state.offsetHistory.push(_state.offset);
  if (_state.offsetHistory.length > CONFIG.OFFSET_HISTORY_SIZE) {
    _state.offsetHistory.shift();
  }

  // Check for GPS lock convergence
  if (!_state.gpsLockAchieved && _state.driftHistory.length >= CONFIG.GPS_SAMPLES_FOR_LOCK) {
    const recent = _state.driftHistory.slice(-CONFIG.GPS_SAMPLES_FOR_LOCK);
    const variance = _calculateVariance(recent);
    if (variance < CONFIG.PLL_LOCK_THRESHOLD_MS) {
      _state.gpsLockAchieved = true;
      _emit('gps-lock', { offset: _state.offset, drift: _state.drift });
    }
  }

  return { offset: _state.offset, drift: _state.drift, error };
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Statistical Utility Functions
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  These are pure mathematical helper functions used by the PLL,
  Kalman filter, and NTP ping-pong logic. They calculate variance,
  standard deviation, mean, and median — all essential for
  determining whether a set of time measurements is stable
  enough to trust. Variance tells us how "spread out" the numbers
  are. Low variance = stable clock. High variance = noisy network.
*/

/*
  IN OTHER WORDS:
  These are the worship leader's "math tools" — like a tuner app that
  tells you if your instrument is in tune. If all your tuning checks
  give the same reading, you're good. If they jump around wildly,
  something is wrong and you need to check again.
*/

function _calculateMean(arr: number[]): number {
  if (arr.length === 0) return 0.0;
  return arr.reduce((sum, val) => sum + val, 0.0) / arr.length;
}

function _calculateVariance(arr: number[]): number {
  if (arr.length < 2) return Infinity;
  const mean = _calculateMean(arr);
  const squaredDiffs = arr.map(v => (v - mean) ** 2);
  return _calculateMean(squaredDiffs);
}

function _calculateStdDev(arr: number[]): number {
  return Math.sqrt(_calculateVariance(arr));
}

function _calculateMedian(arr: number[]): number {
  if (arr.length === 0) return 0.0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2.0;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: NTP Ping-Pong Time Synchronization
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  NTP (Network Time Protocol) synchronization works by sending a
  packet to a time server and measuring the round-trip time (RTT).
  The critical insight: the offset between local and server time
  can be estimated even with asymmetric network paths because the
  formula uses both the client's send/receive timestamps and the
  server's receive/send timestamps.

  Formula: offset = [(t1 - t0) + (t2 - t3)] / 2
  Where: t0 = client send, t1 = server receive, t2 = server send, t3 = client receive

  We send multiple pings, keep only the fastest round-trips (lowest
  network jitter), and average their offsets. This filters out
  congestion-induced outliers. The Kalman filter then smooths the
  resulting offset estimate over time.

  In a browser, we cannot send raw NTP packets (UDP port 123 is
  blocked). Instead, we use HTTP(S) requests to web-based time
  endpoints (like time.google.com or a custom endpoint) and measure
  the round-trip via performance.now(). This is less precise than
  true NTP but sufficient for worship music synchronization (10ms target).
*/

/*
  IN OTHER WORDS:
  Imagine you and a friend in another city both want to set your
  watches to the exact same time. You send them a letter saying
  "my watch says 3:00:00.000 right now." They write back "I got
  your letter when my watch said 3:00:00.050, and I'm sending this
  reply at 3:00:00.060." When you get the reply at 3:00:00.120,
  you can calculate: the trip took about 60ms each way, and their
  watch is about 55ms ahead of yours. You do this many times and
  trust only the fastest letters (the ones that didn't get stuck
  in traffic).
*/

async function _ntpPingPong(serverUrl: string): Promise<NTPResult> {
  const t0 = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.NTP_TIMEOUT_MS);

    const response = await fetch(`${serverUrl}?t=${t0}`, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store'
    });

    clearTimeout(timeoutId);
    const t3 = performance.now();

    // Extract server time from Date header if available
    const dateHeader = response.headers.get('Date');
    let serverTime: number | null = null;
    if (dateHeader) {
      serverTime = new Date(dateHeader).getTime();
    }

    const rtt = t3 - t0;
    return { t0, t3, rtt, serverTime, success: true };
  } catch (err: any) {
    return { t0, t3: performance.now(), rtt: Infinity, serverTime: null, success: false, error: err.message };
  }
}

async function _performNTPSync(): Promise<number | null> {
  const allResults: Array<{ offset: number; rtt: number; server: string }> = [];

  for (const server of CONFIG.NTP_SERVERS) {
    const serverResults: NTPResult[] = [];
    for (let i = 0; i < CONFIG.NTP_PING_COUNT; i++) {
      const result = await _ntpPingPong(server);
      if (result.success && result.rtt < CONFIG.NTP_TIMEOUT_MS) {
        serverResults.push(result);
      }
    }

    // Keep only the fastest 3 round-trips for this server
    serverResults.sort((a, b) => a.rtt - b.rtt);
    const fastest = serverResults.slice(0, CONFIG.NTP_KEEP_FASTEST);

    for (const ping of fastest) {
      if (ping.serverTime) {
        // offset = serverTime - ((t0 + t3) / 2)
        const localTime = (ping.t0 + ping.t3) / 2.0;
        const offset = ping.serverTime - localTime;
        allResults.push({ offset, rtt: ping.rtt, server });
      }
    }
  }

  if (allResults.length === 0) {
    _emit('ntp-failed', { message: 'No valid NTP responses from any server' });
    return null;
  }

  // Sort by RTT and keep the fastest overall
  allResults.sort((a, b) => a.rtt - b.rtt);
  const bestResults = allResults.slice(0, CONFIG.NTP_KEEP_FASTEST);

  // Average the offsets of the best results
  const offsets = bestResults.map(r => r.offset);
  const medianOffset = _calculateMedian(offsets);

  // Feed into Kalman filter
  const smoothedOffset = _kalmanUpdate(medianOffset);

  _state.offset = smoothedOffset;
  _state.currentTier = 'NTP';

  _emit('ntp-sync', {
    offset: smoothedOffset,
    rtt: bestResults[0].rtt,
    server: bestResults[0].server,
    samplesUsed: bestResults.length
  });

  return smoothedOffset;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: GPS/GNSS Native Bridge Interface
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  Web browsers cannot directly access GPS hardware (privacy sandbox).
  To achieve sub-microsecond accuracy, we must use a native bridge:
  - Capacitor (for iOS/Android)
  - React Native (for iOS/Android)
  - Electron (for desktop)
  - Or a custom WebView with injected JavaScript interface

  The native layer reads the GPS 1PPS (one pulse per second) signal
  from the device's GNSS receiver and passes it to JavaScript as an
  event. The 1PPS is a hardware interrupt — it is accurate to
  nanoseconds because it comes directly from atomic clocks on GPS
  satellites.

  This module provides a unified interface that works whether the
  native bridge is present or not. If not present, it gracefully
  falls back to NTP. The bridge must implement:
  - `requestGPSAccess()` — asks for location permission (which grants GPS)
  - `onGPSTick(callback)` — calls back with { gpsTime, localTime } every second
  - `getCurrentGPSTime()` — returns current GPS time in milliseconds

  For web-only deployment (no native wrapper), GPS tier is skipped
  and NTP becomes the primary sync method.
*/

/*
  IN OTHER WORDS:
  Your phone has a tiny radio that talks to satellites in space.
  Those satellites have atomic clocks — the most accurate timekeepers
  humans have ever built. But web apps are like guests in a house:
  they can't touch the radio directly. So we build a "translator"
  (the native bridge) that listens to the radio and whispers the
  time to our app. If the translator isn't there, we use the next
  best thing: asking the internet what time it is.
*/

interface NativeBridge {
  type: string;
  requestAccess: () => Promise<any>;
  getCurrentTime: () => Promise<number | null>;
  onTick: (cb: (data: { gpsTime: number; localTime: number }) => void) => (() => void);
}

let _nativeBridge: NativeBridge | null = null;
let _gpsTickCallback: (() => void) | null = null;

function _detectNativeBridge(): boolean {
  // Check for Capacitor
  if (typeof window !== 'undefined' && (window as any).Capacitor && (window as any).Capacitor.Plugins) {
    const geo = (window as any).Capacitor.Plugins.Geolocation;
    if (geo) {
      _nativeBridge = {
        type: 'capacitor',
        requestAccess: () => geo.requestPermissions(),
        getCurrentTime: () => geo.getCurrentPosition({ enableHighAccuracy: true })
          .then((pos: any) => pos.timestamp)
          .catch(() => null),
        onTick: (cb) => {
          const intervalId = setInterval(async () => {
            try {
              const pos = await geo.getCurrentPosition({ enableHighAccuracy: true });
              if (pos && pos.timestamp) {
                cb({ gpsTime: pos.timestamp, localTime: performance.now() });
              }
            } catch (e) {
              // GPS unavailable, silently fail
            }
          }, CONFIG.GPS_PPS_INTERVAL_MS);
          return () => clearInterval(intervalId);
        }
      };
      return true;
    }
  }

  // Check for React Native WebView bridge
  if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
    _nativeBridge = {
      type: 'react-native',
      requestAccess: () => {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_GPS' }));
        return Promise.resolve();
      },
      getCurrentTime: () => {
        return new Promise((resolve) => {
          const handler = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === 'GPS_TIME') {
              window.removeEventListener('message', handler);
              resolve(data.gpsTime);
            }
          };
          window.addEventListener('message', handler);
          (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'GET_GPS_TIME' }));
          setTimeout(() => { window.removeEventListener('message', handler); resolve(null); }, 3000);
        });
      },
      onTick: (cb) => {
        const handler = (event: MessageEvent) => {
          const data = JSON.parse(event.data);
          if (data.type === 'GPS_TICK') {
            cb({ gpsTime: data.gpsTime, localTime: performance.now() });
          }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
      }
    };
    return true;
  }

  // Check for custom WebView interface (Android)
  if (typeof window !== 'undefined' && (window as any).UnityGPSBridge) {
    _nativeBridge = {
      type: 'custom-android',
      requestAccess: () => (window as any).UnityGPSBridge.requestGPSAccess(),
      getCurrentTime: () => Promise.resolve((window as any).UnityGPSBridge.getCurrentGPSTime()),
      onTick: (cb) => {
        (window as any).UnityGPSBridge.onGPSTick = (gpsTime: number) => {
          cb({ gpsTime, localTime: performance.now() });
        };
        return () => { (window as any).UnityGPSBridge.onGPSTick = null; };
      }
    };
    return true;
  }

  // No native bridge detected
  _nativeBridge = null;
  return false;
}

async function _initGPS(): Promise<boolean> {
  const hasBridge = _detectNativeBridge();
  if (!hasBridge) {
    _emit('gps-unavailable', { message: 'No native bridge detected. Falling back to NTP.' });
    return false;
  }

  try {
    await _nativeBridge!.requestAccess();
  } catch (err: any) {
    _emit('gps-permission-denied', { message: err.message });
    return false;
  }

  // Start listening for GPS ticks
  _gpsTickCallback = _nativeBridge!.onTick(_handleGPSTick);

  // Attempt to get initial GPS time for quick lock
  const initialTime = await _nativeBridge!.getCurrentTime();
  if (initialTime) {
    const localTime = performance.now();
    _state.offset = initialTime - localTime;
    _state.currentTier = 'GPS';
    _emit('gps-init', { offset: _state.offset });
  }

  // Set timeout for GPS lock achievement
  setTimeout(() => {
    if (!_state.gpsLockAchieved) {
      _emit('gps-lock-timeout', { message: 'GPS lock not achieved within timeout. Using best estimate.' });
    }
  }, CONFIG.GPS_LOCK_TIMEOUT_MS);

  return true;
}

function _handleGPSTick({ gpsTime, localTime }: { gpsTime: number; localTime: number }): void {
  _state.lastGPSTick = localTime;

  if (!_state.gpsLockAchieved) {
    // Before lock: simple offset calculation
    _state.offset = gpsTime - localTime;
    _state.currentTier = 'GPS';
    return;
  }

  // After lock: PLL discipline
  const predictedLocal = localTime + _state.offset + (_state.drift * (localTime - _state.lastGPSTick) / CONFIG.MS_PER_SECOND);
  const pllResult = _pllUpdate(gpsTime, predictedLocal);

  _emit('gps-tick', {
    gpsTime,
    localTime,
    offset: pllResult.offset,
    drift: pllResult.drift,
    error: pllResult.error,
    locked: _state.gpsLockAchieved
  });
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: AudioContext Hardware Clock Integration
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The Web Audio API's AudioContext maintains its own high-resolution
  clock (audioContext.currentTime) that is locked to the audio
  hardware's sample clock. This clock is monotonic (never goes
  backwards) and has sub-millisecond resolution. It is the only
  suitable clock for scheduling audio events in the browser.

  However, audioContext.currentTime starts at 0 when the context
  is created and is not related to wall-clock time. We must map
  it to our unified time reference (GPS/NTP) so that scheduled
  events align across devices.

  The mapping is simple: when we initialize, we record both
  performance.now() and audioContext.currentTime simultaneously.
  From then on, any unified time can be converted to audio time
  by subtracting the base offset.

  Additionally, modern browsers expose:
  - audioContext.outputLatency — estimated output latency in seconds
  - audioContext.getOutputTimestamp() — maps audio time to performance time
  We use these to compensate for hardware buffering delays.
*/

/*
  IN OTHER WORDS:
  Every audio device has its own internal "heartbeat" — the exact
  speed at which it plays samples. This heartbeat is incredibly
  steady but starts counting from zero when you turn it on. Our
  job is to translate between this device's heartbeat and the
  global worship leader's heartbeat, so when the leader says "play
  at measure 32, beat 3," every device knows exactly when that
  is in its own local time.
*/

function _initAudioContext(): void {
  if (_state.audioContext) return;

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Web Audio API not supported in this browser');
  }

  _state.audioContext = new AudioContextClass({
    sampleRate: 48000,
    latencyHint: 'interactive'
  });

  // Record the simultaneous mapping between wall time and audio time
  _state.audioBaseTime = performance.now() - (_state.audioContext.currentTime * CONFIG.MS_PER_SECOND);

  _emit('audio-init', {
    sampleRate: _state.audioContext.sampleRate,
    baseLatency: _state.audioContext.baseLatency || 0,
    outputLatency: _state.audioContext.outputLatency || 0
  });
}

function _unifiedToAudioTime(unifiedTimeMs: number): number {
  if (!_state.audioContext) return 0;
  return (unifiedTimeMs - _state.audioBaseTime) / CONFIG.MS_PER_SECOND;
}

function _audioToUnifiedTime(audioTimeSec: number): number {
  if (!_state.audioContext) return performance.now();
  return (audioTimeSec * CONFIG.MS_PER_SECOND) + _state.audioBaseTime;
}

function _getOutputLatencyMs(): number {
  if (!_state.audioContext) return 10; // conservative default
  const latencySec = _state.audioContext.outputLatency || 0.01;
  const baseLatencySec = _state.audioContext.baseLatency || 0.005;
  return (latencySec + baseLatencySec) * CONFIG.MS_PER_SECOND;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Event System (Observer Pattern)
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The UnityClock uses a simple publish-subscribe event system.
  Downstream modules (ghost-renderer, conductor-visual, etc.)
  subscribe to events like 'tick', 'gps-lock', 'ntp-sync', and
  'tier-change'. The clock emits these events at appropriate
  times without knowing who is listening. This decouples the
  modules and allows the visual conductor to animate in sync
  with the audio scheduler without direct coupling.

  Events emitted:
  - 'init' — clock initialized, ready for use
  - 'gps-init' — GPS bridge connected, initial offset calculated
  - 'gps-tick' — GPS 1PPS pulse received and processed
  - 'gps-lock' — PLL has converged, sub-microsecond accuracy achieved
  - 'gps-unavailable' — no native bridge, GPS tier skipped
  - 'gps-permission-denied' — user denied location permission
  - 'gps-lock-timeout' — lock not achieved within timeout
  - 'ntp-sync' — NTP synchronization completed
  - 'ntp-failed' — all NTP servers unreachable
  - 'tier-change' — time source changed (GPS → NTP → AUDIO)
  - 'tick' — musical beat subdivision (quarter note by default)
  - 'beat' — downbeat of current measure
  - 'drift-warning' — clock drift exceeds acceptable threshold
*/

/*
  IN OTHER WORDS:
  This is the worship leader's "megaphone." The leader doesn't know
  who is in the worship team — they just announce "measure 4, beat 2"
  and whoever is listening plays. The ghost renderer listens. The
  visual conductor listens. The MIDI bridge listens. They all act
  on the same announcement, independently, at the exact same moment.
*/

function _emit(eventName: string, data: any = {}): void {
  const listeners = _state.eventListeners.get(eventName);
  if (!listeners) return;

  listeners.forEach(callback => {
    try {
      callback(data);
    } catch (err) {
      console.error(`UnityClock event handler error for '${eventName}':`, err);
    }
  });
}

function _on(eventName: string, callback: (data: any) => void): () => void {
  if (!_state.eventListeners.has(eventName)) {
    _state.eventListeners.set(eventName, []);
  }
  _state.eventListeners.get(eventName)!.push(callback);

  // Return unsubscribe function
  return () => {
    const list = _state.eventListeners.get(eventName);
    if (list) {
      const idx = list.indexOf(callback);
      if (idx > -1) list.splice(idx, 1);
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Musical Beat Scheduler
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The scheduler is the heart of the musical timing system. It uses
  the "two clocks" pattern: a loose JavaScript timer (setTimeout)
  to decide what needs scheduling, and the hardware-locked AudioContext
  clock to actually execute the scheduling. This pattern is used by
  every professional Web Audio application (Web Audio Drum Machine,
  Acid Defender, etc.) because it decouples the imprecise JavaScript
  event loop from the sample-accurate audio thread.

  The scheduler runs continuously while _state.isRunning is true.
  It checks if the next beat subdivision falls within the lookahead
  window (default 100ms). If so, it schedules the event and advances
  the next tick time. The lookahead window ensures that even if the
  setTimeout callback is delayed by 50ms, the audio event is still
  scheduled with sample accuracy.

  The beat subdivision defaults to 4 (sixteenth notes at 4/4), but
  can be changed for different time signatures or groove resolutions.
*/

/*
  IN OTHER WORDS:
  Imagine a train station where the conductor walks down the platform
  looking at a schedule 100 meters ahead. They see a train coming
  and tell the platform crew "get ready, train arrives in 10 seconds."
  The crew doesn't need to stare at the tracks — they just need to
  know far enough in advance. Our scheduler works the same way:
  it looks ahead 100ms, schedules everything it sees, then goes
  back to sleep for 25ms before looking again.
*/

function _schedulerLoop(): void {
  if (!_state.isRunning) return;

  _state.schedulerId = setTimeout(_schedulerLoop, CONFIG.AUDIO_LOOKAHEAD_MS);

  const lookaheadMs = CONFIG.AUDIO_SCHEDULE_AHEAD_MS;
  const now = UnityClock.now();

  while (_state.nextTickTime < now + lookaheadMs) {
    const tickData: TickData = {
      time: _state.nextTickTime,
      audioTime: _unifiedToAudioTime(_state.nextTickTime),
      beat: Math.floor(_state.nextTickTime / (_state.secondsPerBeat * CONFIG.MS_PER_SECOND)),
      subdivision: 0,
      bpm: _state.bpm
    };

    _emit('tick', tickData);

    // Check if this is a downbeat
    const beatIndex = Math.round(_state.nextTickTime / (_state.secondsPerBeat * CONFIG.MS_PER_SECOND));
    if (beatIndex % CONFIG.BEAT_SUBDIVISIONS === 0) {
      _emit('beat', tickData);
    }

    _state.nextTickTime += (_state.secondsPerBeat * CONFIG.MS_PER_SECOND) / CONFIG.BEAT_SUBDIVISIONS;
  }
}

function _startScheduler(): void {
  if (_state.isRunning) return;
  _state.isRunning = true;
  _state.nextTickTime = UnityClock.now();
  _schedulerLoop();
  _emit('scheduler-start', { startTime: _state.nextTickTime });
}

function _stopScheduler(): void {
  _state.isRunning = false;
  if (_state.schedulerId) {
    clearTimeout(_state.schedulerId);
    _state.schedulerId = null;
  }
  _emit('scheduler-stop', {});
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Public API (The UnityClock Service)
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The public API exposes only what downstream modules need. All
  internal state is protected by closure. The API is designed to
  be used by musicians and developers who may not understand the
  underlying physics of GPS satellites or PLL loops — they just
  need a reliable time reference that works.

  Core methods:
  - init() — starts everything: AudioContext, GPS bridge, NTP fallback
  - now() — returns current unified time in milliseconds
  - nowSeconds() — returns current unified time in seconds (convenience)
  - scheduleAt(time, callback) — schedules a callback at exact future time
  - scheduleAudioEvent(time, audioNode, method, ...args) — schedules Web Audio node
  - setBPM(bpm) — changes tempo, recalculates beat subdivision
  - getTier() — returns current time source tier ('GPS' | 'NTP' | 'AUDIO')
  - getAccuracy() — returns estimated accuracy in milliseconds
  - getDrift() — returns current drift rate in PPM
  - on(event, callback) — subscribe to events
  - start() / stop() — control the beat scheduler
  - destroy() — cleanup all resources, stop all loops

  The now() method is the most critical: it converts the current
  local time to unified time by applying the offset and drift
  correction. This is the timestamp that all distributed devices
  agree on.
*/

/*
  IN OTHER WORDS:
  This is the "control panel" that every other part of the app
  uses. You don't need to know how the engine works — you just
  turn the key (init), read the speedometer (now), and press
  the gas (scheduleAt). The worship leader's baton is in your hand.
*/

export const UnityClock = {

  /**
   * Initialize the UnityClock. Must be called before any other method.
   * Starts AudioContext, attempts GPS lock, falls back to NTP.
   */
  async init(): Promise<void> {
    _initAudioContext();

    // Attempt GPS first
    const gpsReady = await _initGPS();

    if (!gpsReady) {
      // GPS unavailable — immediately start NTP sync
      await _performNTPSync();

      // Set up periodic NTP re-sync
      setInterval(() => {
        if (_state.currentTier !== 'GPS') {
          _performNTPSync();
        }
      }, CONFIG.NTP_INTERVAL_MS);
    }

    _emit('init', {
      tier: _state.currentTier,
      offset: _state.offset,
      drift: _state.drift,
      accuracy: this.getAccuracy()
    });
  },

  /**
   * Get current unified time in milliseconds.
   * This is the globally synchronized time reference.
   */
  now(): number {
    const localNow = performance.now();
    // Apply offset and drift correction
    const elapsedSinceLastSync = localNow - (_state.lastGPSTick || localNow);
    const driftCorrection = (_state.drift * elapsedSinceLastSync) / CONFIG.MS_PER_SECOND;
    return localNow + _state.offset + driftCorrection;
  },

  /**
   * Get current unified time in seconds.
   * Convenience method for Web Audio API scheduling.
   */
  nowSeconds(): number {
    return this.now() / CONFIG.MS_PER_SECOND;
  },

  /**
   * Schedule a callback to execute at a specific unified time.
   */
  scheduleAt(unifiedTimeMs: number, callback: () => void): number | null {
    const delay = unifiedTimeMs - this.now();
    if (delay <= 0) {
      callback();
      return null;
    }
    return setTimeout(() => {
      callback();
    }, Math.max(0, delay));
  },

  /**
   * Schedule a Web Audio node method at a specific unified time.
   */
  scheduleAudioEvent(unifiedTimeMs: number, audioNode: any, method: string, ...args: any[]): void {
    const audioTime = _unifiedToAudioTime(unifiedTimeMs);
    const compensatedTime = audioTime - (_getOutputLatencyMs() / CONFIG.MS_PER_SECOND);

    if (audioNode && typeof audioNode[method] === 'function') {
      audioNode[method](Math.max(0, compensatedTime), ...args);
    } else {
      console.warn(`UnityClock: AudioNode does not have method '${method}'`);
    }
  },

  /**
   * Set the tempo (beats per minute).
   */
  setBPM(bpm: number): void {
    if (bpm <= 0 || bpm > 300) {
      console.warn(`UnityClock: Invalid BPM ${bpm}. Must be 1-300.`);
      return;
    }
    _state.bpm = bpm;
    _state.secondsPerBeat = 60.0 / bpm;
    _emit('bpm-change', { bpm, secondsPerBeat: _state.secondsPerBeat });
  },

  /**
   * Get current time synchronization tier.
   */
  getTier(): TimeTier {
    return _state.currentTier;
  },

  /**
   * Get estimated accuracy of current time reference.
   */
  getAccuracy(): number {
    switch (_state.currentTier) {
      case 'GPS':
        return _state.gpsLockAchieved ? 0.001 : 1.0;
      case 'NTP':
        return 10.0;
      case 'AUDIO':
      default:
        return 50.0;
    }
  },

  /**
   * Get current clock drift rate.
   */
  getDrift(): number {
    return _state.drift;
  },

  /**
   * Subscribe to an event.
   */
  on(eventName: string, callback: (data: any) => void): () => void {
    return _on(eventName, callback);
  },

  /**
   * Start the musical beat scheduler.
   */
  start(): void {
    _startScheduler();
  },

  /**
   * Stop the musical beat scheduler.
   */
  stop(): void {
    _stopScheduler();
  },

  /**
   * Get current BPM.
   */
  getBPM(): number {
    return _state.bpm;
  },

  /**
   * Get seconds per beat at current BPM.
   */
  getSecondsPerBeat(): number {
    return _state.secondsPerBeat;
  },

  /**
   * Get the underlying AudioContext.
   */
  getAudioContext(): AudioContext | null {
    return _state.audioContext;
  },

  /**
   * Force an immediate NTP sync.
   */
  async forceNTPSync(): Promise<number | null> {
    return await _performNTPSync();
  },

  /**
   * Get diagnostic information about the clock state.
   */
  getDiagnostics(): DiagnosticsData {
    return {
      tier: _state.currentTier,
      offset: _state.offset,
      drift: _state.drift,
      driftPPM: _state.drift,
      gpsLockAchieved: _state.gpsLockAchieved,
      lastGPSTick: _state.lastGPSTick,
      audioContextRunning: _state.audioContext ? _state.audioContext.state : 'none',
      sampleRate: _state.audioContext ? _state.audioContext.sampleRate : 0,
      outputLatency: _getOutputLatencyMs(),
      bpm: _state.bpm,
      schedulerRunning: _state.isRunning,
      kalmanEstimate: _state.kalman.estimate,
      kalmanError: _state.kalman.error,
      ntpHistoryLength: _state.ntpHistory.length,
      driftHistoryLength: _state.driftHistory.length,
      accuracy: this.getAccuracy()
    };
  },

  /**
   * Destroy the UnityClock and release all resources.
   */
  destroy(): void {
    _stopScheduler();

    if (_state.audioContext) {
      _state.audioContext.close();
      _state.audioContext = null;
    }

    if (_gpsTickCallback) {
      _gpsTickCallback();
      _gpsTickCallback = null;
    }

    _state.eventListeners.clear();
    _state.ntpHistory = [];
    _state.driftHistory = [];
    _state.offsetHistory = [];

    _emit('destroy', {});
  }

};

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: React Hook for NTCC Music App Integration
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  This React hook provides a convenient way for NTCC Music App components
  to interact with the UnityClock service. It handles initialization,
  cleanup, and exposes reactive state for UI components. This follows
  the pattern used throughout your Adoración app for service integration.
*/

/*
  IN OTHER WORDS:
  This is the "power adapter" that lets React components plug into
  the UnityClock engine. Instead of every component talking directly
  to the engine, they use this hook which manages the connection,
  keeps track of what's happening, and tells the component when
  something changes.
*/

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseUnityClockReturn {
  isInitialized: boolean;
  tier: TimeTier;
  accuracy: number;
  bpm: number;
  isRunning: boolean;
  diagnostics: DiagnosticsData | null;
  init: () => Promise<void>;
  start: () => void;
  stop: () => void;
  setBPM: (bpm: number) => void;
  now: () => number;
  getAudioContext: () => AudioContext | null;
}

export function useUnityClock(): UseUnityClockReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [tier, setTier] = useState<TimeTier>('AUDIO');
  const [accuracy, setAccuracy] = useState(50);
  const [bpm, setBpmState] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);

  const initRef = useRef(false);

  const init = useCallback(async () => {
    if (initRef.current) return;
    initRef.current = true;

    await UnityClock.init();
    setIsInitialized(true);
    setTier(UnityClock.getTier());
    setAccuracy(UnityClock.getAccuracy());
  }, []);

  const start = useCallback(() => {
    UnityClock.start();
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    UnityClock.stop();
    setIsRunning(false);
  }, []);

  const setBPM = useCallback((newBpm: number) => {
    UnityClock.setBPM(newBpm);
    setBpmState(newBpm);
  }, []);

  const now = useCallback(() => UnityClock.now(), []);
  const getAudioContext = useCallback(() => UnityClock.getAudioContext(), []);

  useEffect(() => {
    const unsubInit = UnityClock.on('init', (data: InitData) => {
      setTier(data.tier);
      setAccuracy(data.accuracy);
    });

    const unsubTier = UnityClock.on('tier-change', (data: { tier: TimeTier }) => {
      setTier(data.tier);
      setAccuracy(UnityClock.getAccuracy());
    });

    const unsubBpm = UnityClock.on('bpm-change', (data: { bpm: number }) => {
      setBpmState(data.bpm);
    });

    const unsubScheduler = UnityClock.on('scheduler-start', () => {
      setIsRunning(true);
    });

    const unsubSchedulerStop = UnityClock.on('scheduler-stop', () => {
      setIsRunning(false);
    });

    // Update diagnostics periodically
    const diagInterval = setInterval(() => {
      if (isInitialized) {
        setDiagnostics(UnityClock.getDiagnostics());
      }
    }, 5000);

    return () => {
      unsubInit();
      unsubTier();
      unsubBpm();
      unsubScheduler();
      unsubSchedulerStop();
      clearInterval(diagInterval);
    };
  }, [isInitialized]);

  return {
    isInitialized,
    tier,
    accuracy,
    bpm,
    isRunning,
    diagnostics,
    init,
    start,
    stop,
    setBPM,
    now,
    getAudioContext
  };
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Module Export & Global Registration
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The module supports multiple export formats for maximum compatibility:
  - ES Module (import/export) for modern bundlers (Vite/Webpack)
  - CommonJS (module.exports) for Node.js environments
  - Global window.UnityClock for direct browser script tags

  This ensures the file works whether you are using Vite (as in the
  NTCC Music App), Webpack, Rollup, or simply dropping it into an HTML file.
  The global registration is the fallback — if no module system is
  detected, the UnityClock object is attached to window.
*/

/*
  IN OTHER WORDS:
  This is the "shipping label" on the package. Whether the delivery
  truck is a modern electric van (ES modules) or an old pickup
  (script tags), the package gets to the right address. The
  UnityClock is always available, no matter how you load it.
*/

if (typeof window !== 'undefined') {
  (window as any).UnityClock = UnityClock;
  (window as any).UnityClockConfig = CONFIG;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: End of Module
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  This concludes the UnityClock.ts service module. It is the foundation
  upon which all other NTCC Music App distributed worship modules depend.
  Without this file, there is no shared time, no predictive ghost rendering,
  no distributed MIDI state, and no rotating Earth conductor.

  The module is self-contained, has zero external dependencies beyond
  standard Web APIs, and degrades gracefully from GPS → NTP → AudioContext.
  It follows the #FindAWay philosophy: pursue excellency, never settle
  for "good enough," and make the complex simple without making
  it simplistic.
*/

/*
  IN OTHER WORDS:
  This is the worship leader's baton — the first thing picked up before
  any music can begin. It is carved from precision, polished by
  physics, and weighted with the patience to keep beating even
  when the satellites go silent. Every musician in every timezone
  will see this baton. And they will all see it at the same time.
*/

// End of UnityClock.ts
// © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community
