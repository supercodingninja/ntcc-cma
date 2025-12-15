const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const NOTE_FREQUENCIES = {
  'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83,
  'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
  'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65,
  'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
  'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
  'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
  'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.26, 'F5': 698.46,
  'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91,
  'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53,
  'C7': 2093.00, 'C#7': 2217.46, 'D7': 2349.32, 'D#7': 2489.02, 'E7': 2637.02, 'F7': 2793.83,
  'F#7': 2959.96, 'G7': 3135.96, 'G#7': 3322.44, 'A7': 3520.00, 'A#7': 3729.31, 'B7': 3951.07,
  'C8': 4186.01
};

const INSTRUMENT_WAVEFORMS = {
  piano: { type: 'triangle', attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.3 },
  organ: { type: 'sine', attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.2 },
  strings: { type: 'sawtooth', attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.4 },
  brass: { type: 'square', attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.2 },
  flute: { type: 'sine', attack: 0.1, decay: 0.05, sustain: 0.8, release: 0.3 },
  choir: { type: 'sine', attack: 0.15, decay: 0.2, sustain: 0.7, release: 0.5 },
  guitar: { type: 'triangle', attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 },
  bass: { type: 'sawtooth', attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.3 }
};

class MIDIPlaybackService {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.activeNotes = new Map();
    this.isPlaying = false;
    this.currentTempo = 120;
    this.currentMeasure = 1;
    this.currentBeat = 1;
    this.playbackPosition = 0;
    this.loopStart = null;
    this.loopEnd = null;
    this.isLooping = false;
    this.playbackSpeed = 1.0;
    this.instrument = 'piano';
    this.scheduledNotes = [];
    this.onMeasureChange = null;
    this.onBeatChange = null;
    this.onPlaybackEnd = null;
  }

  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.7;
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this;
  }

  setVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setTempo(bpm) {
    this.currentTempo = Math.max(20, Math.min(300, bpm));
  }

  setPlaybackSpeed(speed) {
    this.playbackSpeed = Math.max(0.25, Math.min(2.0, speed));
  }

  setInstrument(instrument) {
    if (INSTRUMENT_WAVEFORMS[instrument]) {
      this.instrument = instrument;
    }
  }

  setLoop(startMeasure, endMeasure) {
    this.loopStart = startMeasure;
    this.loopEnd = endMeasure;
    this.isLooping = true;
  }

  clearLoop() {
    this.loopStart = null;
    this.loopEnd = null;
    this.isLooping = false;
  }

  getNoteFrequency(note, octave) {
    const noteKey = `${note}${octave}`;
    return NOTE_FREQUENCIES[noteKey] || 440;
  }

  midiNoteToFrequency(midiNote) {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  playNote(frequency, duration = 0.5, velocity = 0.7, startTime = null) {
    if (!this.audioContext) return null;

    const now = startTime || this.audioContext.currentTime;
    const settings = INSTRUMENT_WAVEFORMS[this.instrument];

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    oscillator.type = settings.type;
    oscillator.frequency.setValueAtTime(frequency, now);

    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(2000 + (velocity * 3000), now);
    filterNode.Q.value = 1;

    const adjustedDuration = duration / this.playbackSpeed;
    const attackTime = settings.attack;
    const decayTime = settings.decay;
    const sustainLevel = settings.sustain * velocity;
    const releaseTime = settings.release;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(velocity, now + attackTime);
    gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
    gainNode.gain.setValueAtTime(sustainLevel, now + adjustedDuration - releaseTime);
    gainNode.gain.linearRampToValueAtTime(0, now + adjustedDuration);

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + adjustedDuration + 0.1);

    const noteId = `${frequency}-${now}`;
    this.activeNotes.set(noteId, { oscillator, gainNode });

    oscillator.onended = () => {
      this.activeNotes.delete(noteId);
    };

    return noteId;
  }

  playChord(notes, duration = 0.5, velocity = 0.6) {
    const noteIds = [];
    notes.forEach((note, index) => {
      const freq = typeof note === 'number' ? this.midiNoteToFrequency(note) : this.getNoteFrequency(note.name, note.octave);
      const adjustedVelocity = velocity * (1 - index * 0.05);
      const noteId = this.playNote(freq, duration, adjustedVelocity);
      if (noteId) noteIds.push(noteId);
    });
    return noteIds;
  }

  async playSequence(sequence, onProgress = null) {
    if (!this.audioContext) await this.initialize();

    this.isPlaying = true;
    const startTime = this.audioContext.currentTime;
    const beatDuration = 60 / (this.currentTempo * this.playbackSpeed);

    for (let i = 0; i < sequence.length && this.isPlaying; i++) {
      const event = sequence[i];
      const eventTime = startTime + (event.time * beatDuration);

      if (this.isLooping) {
        if (event.measure < this.loopStart || event.measure > this.loopEnd) {
          continue;
        }
      }

      if (event.type === 'note') {
        const freq = typeof event.note === 'number'
          ? this.midiNoteToFrequency(event.note)
          : this.getNoteFrequency(event.note, event.octave || 4);
        this.playNote(freq, event.duration * beatDuration, event.velocity || 0.7, eventTime);
      } else if (event.type === 'chord') {
        this.playChord(event.notes, event.duration * beatDuration, event.velocity || 0.6);
      }

      if (event.measure !== this.currentMeasure) {
        this.currentMeasure = event.measure;
        if (this.onMeasureChange) this.onMeasureChange(event.measure);
      }

      if (event.beat !== this.currentBeat) {
        this.currentBeat = event.beat;
        if (this.onBeatChange) this.onBeatChange(event.beat);
      }

      if (onProgress) {
        onProgress({
          measure: event.measure,
          beat: event.beat,
          progress: i / sequence.length,
          currentTime: eventTime - startTime
        });
      }

      this.scheduledNotes.push(eventTime);
    }

    if (this.isLooping && this.isPlaying) {
      const loopSequence = sequence.filter(e => e.measure >= this.loopStart && e.measure <= this.loopEnd);
      setTimeout(() => {
        if (this.isPlaying) this.playSequence(loopSequence, onProgress);
      }, (sequence[sequence.length - 1]?.time || 1) * beatDuration * 1000);
    } else if (this.onPlaybackEnd) {
      const totalDuration = (sequence[sequence.length - 1]?.time || 1) * beatDuration;
      setTimeout(() => {
        if (!this.isLooping) {
          this.isPlaying = false;
          this.onPlaybackEnd();
        }
      }, totalDuration * 1000);
    }
  }

  stop() {
    this.isPlaying = false;
    this.activeNotes.forEach(({ oscillator, gainNode }) => {
      try {
        gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.05);
        oscillator.stop(this.audioContext.currentTime + 0.1);
      } catch (e) {}
    });
    this.activeNotes.clear();
    this.scheduledNotes = [];
  }

  pause() {
    this.isPlaying = false;
  }

  resume() {
    this.isPlaying = true;
  }

  generateScaleSequence(rootNote, scaleType = 'major', octave = 4, direction = 'ascending') {
    const scales = {
      major: [0, 2, 4, 5, 7, 9, 11, 12],
      minor: [0, 2, 3, 5, 7, 8, 10, 12],
      harmonicMinor: [0, 2, 3, 5, 7, 8, 11, 12],
      melodicMinor: [0, 2, 3, 5, 7, 9, 11, 12],
      pentatonic: [0, 2, 4, 7, 9, 12],
      blues: [0, 3, 5, 6, 7, 10, 12],
      chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      dorian: [0, 2, 3, 5, 7, 9, 10, 12],
      phrygian: [0, 1, 3, 5, 7, 8, 10, 12],
      lydian: [0, 2, 4, 6, 7, 9, 11, 12],
      mixolydian: [0, 2, 4, 5, 7, 9, 10, 12]
    };

    const intervals = scales[scaleType] || scales.major;
    const rootIndex = NOTES.indexOf(rootNote);
    if (rootIndex === -1) return [];

    const sequence = intervals.map((interval, i) => {
      const noteIndex = (rootIndex + interval) % 12;
      const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
      return {
        type: 'note',
        note: NOTES[noteIndex],
        octave: noteOctave,
        time: i * 0.5,
        duration: 0.45,
        velocity: 0.7,
        measure: Math.floor(i / 4) + 1,
        beat: (i % 4) + 1
      };
    });

    if (direction === 'descending') {
      return sequence.reverse().map((note, i) => ({ ...note, time: i * 0.5 }));
    } else if (direction === 'both') {
      const descending = [...sequence].reverse().slice(1).map((note, i) => ({
        ...note,
        time: (sequence.length + i) * 0.5
      }));
      return [...sequence, ...descending];
    }

    return sequence;
  }

  generateArpeggioSequence(chord, octave = 4, pattern = 'up') {
    const chordTypes = {
      major: [0, 4, 7],
      minor: [0, 3, 7],
      diminished: [0, 3, 6],
      augmented: [0, 4, 8],
      major7: [0, 4, 7, 11],
      minor7: [0, 3, 7, 10],
      dominant7: [0, 4, 7, 10],
      sus2: [0, 2, 7],
      sus4: [0, 5, 7]
    };

    const [rootNote, chordType] = chord.split(/(?=[mM7]|dim|aug|sus)/);
    const intervals = chordTypes[chordType?.toLowerCase()] || chordTypes.major;
    const rootIndex = NOTES.indexOf(rootNote);
    if (rootIndex === -1) return [];

    let notes = intervals.map((interval) => {
      const noteIndex = (rootIndex + interval) % 12;
      const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
      return { note: NOTES[noteIndex], octave: noteOctave };
    });

    const patterns = {
      up: notes,
      down: [...notes].reverse(),
      upDown: [...notes, ...notes.slice(1, -1).reverse()],
      broken: [notes[0], notes[2], notes[1], notes[2]]
    };

    const patternNotes = patterns[pattern] || patterns.up;

    return patternNotes.map((note, i) => ({
      type: 'note',
      note: note.note,
      octave: note.octave,
      time: i * 0.25,
      duration: 0.2,
      velocity: i === 0 ? 0.8 : 0.6,
      measure: Math.floor(i / 4) + 1,
      beat: (i % 4) + 1
    }));
  }

  playMetronomeClick(isAccent = false) {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = isAccent ? 1200 : 800;

    gainNode.gain.setValueAtTime(isAccent ? 0.5 : 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }

  dispose() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const midiPlayback = new MIDIPlaybackService();
export default midiPlayback;
