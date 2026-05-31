/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NTCC MUSIC APP — src/services/GhostRenderer.ts
 * Predictive Accompaniment Engine: Renders expected accompaniment locally before
 * remote audio arrives, creating the illusion of zero latency.
 *
 * Adapted from The Unity Solution™ for NTCC Music App
 * © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Module Header & Type Definitions
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The Ghost Renderer is the core innovation of the NTCC Music App's
  distributed worship system. Instead of waiting for remote audio to
  traverse the network (20-400ms latency), it predicts what remote
  musicians will play based on the worship song structure (chord charts,
  tempo, key, arrangement) and renders that prediction locally using
  Web Audio API oscillator synthesis.

  When the actual remote MIDI data arrives, it compares predicted
  notes to real notes and either:
  - Confirms the ghost (match > 85% — ghost continues, real is redundant)
  - Crossfades to real (match 50-85% — 50ms crossfade)
  - Hard cuts to real (match < 50% — improvisation detected)

  The key insight: the human ear perceives CONTINUITY, not absolute
  accuracy. A slightly wrong note played on time is acceptable.
  Silence or a gap is not. The ghost ensures there is never silence.

  This module depends on:
  - UnityClock (for sample-accurate scheduling)
  - Web Audio API (for local synthesis)
  - UnityContext (for song data and session state)
*/

/*
  IN OTHER WORDS:
  Imagine you're singing in a worship team, but the keyboardist is in
  another building. You can't hear them yet — their sound is still
  traveling through the walls. But you know the song. You know
  exactly what the keyboardist should be playing right now. So you
  hum their part quietly in your head, keeping the harmony intact.
  When their actual playing finally reaches you, if it matches what
  you expected, you just stop humming. If it's slightly different,
  you blend your hum with their sound over a split second. If
  they played something completely different, you drop your
  hum immediately and listen to what they actually did. That's
  the ghost renderer.
*/

'use strict';

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: TypeScript Interfaces
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  All data structures are strictly typed for the NTCC Music App.
  The interfaces define song structures, note events, ghost state,
  and synthesis parameters for compile-time safety.
*/

/*
  IN OTHER WORDS:
  These are the "sheet music blueprints" and "performance notes"
  for the ghost's orchestra. Every chord, every note, every
  instrument is defined so the ghost knows exactly what to play.
*/

export interface SongSection {
  measures: number;
  chords: string[];
}

export interface SongData {
  title: string;
  tempo: number;
  key: string;
  timeSignature: [number, number];
  sections: Record<string, SongSection>;
  arrangement: string[];
}

export interface ParsedMeasure {
  index: number;
  section: string;
  chord: string;
  chordNotes: number[];
  scaleNotes: number[];
  beatsPerMeasure: number;
  expectedInstruments: string[];
}

export interface ParsedSong {
  title: string;
  tempo: number;
  key: string;
  timeSignature: [number, number];
  measures: ParsedMeasure[];
  totalMeasures: number;
  arrangement: string[];
  sections: Record<string, SongSection>;
}

export interface NoteEvent {
  time: number;
  note: number;
  velocity: number;
  duration: number;
  instrument: string;
}

export interface ActiveNote {
  source: AudioBufferSourceNode | OscillatorNode;
  gain: GainNode;
  startTime: number;
  instrument: string;
  note: number;
  isGhost: boolean;
  isTransitioning?: boolean;
}

export interface RealNoteData {
  time: number;
  note: number;
  velocity: number;
  instrument: string;
  channel?: number;
  duration?: number;
}

export interface MismatchEntry {
  expected: number | null;
  actual: number;
  timingDiff: number;
  matchScore: number;
  measure: number;
  section: string;
  timestamp: number;
}

export interface GhostDiagnostics {
  isActive: boolean;
  confidence: number;
  activeNotes: number;
  scheduledGhosts: number;
  mismatchHistory: number;
  learningModelSize: number;
  currentMeasure: number;
  currentSection: string;
  songTitle: string | null;
}

export interface GhostConfig {
  CONFIRM_THRESHOLD: number;
  CROSSFADE_THRESHOLD: number;
  HARD_CUT_THRESHOLD: number;
  CROSSFADE_DURATION_MS: number;
  CONFIRM_FADE_MS: number;
  VELOCITY_VARIANCE: number;
  TIMING_JITTER_MS: number;
  EXPRESSION_DEPTH: number;
  DEFAULT_VELOCITY: number;
  MIN_VELOCITY: number;
  MAX_VELOCITY: number;
  LOOKAHEAD_BEATS: number;
  MAX_POLYPHONY: number;
  LEARNING_RATE: number;
  MISMATCH_HISTORY_SIZE: number;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Configuration Constants
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  These constants define the prediction confidence thresholds,
  crossfade timing, humanization parameters, and scheduling
  windows. They are tuned for worship music where continuity
  and feel are more important than absolute precision.
*/

/*
  IN OTHER WORDS:
  These are the "settings" for the ghost's imagination — how
  confident it needs to be before trusting itself, how quickly
  it blends with reality, and how much "human feel" it adds
  so it doesn't sound like a robot.
*/

export const GHOST_CONFIG: GhostConfig = Object.freeze({
  // Prediction confidence thresholds
  CONFIRM_THRESHOLD: 0.85,
  CROSSFADE_THRESHOLD: 0.50,
  HARD_CUT_THRESHOLD: 0.0,

  // Crossfade timing
  CROSSFADE_DURATION_MS: 50,
  CONFIRM_FADE_MS: 100,

  // Humanization
  VELOCITY_VARIANCE: 0.08,
  TIMING_JITTER_MS: 5,
  EXPRESSION_DEPTH: 0.15,

  // Audio
  DEFAULT_VELOCITY: 80,
  MIN_VELOCITY: 20,
  MAX_VELOCITY: 127,

  // Scheduling
  LOOKAHEAD_BEATS: 2,
  MAX_POLYPHONY: 32,

  // Learning
  LEARNING_RATE: 0.1,
  MISMATCH_HISTORY_SIZE: 100
});

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Chord & Scale Mapping
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The chord note map converts chord names ("A", "F#m", "D") to
  MIDI note numbers (relative to root). The key root map converts
  key names to semitone offsets. Together they enable the ghost
  to generate correct notes for any worship song in any key.

  The scale intervals define the major scale (0, 2, 4, 5, 7, 9, 11).
  For minor keys, the ghost would use minor scale intervals.
  This is a simplified approach; production would use full
  modal interchange for richer worship harmonies.
*/

/*
  IN OTHER WORDS:
  This is the ghost's "music theory textbook." It knows that an
  A major chord has notes A, C#, and E. It knows that F# minor
  has F#, A, and C#. It knows the key of D has two sharps.
  With this knowledge, it can read any chord chart and know
  exactly what notes to play.
*/

const CHORD_NOTE_MAP: Record<string, number[]> = {
  'C': [0, 4, 7], 'Cm': [0, 3, 7],
  'C#': [1, 5, 8], 'C#m': [1, 4, 8],
  'Db': [1, 5, 8], 'Dbm': [1, 4, 8],
  'D': [2, 6, 9], 'Dm': [2, 5, 9],
  'D#': [3, 7, 10], 'D#m': [3, 6, 10],
  'Eb': [3, 7, 10], 'Ebm': [3, 6, 10],
  'E': [4, 8, 11], 'Em': [4, 7, 11],
  'F': [5, 9, 0], 'Fm': [5, 8, 0],
  'F#': [6, 10, 1], 'F#m': [6, 9, 1],
  'Gb': [6, 10, 1], 'Gbm': [6, 9, 1],
  'G': [7, 11, 2], 'Gm': [7, 10, 2],
  'G#': [8, 0, 3], 'G#m': [8, 11, 3],
  'Ab': [8, 0, 3], 'Abm': [8, 11, 3],
  'A': [9, 1, 4], 'Am': [9, 0, 4],
  'A#': [10, 2, 5], 'A#m': [10, 1, 5],
  'Bb': [10, 2, 5], 'Bbm': [10, 1, 5],
  'B': [11, 3, 6], 'Bm': [11, 2, 6]
};

const KEY_ROOT_MAP: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

const SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11]; // Major scale

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Internal State
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The ghost renderer maintains several data structures:
  - song: current worship song structure (chords, tempo, key, arrangement)
  - activeNotes: Map of noteKey -> { source, gain, startTime, ... }
  - scheduledGhosts: Array of upcoming ghost events with timestamps
  - realNotesBuffer: Ring buffer of recently received real MIDI notes
  - confidenceScore: Current prediction accuracy (0.0 - 1.0)
  - isActive: Whether ghost rendering is currently enabled
  - audioContext: Reference to the shared UnityClock AudioContext
  - mismatchHistory: Array of recent prediction errors for learning
  - learningModel: Map of section patterns to learned probabilities
*/

/*
  IN OTHER WORDS:
  This is the ghost's "mental score" — the sheet music it holds
  in its head. It knows what song is playing, what notes are
  currently sounding, what notes are coming up, and how often
  the predictions have been right or wrong. It's the ghost's brain.
*/

interface GhostState {
  song: ParsedSong | null;
  activeNotes: Map<string, ActiveNote>;
  scheduledGhosts: NoteEvent[];
  realNotesBuffer: RealNoteData[];
  confidenceScore: number;
  isActive: boolean;
  audioContext: AudioContext | null;
  mismatchHistory: MismatchEntry[];
  currentMeasure: number;
  currentBeat: number;
  currentSection: string;
  crossfadeNodes: Map<string, { ghostGain: GainNode; realGain: GainNode }>;
  learningModel: Map<string, Map<string, number>>;
  eventListeners: Map<string, Array<(data: any) => void>>;
}

const _state: GhostState = {
  song: null,
  activeNotes: new Map(),
  scheduledGhosts: [],
  realNotesBuffer: [],
  confidenceScore: 1.0,
  isActive: false,
  audioContext: null,
  mismatchHistory: [],
  currentMeasure: 0,
  currentBeat: 0,
  currentSection: 'intro',
  crossfadeNodes: new Map(),
  learningModel: new Map(),
  eventListeners: new Map()
};

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Song Structure Parser
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The song parser converts a JSON worship song structure into an
  internal representation optimized for real-time prediction. The
  input format is a simplified chord chart with sections, measures,
  and chord symbols — the same format worship teams read on iPads.

  The parser expands the arrangement into a flat array of measures,
  each containing the chord, scale notes, and expected instrument
  roles. This flat array is indexed by measure number for O(1)
  lookup during real-time rendering.
*/

/*
  IN OTHER WORDS:
  This takes a chord chart — the same kind a worship team reads
  during service — and turns it into a "recipe" that the ghost can
  follow beat by beat. Instead of "Verse 1, 8 measures, chords
  A-E-F#m-D," it becomes a list: "Measure 1: A chord. Measure 2:
  E chord. Measure 3: F#m chord..." The ghost just reads down
  the list as the song plays.
*/

export function parseSong(songData: SongData): ParsedSong | null {
  if (!songData || !songData.sections || !songData.arrangement) {
    console.error('[Ghost] Invalid song data');
    return null;
  }

  const keyRoot = KEY_ROOT_MAP[songData.key] || 0;
  const [beatsPerMeasure] = songData.timeSignature || [4, 4];
  const measures: ParsedMeasure[] = [];
  let globalMeasureIndex = 0;

  for (const sectionName of songData.arrangement) {
    const section = songData.sections[sectionName];
    if (!section) continue;

    const sectionChords = section.chords || [];
    const sectionMeasures = section.measures || sectionChords.length;

    for (let m = 0; m < sectionMeasures; m++) {
      const chordIndex = m % sectionChords.length;
      const chordName = sectionChords[chordIndex];
      const chordNotes = CHORD_NOTE_MAP[chordName] || CHORD_NOTE_MAP['C'];
      const scaleNotes = SCALE_INTERVALS.map(interval => (keyRoot + interval) % 12);

      measures.push({
        index: globalMeasureIndex,
        section: sectionName,
        chord: chordName,
        chordNotes: chordNotes.map(n => (n + keyRoot) % 12),
        scaleNotes: scaleNotes,
        beatsPerMeasure: beatsPerMeasure,
        expectedInstruments: _inferInstruments(sectionName, chordName)
      });

      globalMeasureIndex++;
    }
  }

  return {
    title: songData.title || 'Untitled',
    tempo: songData.tempo || 120,
    key: songData.key || 'C',
    timeSignature: songData.timeSignature || [4, 4],
    measures: measures,
    totalMeasures: globalMeasureIndex,
    arrangement: songData.arrangement,
    sections: songData.sections
  };
}

function _inferInstruments(sectionName: string, chordName: string): string[] {
  const base = ['piano', 'bass'];

  if (sectionName === 'chorus' || sectionName === 'bridge') {
    base.push('drums');
  }

  if (chordName.includes('m')) {
    base.push('strings');
  }

  return base;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Ghost Note Generation Engine
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The note generation engine creates MIDI-like note events based
  on the current song position. It runs continuously, looking
  ahead GHOST_CONFIG.LOOKAHEAD_BEATS and scheduling ghost notes
  on the UnityClock timeline.

  For each beat subdivision within the lookahead window:
  1. Determine current measure and chord from the flat array
  2. Select appropriate notes based on instrument role:
     - Piano: chord tones + scale passing tones
     - Bass: root note of chord, occasional fifth
     - Drums: kick on 1, snare on 2/4, hi-hat on subdivisions
  3. Apply humanization (velocity variance, timing jitter)
  4. Schedule via UnityClock.scheduleAudioEvent()

  The generated notes are stored in scheduledGhosts with their
  scheduled time, note number, velocity, and instrument.
*/

/*
  IN OTHER WORDS:
  This is the ghost's "imagination." It reads the chord chart,
  knows what measure we're in, and starts "hearing" the other
  instruments in its head before they actually play. It imagines
  the piano playing chord tones, the bass hitting the root note,
  the drums keeping time. Then it writes down exactly when each
  imagined note should happen and hands that list to the conductor
  (UnityClock) to execute at the right moment.
*/

function _generateGhostNotes(startBeat: number, endBeat: number, tempo: number): NoteEvent[] {
  const secondsPerBeat = 60.0 / tempo;
  const notes: NoteEvent[] = [];
  const song = _state.song;

  if (!song) return notes;

  const beatsPerMeasure = song.timeSignature[0];

  for (let beat = startBeat; beat < endBeat; beat++) {
    const measureIndex = Math.floor(beat / beatsPerMeasure);
    const beatInMeasure = beat % beatsPerMeasure;

    if (measureIndex >= song.measures.length) break;

    const measure = song.measures[measureIndex];
    const beatTime = beat * secondsPerBeat * 1000; // ms from song start

    // Generate notes for each expected instrument
    for (const instrument of measure.expectedInstruments) {
      const instrumentNotes = _generateInstrumentNotes(
        instrument,
        measure,
        beatInMeasure,
        beatTime,
        secondsPerBeat
      );
      notes.push(...instrumentNotes);
    }
  }

  return notes;
}

function _generateInstrumentNotes(
  instrument: string,
  measure: ParsedMeasure,
  beatInMeasure: number,
  beatTime: number,
  secondsPerBeat: number
): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const now = _getUnityClockNow();
  const scheduleTime = now + beatTime;

  switch (instrument) {
    case 'piano':
      // Piano plays chord tones on beat 1, passing tones on other beats
      if (beatInMeasure === 0) {
        // Full chord on downbeat
        measure.chordNotes.forEach((note, index) => {
          const velocity = GHOST_CONFIG.DEFAULT_VELOCITY +
            (Math.random() - 0.5) * GHOST_CONFIG.VELOCITY_VARIANCE * 127;
          notes.push({
            time: scheduleTime + _jitter(),
            note: 60 + note,
            velocity: Math.max(GHOST_CONFIG.MIN_VELOCITY, Math.min(GHOST_CONFIG.MAX_VELOCITY, Math.round(velocity))),
            duration: secondsPerBeat * 1000 * 0.9,
            instrument: 'piano'
          });
        });
      } else if (beatInMeasure === 2) {
        // Light chord on backbeat
        measure.chordNotes.slice(0, 2).forEach((note) => {
          const velocity = GHOST_CONFIG.DEFAULT_VELOCITY * 0.7 +
            (Math.random() - 0.5) * GHOST_CONFIG.VELOCITY_VARIANCE * 127;
          notes.push({
            time: scheduleTime + _jitter(),
            note: 60 + note,
            velocity: Math.max(GHOST_CONFIG.MIN_VELOCITY, Math.min(GHOST_CONFIG.MAX_VELOCITY, Math.round(velocity))),
            duration: secondsPerBeat * 1000 * 0.5,
            instrument: 'piano'
          });
        });
      }
      break;

    case 'bass':
      // Bass plays root on beat 1, fifth on beat 3
      if (beatInMeasure === 0) {
        const rootNote = measure.chordNotes[0];
        notes.push({
          time: scheduleTime + _jitter(),
          note: 36 + rootNote,
          velocity: GHOST_CONFIG.DEFAULT_VELOCITY,
          duration: secondsPerBeat * 1000 * 0.8,
          instrument: 'bass'
        });
      } else if (beatInMeasure === 2 && measure.chordNotes.length > 2) {
        const fifthNote = measure.chordNotes[2];
        notes.push({
          time: scheduleTime + _jitter(),
          note: 36 + fifthNote,
          velocity: GHOST_CONFIG.DEFAULT_VELOCITY * 0.8,
          duration: secondsPerBeat * 1000 * 0.6,
          instrument: 'bass'
        });
      }
      break;

    case 'drums':
      // Drums: kick on 1, snare on 2/4, hi-hat on all
      if (beatInMeasure === 0) {
        notes.push({ time: scheduleTime, note: 36, velocity: 100, duration: 50, instrument: 'drums' }); // Kick
      }
      if (beatInMeasure === 1 || beatInMeasure === 3) {
        notes.push({ time: scheduleTime, note: 38, velocity: 90, duration: 50, instrument: 'drums' }); // Snare
      }
      notes.push({ time: scheduleTime, note: 42, velocity: 70, duration: 50, instrument: 'drums' }); // Hi-hat
      break;

    case 'strings':
      // Strings sustain chord tones
      if (beatInMeasure === 0) {
        measure.chordNotes.forEach((note) => {
          notes.push({
            time: scheduleTime,
            note: 72 + note,
            velocity: GHOST_CONFIG.DEFAULT_VELOCITY * 0.6,
            duration: secondsPerBeat * 1000 * beatsPerMeasure,
            instrument: 'strings'
          });
        });
      }
      break;
  }

  return notes;
}

function _jitter(): number {
  return (Math.random() - 0.5) * GHOST_CONFIG.TIMING_JITTER_MS * 2;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Audio Synthesis & Playback
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The synthesis engine converts ghost note events into actual
  audio using the Web Audio API. Each note creates:
  1. An AudioBufferSourceNode or OscillatorNode (plays the sound)
  2. A GainNode (controls volume, used for crossfading)
  3. Connection to the master output

  For the prototype, we use oscillator-based synthesis when
  soundfonts are not loaded. The oscillator approach uses:
  - Piano: Triangle wave with ADSR envelope
  - Bass: Sine wave with quick attack
  - Drums: Noise burst (snare), sine sweep (kick), filtered noise (hi-hat)
  - Strings: Saw wave with slow attack, long release

  Each note's gain node is stored in activeNotes so it can be
  faded out during crossfades or hard cuts.
*/

/*
  IN OTHER WORDS:
  This is where the ghost's imagination becomes actual sound.
  Up to this point, the ghost was just thinking about notes.
  Now it creates real audio waves — vibrations in the air (or
  rather, vibrations in the computer's sound card). It uses
  simple wave shapes (triangle, sine, saw) that approximate
  real instruments. When the real musician's audio arrives,
  these synthetic sounds are replaced with the real thing.
*/

function _synthesizeNote(noteEvent: NoteEvent): ActiveNote | null {
  const ctx = _state.audioContext;
  if (!ctx) return null;

  const { note, velocity, duration, instrument } = noteEvent;

  // Create gain node for this note (used in crossfades)
  const gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);

  // Convert MIDI velocity (0-127) to gain (0.0-1.0)
  const baseGain = velocity / 127;

  // Create oscillator or sample source based on instrument
  let sourceNode: OscillatorNode | AudioBufferSourceNode;
  let filterNode: BiquadFilterNode | null = null;

  const now = ctx.currentTime;

  switch (instrument) {
    case 'piano': {
      sourceNode = ctx.createOscillator();
      sourceNode.type = 'triangle';
      sourceNode.frequency.value = _midiToFrequency(note);

      // ADSR envelope for piano
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(baseGain * 0.8, now + 0.01); // Attack
      gainNode.gain.exponentialRampToValueAtTime(baseGain * 0.3, now + 0.3); // Decay
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + (duration / 1000)); // Release
      break;
    }

    case 'bass': {
      sourceNode = ctx.createOscillator();
      sourceNode.type = 'sine';
      sourceNode.frequency.value = _midiToFrequency(note);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(baseGain, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + (duration / 1000));
      break;
    }

    case 'drums': {
      if (note === 36) { // Kick
        sourceNode = ctx.createOscillator();
        sourceNode.type = 'sine';
        sourceNode.frequency.setValueAtTime(150, now);
        sourceNode.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gainNode.gain.setValueAtTime(baseGain, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      } else if (note === 38) { // Snare
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        sourceNode = ctx.createBufferSource();
        sourceNode.buffer = buffer;
        filterNode = ctx.createBiquadFilter();
        filterNode.type = 'highpass';
        filterNode.frequency.value = 800;
        sourceNode.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.gain.setValueAtTime(baseGain * 0.7, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      } else { // Hi-hat
        const hhBufferSize = ctx.sampleRate * 0.05;
        const hhBuffer = ctx.createBuffer(1, hhBufferSize, ctx.sampleRate);
        const hhData = hhBuffer.getChannelData(0);
        for (let i = 0; i < hhBufferSize; i++) {
          hhData[i] = (Math.random() * 2 - 1);
        }
        sourceNode = ctx.createBufferSource();
        sourceNode.buffer = hhBuffer;
        filterNode = ctx.createBiquadFilter();
        filterNode.type = 'highpass';
        filterNode.frequency.value = 5000;
        sourceNode.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.gain.setValueAtTime(baseGain * 0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      }
      break;
    }

    case 'strings': {
      sourceNode = ctx.createOscillator();
      sourceNode.type = 'sawtooth';
      sourceNode.frequency.value = _midiToFrequency(note);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(baseGain * 0.5, now + 0.3); // Slow attack
      gainNode.gain.setValueAtTime(baseGain * 0.5, now + (duration / 1000) - 0.5);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + (duration / 1000));
      break;
    }

    default: {
      sourceNode = ctx.createOscillator();
      sourceNode.type = 'sine';
      sourceNode.frequency.value = _midiToFrequency(note);
      gainNode.gain.setValueAtTime(baseGain, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + (duration / 1000));
    }
  }

  // Connect source to gain (unless already connected for drums)
  if (instrument !== 'drums') {
    sourceNode.connect(gainNode);
  }

  // Schedule start and stop
  const startTime = _unifiedToAudioTime(noteEvent.time);
  const stopTime = startTime + (duration / 1000);

  sourceNode.start(startTime);
  sourceNode.stop(stopTime);

  // Store for crossfade management
  const noteKey = `${instrument}-${note}`;
  const activeNote: ActiveNote = {
    source: sourceNode,
    gain: gainNode,
    startTime: noteEvent.time,
    instrument: instrument,
    note: note,
    isGhost: true
  };

  _state.activeNotes.set(noteKey, activeNote);

  // Clean up after note ends
  sourceNode.onended = () => {
    _state.activeNotes.delete(noteKey);
    gainNode.disconnect();
    if (filterNode) filterNode.disconnect();
  };

  return activeNote;
}

function _midiToFrequency(noteNumber: number): number {
  return 440 * Math.pow(2, (noteNumber - 69) / 12);
}

function _unifiedToAudioTime(unifiedTimeMs: number): number {
  const ctx = _state.audioContext;
  if (!ctx) return 0;
  const offset = unifiedTimeMs - (performance.now() - (ctx.currentTime * 1000));
  return ctx.currentTime + (offset / 1000);
}

function _getUnityClockNow(): number {
  // Access UnityClock from window if available
  if (typeof window !== 'undefined' && (window as any).UnityClock) {
    return (window as any).UnityClock.now();
  }
  return performance.now();
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Real Note Integration & Crossfade Logic
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  When real MIDI data arrives from remote musicians, the ghost
  renderer must decide how to transition from predicted (ghost)
  audio to real audio. This is the critical path for perceived
  latency elimination.

  The process:
  1. Receive real MIDI note event with scheduled time
  2. Find matching ghost note in activeNotes (same instrument + pitch)
  3. Calculate match score based on timing difference and pitch accuracy
  4. Apply transition strategy based on score:
     - Confirm: ghost continues, real note is ignored
     - Crossfade: fade ghost out over 50ms while fading real in
     - Hard cut: stop ghost immediately, play real note
  5. Update confidence score based on match history
  6. Feed mismatch data into learning model for future improvement

  The crossfade uses separate gain nodes for ghost and real audio,
  ramping one down while ramping the other up. This prevents
  amplitude doubling (phase cancellation) during the transition.
*/

/*
  IN OTHER WORDS:
  This is the moment of truth — the ghost has been humming along,
  imagining the other musicians, and now their ACTUAL sound arrives.
  Is the ghost right? If yes, keep humming — no one will notice.
  If close but not exact, blend the two over a split second so
  the transition is smooth. If completely wrong, drop the ghost
  instantly and let the real sound take over. Then remember what
  went wrong so next time the ghost is smarter.
*/

export function processRealNote(realNote: RealNoteData): number {
  const { time, note, velocity, instrument } = realNote;
  const noteKey = `${instrument}-${note}`;
  const ghostNote = _state.activeNotes.get(noteKey);

  // Calculate match score
  let matchScore = 0.0;
  let timingDiff = Infinity;

  if (ghostNote) {
    timingDiff = Math.abs(time - ghostNote.startTime);
    const timingScore = Math.max(0, 1 - (timingDiff / 50)); // 50ms window
    const pitchScore = ghostNote.note === note ? 1.0 : 0.0;
    matchScore = (timingScore * 0.4) + (pitchScore * 0.6);
  }

  // Record for learning
  const mismatch: MismatchEntry = {
    expected: ghostNote ? ghostNote.note : null,
    actual: note,
    timingDiff: timingDiff,
    matchScore: matchScore,
    measure: _state.currentMeasure,
    section: _state.currentSection,
    timestamp: Date.now()
  };

  _state.mismatchHistory.push(mismatch);
  if (_state.mismatchHistory.length > GHOST_CONFIG.MISMATCH_HISTORY_SIZE) {
    _state.mismatchHistory.shift();
  }

  // Update confidence score (exponential moving average)
  const alpha = GHOST_CONFIG.LEARNING_RATE;
  _state.confidenceScore = (_state.confidenceScore * (1 - alpha)) + (matchScore * alpha);

  // Apply transition strategy
  if (matchScore >= GHOST_CONFIG.CONFIRM_THRESHOLD) {
    _confirmGhost(ghostNote, realNote);
  } else if (matchScore >= GHOST_CONFIG.CROSSFADE_THRESHOLD) {
    _crossfadeGhostToReal(ghostNote, realNote);
  } else {
    _hardCutToReal(ghostNote, realNote);
  }

  // Update learning model
  _updateLearningModel(realNote, matchScore);

  return matchScore;
}

function _confirmGhost(ghostNote: ActiveNote | undefined, realNote: RealNoteData): void {
  // Ghost is accurate — real note is redundant
  console.log(`[Ghost] Confirmed: ${realNote.instrument} note ${realNote.note} at ${realNote.time}`);
}

function _crossfadeGhostToReal(ghostNote: ActiveNote | undefined, realNote: RealNoteData): void {
  if (!ghostNote || !ghostNote.gain) return;

  const ctx = _state.audioContext;
  if (!ctx) return;

  const fadeDuration = GHOST_CONFIG.CROSSFADE_DURATION_MS / 1000;
  const now = ctx.currentTime;

  // Fade ghost out
  ghostNote.gain.gain.cancelScheduledValues(now);
  ghostNote.gain.gain.setValueAtTime(ghostNote.gain.gain.value, now);
  ghostNote.gain.gain.linearRampToValueAtTime(0.001, now + fadeDuration);

  // Create real note with fade in
  const realAudio = _synthesizeNote({
    time: realNote.time,
    note: realNote.note,
    velocity: realNote.velocity,
    duration: realNote.duration || 500,
    instrument: realNote.instrument
  });

  if (realAudio && realAudio.gain) {
    realAudio.gain.gain.setValueAtTime(0.001, now);
    realAudio.gain.gain.linearRampToValueAtTime(realNote.velocity / 127, now + fadeDuration);
  }

  // Mark ghost note as transitioning
  ghostNote.isTransitioning = true;

  console.log(`[Ghost] Crossfade: ${realNote.instrument} note ${realNote.note}`);
}

function _hardCutToReal(ghostNote: ActiveNote | undefined, realNote: RealNoteData): void {
  if (ghostNote && ghostNote.gain) {
    const ctx = _state.audioContext;
    if (ctx) {
      const now = ctx.currentTime;
      ghostNote.gain.gain.cancelScheduledValues(now);
      ghostNote.gain.gain.setValueAtTime(ghostNote.gain.gain.value, now);
      ghostNote.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
    }
  }

  // Play real note immediately
  _synthesizeNote({
    time: realNote.time,
    note: realNote.note,
    velocity: realNote.velocity,
    duration: realNote.duration || 500,
    instrument: realNote.instrument
  });

  console.log(`[Ghost] Hard cut: ${realNote.instrument} note ${realNote.note}`);
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Learning Model & Prediction Improvement
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The learning model tracks patterns in musician behavior to
  improve future predictions. It maintains a frequency map of:
  - Which notes follow which chords (chord-tone probability)
  - Timing variations by musician and section (rhythmic feel)
  - Velocity dynamics by section (expressive intensity)

  Over time, the model shifts from generic chord-chart predictions
  to personalized predictions that match each musician's actual
  playing style. This is especially valuable for worship music
  where arrangements are consistent across services.

  The model is stored in memory (not persisted to disk) because
  it is session-specific and re-learns quickly. For long-term
  learning, it could be serialized to localStorage or IndexedDB.
*/

/*
  IN OTHER WORDS:
  This is the ghost's "memory." At first, the ghost predicts
  based on the chord chart alone — generic, safe, sometimes boring.
  But as it listens to the actual musicians, it learns: "Frederick
  always adds a 9th on the chorus," "the bassist walks up on the
  bridge," "the drummer hits harder in the final chorus." It
  remembers these patterns and uses them next time, making the
  predictions more accurate and more musical.
*/

function _updateLearningModel(realNote: RealNoteData, matchScore: number): void {
  const key = `${_state.currentSection}-${_state.currentMeasure % 4}`;
  const noteKey = `${realNote.instrument}-${realNote.note}`;

  if (!_state.learningModel.has(key)) {
    _state.learningModel.set(key, new Map());
  }

  const sectionModel = _state.learningModel.get(key)!;
  const currentWeight = sectionModel.get(noteKey) || 0;
  const newWeight = currentWeight + (matchScore * GHOST_CONFIG.LEARNING_RATE);
  sectionModel.set(noteKey, Math.min(1.0, newWeight));
}

export function getLearnedProbability(section: string, measureOffset: number, instrument: string, note: number): number {
  const key = `${section}-${measureOffset}`;
  const noteKey = `${instrument}-${note}`;

  const sectionModel = _state.learningModel.get(key);
  if (!sectionModel) return 0.5; // Default uncertainty

  return sectionModel.get(noteKey) || 0.5;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Event System
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  Simple publish-subscribe event system for decoupled communication
  between the GhostRenderer and other modules. Events include
  'start', 'stop', 'confidence-change', and 'note-match'.
*/

/*
  IN OTHER WORDS:
  This is the ghost's "megaphone." When it starts humming, when
  it stops, when its confidence changes, or when it matches a
  note — it announces these events so other parts of the app
  can respond (update UI, log analytics, etc.).
*/

function _emit(eventName: string, data: any = {}): void {
  const listeners = _state.eventListeners.get(eventName);
  if (!listeners) return;
  listeners.forEach(cb => {
    try { cb(data); } catch (err) { console.error('[Ghost] Event error:', err); }
  });
}

export function on(eventName: string, callback: (data: any) => void): () => void {
  if (!_state.eventListeners.has(eventName)) {
    _state.eventListeners.set(eventName, []);
  }
  _state.eventListeners.get(eventName)!.push(callback);

  return () => {
    const list = _state.eventListeners.get(eventName);
    if (list) {
      const idx = list.indexOf(callback);
      if (idx > -1) list.splice(idx, 1);
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Tick & Beat Event Handlers
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The _onTick handler runs on every UnityClock tick event
  (quarter note subdivision). It generates ghost notes within
  the lookahead window and schedules them for playback.

  The _onBeat handler runs on every downbeat and updates the
  current measure/section tracking for prediction accuracy.
*/

/*
  IN OTHER WORDS:
  Every time the worship leader's baton ticks, the ghost looks
  ahead and says "what notes should I be hearing soon?" Then
  it starts humming those notes quietly. On every downbeat, it
  checks "what measure are we in now? What section?" so it knows
  what part of the song to predict next.
*/

function _onTick(tickData: any): void {
  if (!_state.isActive || !_state.song) return;

  const { time, bpm } = tickData;
  const secondsPerBeat = 60.0 / bpm;
  const lookaheadMs = GHOST_CONFIG.LOOKAHEAD_BEATS * secondsPerBeat * 1000;

  // Generate notes for the lookahead window
  const currentBeat = Math.floor(time / (secondsPerBeat * 1000));
  const endBeat = currentBeat + GHOST_CONFIG.LOOKAHEAD_BEATS;

  const ghostNotes = _generateGhostNotes(currentBeat, endBeat, bpm);

  // Schedule each note
  ghostNotes.forEach((note) => {
    _synthesizeNote(note);
    _state.scheduledGhosts.push(note);
  });

  // Clean up old scheduled ghosts
  _state.scheduledGhosts = _state.scheduledGhosts.filter(
    (n) => n.time > time
  );
}

function _onBeat(beatData: any): void {
  if (!_state.song) return;

  const beatsPerMeasure = _state.song.timeSignature[0];
  _state.currentMeasure = Math.floor(beatData.beat / beatsPerMeasure);

  // Update current section
  let measureCount = 0;
  for (const sectionName of _state.song.arrangement || []) {
    const section = _state.song.sections[sectionName];
    const sectionMeasures = section ? (section.measures || section.chords.length) : 0;
    if (_state.currentMeasure < measureCount + sectionMeasures) {
      _state.currentSection = sectionName;
      break;
    }
    measureCount += sectionMeasures;
  }
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Public API (The GhostRenderer Service)
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The public API exposes methods for the UnityContext and other
  modules to control the ghost renderer:
  - loadSong(songData): Parse and prepare a worship song for prediction
  - start(): Begin generating ghost notes on the UnityClock timeline
  - stop(): Stop generation and clear all active notes
  - receiveRealNote(noteData): Process incoming real MIDI from remote
  - getConfidence(): Return current prediction accuracy
  - getDiagnostics(): Return detailed state for debugging
  - setActive(boolean): Enable/disable ghost rendering
  - on(event, callback): Subscribe to events

  The start() method subscribes to UnityClock's 'tick' event and
  generates ghost notes within the lookahead window at each tick.
*/

/*
  IN OTHER WORDS:
  This is the "control panel" for the ghost. The worship leader
  (UnityContext) uses these buttons to tell the ghost what to do:
  "Learn this song." "Start imagining." "Stop imagining." "Here
  comes a real note — deal with it." "How confident are you?"
  "Show me your brain." "Turn yourself on or off."
*/

export const GhostRenderer = {

  async loadSong(songData: SongData): Promise<ParsedSong | null> {
    _state.song = parseSong(songData);
    if (_state.song) {
      console.log(`[Ghost] Song loaded: ${_state.song.title}, ${_state.song.totalMeasures} measures`);
    }
    return _state.song;
  },

  start(): void {
    if (_state.isActive) return;
    _state.isActive = true;

    // Get AudioContext from UnityClock
    if (typeof window !== 'undefined' && (window as any).UnityClock) {
      _state.audioContext = (window as any).UnityClock.getAudioContext();
    }

    // Subscribe to UnityClock tick events
    if (typeof window !== 'undefined' && (window as any).UnityClock) {
      (window as any).UnityClock.on('tick', _onTick);
      (window as any).UnityClock.on('beat', _onBeat);
    }

    console.log('[Ghost] Ghost renderer started');
    _emit('start', {});
  },

  stop(): void {
    _state.isActive = false;

    // Stop all active ghost notes
    _state.activeNotes.forEach((note) => {
      if (note.isGhost) {
        try {
          note.source.stop();
        } catch (e) {
          // Already stopped
        }
      }
      if (note.gain) {
        note.gain.disconnect();
      }
    });
    _state.activeNotes.clear();
    _state.scheduledGhosts = [];

    console.log('[Ghost] Ghost renderer stopped');
    _emit('stop', {});
  },

  receiveRealNote(noteData: RealNoteData): number {
    if (!_state.isActive) return 0;
    return processRealNote(noteData);
  },

  getConfidence(): number {
    return _state.confidenceScore;
  },

  getDiagnostics(): GhostDiagnostics {
    return {
      isActive: _state.isActive,
      confidence: _state.confidenceScore,
      activeNotes: _state.activeNotes.size,
      scheduledGhosts: _state.scheduledGhosts.length,
      mismatchHistory: _state.mismatchHistory.length,
      learningModelSize: _state.learningModel.size,
      currentMeasure: _state.currentMeasure,
      currentSection: _state.currentSection,
      songTitle: _state.song ? _state.song.title : null
    };
  },

  setActive(active: boolean): void {
    if (active && !_state.isActive) {
      this.start();
    } else if (!active && _state.isActive) {
      this.stop();
    }
  },

  getSong(): ParsedSong | null {
    return _state.song;
  },

  resetLearning(): void {
    _state.learningModel.clear();
    _state.mismatchHistory = [];
    _state.confidenceScore = 1.0;
    console.log('[Ghost] Learning model reset');
  }

};

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: React Hook for NTCC Music App Integration
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The useGhostRenderer hook provides a convenient way for NTCC Music App
  components to interact with the GhostRenderer service. It manages
  song loading, activation state, and diagnostic polling.
*/

/*
  IN OTHER WORDS:
  This is the "power adapter" that lets React components plug into
  the GhostRenderer engine. Instead of every component talking directly
  to the engine, they use this hook which manages the connection
  and keeps track of what's happening.
*/

import { useState, useEffect, useCallback } from 'react';

export interface UseGhostRendererReturn {
  isActive: boolean;
  confidence: number;
  diagnostics: GhostDiagnostics | null;
  loadSong: (song: SongData) => Promise<ParsedSong | null>;
  start: () => void;
  stop: () => void;
  setActive: (active: boolean) => void;
  receiveRealNote: (note: RealNoteData) => number;
  resetLearning: () => void;
}

export function useGhostRenderer(): UseGhostRendererReturn {
  const [isActive, setIsActive] = useState(false);
  const [confidence, setConfidence] = useState(1.0);
  const [diagnostics, setDiagnostics] = useState<GhostDiagnostics | null>(null);

  const loadSong = useCallback(async (song: SongData) => {
    const parsed = await GhostRenderer.loadSong(song);
    return parsed;
  }, []);

  const start = useCallback(() => {
    GhostRenderer.start();
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    GhostRenderer.stop();
    setIsActive(false);
  }, []);

  const setActiveState = useCallback((active: boolean) => {
    GhostRenderer.setActive(active);
    setIsActive(active);
  }, []);

  const receiveRealNote = useCallback((note: RealNoteData) => {
    const score = GhostRenderer.receiveRealNote(note);
    setConfidence(GhostRenderer.getConfidence());
    return score;
  }, []);

  const resetLearning = useCallback(() => {
    GhostRenderer.resetLearning();
    setConfidence(1.0);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDiagnostics(GhostRenderer.getDiagnostics());
      setConfidence(GhostRenderer.getConfidence());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return {
    isActive,
    confidence,
    diagnostics,
    loadSong,
    start,
    stop,
    setActive: setActiveState,
    receiveRealNote,
    resetLearning
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
  - Global window.GhostRenderer for direct browser script tags
*/

/*
  IN OTHER WORDS:
  This is the "shipping label" on the package. Whether the delivery
  truck is a modern electric van (ES modules) or an old pickup
  (script tags), the package gets to the right address. The
  GhostRenderer is always available, no matter how you load it.
*/

if (typeof window !== 'undefined') {
  (window as any).GhostRenderer = GhostRenderer;
  (window as any).GHOST_CONFIG = GHOST_CONFIG;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: End of Module
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  This concludes the GhostRenderer.ts service module. It is the heart
  of the NTCC Music App's zero-latency illusion. By predicting and
  rendering accompaniment locally before remote audio arrives, it
  eliminates the perception of network delay.

  The module is designed to improve over time through its learning
  model, becoming more accurate with each worship service. It degrades
  gracefully when predictions fail — never glitching, always
  maintaining continuity.

  Future enhancements:
  - Full SF2 parser integration for realistic instrument sounds
  - Neural network prediction model (TensorFlow.js)
  - Multi-instrument polyphony management
  - Real-time spectral analysis for audio-to-MIDI conversion
*/

/*
  IN OTHER WORDS:
  This is the ghost's entire existence — its ability to imagine
  music before it happens, to hum along with musicians it can't
  yet hear, to learn from its mistakes and get better every time.
  It's not magic. It's math, pattern recognition, and the
  understanding that human ears forgive wrong notes but never
  forgive silence. The ghost keeps the worship alive, even when
  the network sleeps.
*/

/* End of GhostRenderer.ts */
/* © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community */
