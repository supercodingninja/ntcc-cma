/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NTCC MUSIC APP — src/lib/instrumentMap.ts
 * Instrument-to-SF2 Preset Mapping: Standardized mapping from musical instrument
 * names to General MIDI/SoundFont bank:preset numbers. Enables "load piano"
 * without knowing the SoundFont's internal structure.
 *
 * Adapted from The Unity Solution™ for NTCC Music App
 * © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Module Header & General MIDI Mapping
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  General MIDI (GM) is a standardized specification that assigns
  specific instrument sounds to specific program numbers (0-127)
  across all MIDI devices. This ensures that "program 1" always
  means "Acoustic Grand Piano" regardless of which synthesizer
  or SoundFont is being used.

  The mapping in this module connects human-friendly instrument
  names ("piano", "acoustic-guitar", "saxophone") to their GM
  bank:preset numbers, which the synthesis engine uses to find
  the correct samples in any GM-compatible SoundFont.

  Bank 0: Melodic instruments (piano, guitar, strings, etc.)
  Bank 128: Drum kits (standard drum set, power drums, etc.)

  Each instrument entry includes:
  - name: Human-friendly name
  - gmName: Official General MIDI name
  - bank: MIDI bank number (usually 0)
  - preset: MIDI program number (0-127)
  - category: Instrument family
  - defaultVelocity: Suggested default velocity (0-127)
  - range: Suggested playable note range (MIDI note numbers)

  This abstraction allows musicians to request instruments by
  name without understanding the underlying SoundFont structure.
*/

/*
  IN OTHER WORDS:
  This is the "translation dictionary" between "what musicians
  say" and "what computers understand." When a musician says
  "I want piano," the computer needs to know "look in bank 0,
  preset 1." This dictionary handles that translation. It also
  knows that "saxophone" is bank 0, preset 65, and "drums" is
  bank 128, preset 0. It makes the system feel intuitive —
  you ask for instruments by name, not by numbers.
*/

'use strict';

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: TypeScript Interfaces
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  TypeScript interfaces define the structure of instrument data,
  ensuring type safety when looking up instruments by name or
  searching by category. The InstrumentInfo interface contains
  all metadata needed for synthesis and UI display.
*/

/*
  IN OTHER WORDS:
  These are the "name tags" for every instrument in the orchestra.
  Each tag has the instrument's real name, its number, what family
  it belongs to, how loud it normally plays, and how high/low it
  can go.
*/

export interface InstrumentInfo {
  gmName: string;
  bank: number;
  preset: number;
  category: string;
  defaultVelocity: number;
  range: [number, number];
}

export interface InstrumentMap {
  [key: string]: InstrumentInfo;
}

export interface DrumMap {
  [note: number]: string;
}

export interface DrumNoteMap {
  [name: string]: number;
}

export interface WorshipSetup {
  [instrument: string]: InstrumentInfo | null;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: General MIDI Instrument Mapping
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The complete General MIDI instrument mapping covers all 128
  melodic programs and 10 drum kits. Instruments are organized
  by family (piano, organ, guitar, bass, strings, brass, reed,
  synth, ethnic, percussion, sfx, drums).

  For the NTCC Music App, special attention is given to worship
  music common instruments: piano, acoustic guitar, electric guitar,
  bass, strings, organ, drums, and saxophone.

  The mapping is frozen (Object.freeze) to prevent accidental
  mutation at runtime.
*/

/*
  IN OTHER WORDS:
  This is the complete "orchestra roster" — every instrument
  available, organized by section. When the worship leader says
  "Strings, section 1," everyone knows who should stand up.
  When they say "Bring in the saxophone," the saxophonist knows
  it's their turn. The roster also knows each musician's range
  (how high and low they can play) and their preferred volume
  (how loud they normally play).
*/

export const INSTRUMENT_MAP: InstrumentMap = Object.freeze({
  // Piano family
  'piano':              { gmName: 'Acoustic Grand Piano',     bank: 0, preset: 0,   category: 'piano',      defaultVelocity: 80, range: [21, 108] },
  'bright-piano':       { gmName: 'Bright Acoustic Piano',    bank: 0, preset: 1,   category: 'piano',      defaultVelocity: 80, range: [21, 108] },
  'electric-piano':     { gmName: 'Electric Piano 1',         bank: 0, preset: 4,   category: 'piano',      defaultVelocity: 80, range: [21, 108] },
  'rhodes':             { gmName: 'Electric Piano 1',         bank: 0, preset: 4,   category: 'piano',      defaultVelocity: 80, range: [21, 108] },
  'electric-piano-2':   { gmName: 'Electric Piano 2',         bank: 0, preset: 5,   category: 'piano',      defaultVelocity: 80, range: [21, 108] },
  'harpsichord':        { gmName: 'Harpsichord',              bank: 0, preset: 6,   category: 'piano',      defaultVelocity: 70, range: [21, 108] },
  'clavinet':           { gmName: 'Clavinet',                 bank: 0, preset: 7,   category: 'piano',      defaultVelocity: 80, range: [21, 96] },

  // Chromatic Percussion
  'celesta':            { gmName: 'Celesta',                  bank: 0, preset: 8,   category: 'percussion', defaultVelocity: 70, range: [60, 108] },
  'glockenspiel':       { gmName: 'Glockenspiel',             bank: 0, preset: 9,   category: 'percussion', defaultVelocity: 70, range: [72, 108] },
  'music-box':          { gmName: 'Music Box',                bank: 0, preset: 10,  category: 'percussion', defaultVelocity: 70, range: [60, 108] },
  'vibraphone':         { gmName: 'Vibraphone',               bank: 0, preset: 11,  category: 'percussion', defaultVelocity: 70, range: [53, 96] },
  'marimba':            { gmName: 'Marimba',                  bank: 0, preset: 12,  category: 'percussion', defaultVelocity: 80, range: [48, 96] },
  'xylophone':          { gmName: 'Xylophone',                bank: 0, preset: 13,  category: 'percussion', defaultVelocity: 80, range: [65, 108] },
  'tubular-bells':      { gmName: 'Tubular Bells',            bank: 0, preset: 14,  category: 'percussion', defaultVelocity: 80, range: [60, 96] },
  'dulcimer':           { gmName: 'Dulcimer',                 bank: 0, preset: 15,  category: 'percussion', defaultVelocity: 70, range: [48, 96] },

  // Organ
  'organ':              { gmName: 'Drawbar Organ',            bank: 0, preset: 16,  category: 'organ',      defaultVelocity: 80, range: [36, 96] },
  'drawbar-organ':      { gmName: 'Drawbar Organ',            bank: 0, preset: 16,  category: 'organ',      defaultVelocity: 80, range: [36, 96] },
  'percussive-organ':   { gmName: 'Percussive Organ',         bank: 0, preset: 17,  category: 'organ',      defaultVelocity: 80, range: [36, 96] },
  'rock-organ':         { gmName: 'Rock Organ',               bank: 0, preset: 18,  category: 'organ',      defaultVelocity: 90, range: [36, 96] },
  'church-organ':       { gmName: 'Church Organ',             bank: 0, preset: 19,  category: 'organ',      defaultVelocity: 80, range: [28, 96] },
  'reed-organ':         { gmName: 'Reed Organ',               bank: 0, preset: 20,  category: 'organ',      defaultVelocity: 80, range: [36, 96] },
  'accordion':          { gmName: 'Accordion',                bank: 0, preset: 21,  category: 'organ',      defaultVelocity: 80, range: [36, 96] },
  'harmonica':          { gmName: 'Harmonica',                bank: 0, preset: 22,  category: 'organ',      defaultVelocity: 80, range: [48, 96] },
  'bandoneon':          { gmName: 'Bandoneon',                bank: 0, preset: 23,  category: 'organ',      defaultVelocity: 80, range: [36, 96] },

  // Guitar
  'guitar':             { gmName: 'Acoustic Guitar (nylon)',  bank: 0, preset: 24,  category: 'guitar',     defaultVelocity: 70, range: [40, 88] },
  'nylon-guitar':       { gmName: 'Acoustic Guitar (nylon)',  bank: 0, preset: 24,  category: 'guitar',     defaultVelocity: 70, range: [40, 88] },
  'steel-guitar':       { gmName: 'Acoustic Guitar (steel)',  bank: 0, preset: 25,  category: 'guitar',     defaultVelocity: 75, range: [40, 88] },
  'acoustic-guitar':    { gmName: 'Acoustic Guitar (steel)',  bank: 0, preset: 25,  category: 'guitar',     defaultVelocity: 75, range: [40, 88] },
  'electric-guitar':    { gmName: 'Electric Guitar (jazz)',   bank: 0, preset: 26,  category: 'guitar',     defaultVelocity: 80, range: [40, 88] },
  'jazz-guitar':        { gmName: 'Electric Guitar (jazz)',   bank: 0, preset: 26,  category: 'guitar',     defaultVelocity: 80, range: [40, 88] },
  'clean-guitar':       { gmName: 'Electric Guitar (clean)',  bank: 0, preset: 27,  category: 'guitar',     defaultVelocity: 80, range: [40, 88] },
  'muted-guitar':       { gmName: 'Electric Guitar (muted)',  bank: 0, preset: 28,  category: 'guitar',     defaultVelocity: 70, range: [40, 88] },
  'overdrive-guitar':   { gmName: 'Overdriven Guitar',        bank: 0, preset: 29,  category: 'guitar',     defaultVelocity: 90, range: [40, 88] },
  'distortion-guitar':  { gmName: 'Distortion Guitar',        bank: 0, preset: 30,  category: 'guitar',     defaultVelocity: 90, range: [40, 88] },
  'guitar-harmonics':   { gmName: 'Guitar Harmonics',         bank: 0, preset: 31,  category: 'guitar',     defaultVelocity: 70, range: [40, 88] },

  // Bass
  'bass':               { gmName: 'Acoustic Bass',            bank: 0, preset: 32,  category: 'bass',       defaultVelocity: 90, range: [28, 72] },
  'acoustic-bass':      { gmName: 'Acoustic Bass',            bank: 0, preset: 32,  category: 'bass',       defaultVelocity: 90, range: [28, 72] },
  'finger-bass':        { gmName: 'Electric Bass (finger)',   bank: 0, preset: 33,  category: 'bass',       defaultVelocity: 90, range: [28, 72] },
  'electric-bass':      { gmName: 'Electric Bass (finger)',   bank: 0, preset: 33,  category: 'bass',       defaultVelocity: 90, range: [28, 72] },
  'pick-bass':          { gmName: 'Electric Bass (pick)',     bank: 0, preset: 34,  category: 'bass',       defaultVelocity: 90, range: [28, 72] },
  'fretless-bass':      { gmName: 'Fretless Bass',            bank: 0, preset: 35,  category: 'bass',       defaultVelocity: 85, range: [28, 72] },
  'slap-bass':          { gmName: 'Slap Bass 1',              bank: 0, preset: 36,  category: 'bass',       defaultVelocity: 100, range: [28, 72] },
  'synth-bass':         { gmName: 'Synth Bass 1',             bank: 0, preset: 38,  category: 'bass',       defaultVelocity: 90, range: [28, 72] },

  // Strings
  'violin':             { gmName: 'Violin',                   bank: 0, preset: 40,  category: 'strings',    defaultVelocity: 70, range: [55, 103] },
  'viola':              { gmName: 'Viola',                    bank: 0, preset: 41,  category: 'strings',    defaultVelocity: 70, range: [48, 96] },
  'cello':              { gmName: 'Cello',                    bank: 0, preset: 42,  category: 'strings',    defaultVelocity: 70, range: [36, 84] },
  'contrabass':         { gmName: 'Contrabass',               bank: 0, preset: 43,  category: 'strings',    defaultVelocity: 70, range: [28, 72] },
  'strings':            { gmName: 'String Ensemble 1',        bank: 0, preset: 48,  category: 'strings',    defaultVelocity: 70, range: [36, 96] },
  'string-ensemble':    { gmName: 'String Ensemble 1',        bank: 0, preset: 48,  category: 'strings',    defaultVelocity: 70, range: [36, 96] },
  'synth-strings':      { gmName: 'Synth Strings 1',          bank: 0, preset: 50,  category: 'strings',    defaultVelocity: 70, range: [36, 96] },
  'orchestra-hit':      { gmName: 'Orchestra Hit',            bank: 0, preset: 55,  category: 'strings',    defaultVelocity: 100, range: [48, 84] },

  // Choir / Voice
  'choir':              { gmName: 'Choir Aahs',               bank: 0, preset: 52,  category: 'voice',      defaultVelocity: 70, range: [48, 96] },
  'choir-aahs':         { gmName: 'Choir Aahs',               bank: 0, preset: 52,  category: 'voice',      defaultVelocity: 70, range: [48, 96] },
  'voice-oohs':         { gmName: 'Voice Oohs',               bank: 0, preset: 53,  category: 'voice',      defaultVelocity: 70, range: [48, 96] },
  'synth-voice':        { gmName: 'Synth Voice',              bank: 0, preset: 54,  category: 'voice',      defaultVelocity: 70, range: [48, 96] },
  'vocals':             { gmName: 'Synth Voice',              bank: 0, preset: 54,  category: 'voice',      defaultVelocity: 70, range: [48, 96] },

  // Brass
  'trumpet':            { gmName: 'Trumpet',                  bank: 0, preset: 56,  category: 'brass',      defaultVelocity: 80, range: [48, 96] },
  'trombone':           { gmName: 'Trombone',                 bank: 0, preset: 57,  category: 'brass',      defaultVelocity: 80, range: [36, 84] },
  'tuba':               { gmName: 'Tuba',                     bank: 0, preset: 58,  category: 'brass',      defaultVelocity: 80, range: [28, 72] },
  'french-horn':        { gmName: 'French Horn',              bank: 0, preset: 60,  category: 'brass',      defaultVelocity: 75, range: [36, 84] },
  'brass-section':      { gmName: 'Brass Section',            bank: 0, preset: 61,  category: 'brass',      defaultVelocity: 85, range: [36, 96] },
  'synth-brass':        { gmName: 'Synth Brass 1',            bank: 0, preset: 62,  category: 'brass',      defaultVelocity: 85, range: [36, 96] },

  // Reed / Woodwind
  'saxophone':          { gmName: 'Alto Sax',                 bank: 0, preset: 65,  category: 'reed',       defaultVelocity: 80, range: [48, 96] },
  'alto-sax':           { gmName: 'Alto Sax',                 bank: 0, preset: 65,  category: 'reed',       defaultVelocity: 80, range: [48, 96] },
  'tenor-sax':          { gmName: 'Tenor Sax',                bank: 0, preset: 66,  category: 'reed',       defaultVelocity: 80, range: [44, 92] },
  'baritone-sax':       { gmName: 'Baritone Sax',             bank: 0, preset: 67,  category: 'reed',       defaultVelocity: 80, range: [36, 84] },
  'oboe':               { gmName: 'Oboe',                     bank: 0, preset: 68,  category: 'reed',       defaultVelocity: 70, range: [55, 103] },
  'english-horn':       { gmName: 'English Horn',             bank: 0, preset: 69,  category: 'reed',       defaultVelocity: 70, range: [48, 96] },
  'bassoon':            { gmName: 'Bassoon',                  bank: 0, preset: 70,  category: 'reed',       defaultVelocity: 75, range: [28, 72] },
  'clarinet':           { gmName: 'Clarinet',                 bank: 0, preset: 71,  category: 'reed',       defaultVelocity: 70, range: [48, 96] },
  'flute':              { gmName: 'Flute',                    bank: 0, preset: 73,  category: 'reed',       defaultVelocity: 70, range: [60, 108] },
  'recorder':           { gmName: 'Recorder',                 bank: 0, preset: 74,  category: 'reed',       defaultVelocity: 70, range: [60, 96] },
  'pan-flute':          { gmName: 'Pan Flute',                bank: 0, preset: 75,  category: 'reed',       defaultVelocity: 70, range: [60, 96] },

  // Synth Lead
  'synth-lead':         { gmName: 'Lead 1 (square)',          bank: 0, preset: 80,  category: 'synth',      defaultVelocity: 80, range: [36, 96] },
  'synth-pad':          { gmName: 'Pad 1 (new age)',          bank: 0, preset: 88,  category: 'synth',      defaultVelocity: 70, range: [36, 96] },
  'synth-fx':           { gmName: 'FX 1 (rain)',              bank: 0, preset: 96,  category: 'synth',      defaultVelocity: 80, range: [36, 96] },

  // Ethnic
  'sitar':              { gmName: 'Sitar',                    bank: 0, preset: 104, category: 'ethnic',     defaultVelocity: 70, range: [48, 96] },
  'banjo':              { gmName: 'Banjo',                    bank: 0, preset: 105, category: 'ethnic',     defaultVelocity: 80, range: [48, 96] },
  'shamisen':           { gmName: 'Shamisen',                 bank: 0, preset: 106, category: 'ethnic',     defaultVelocity: 70, range: [48, 96] },
  'koto':               { gmName: 'Koto',                     bank: 0, preset: 107, category: 'ethnic',     defaultVelocity: 70, range: [48, 96] },
  'kalimba':            { gmName: 'Kalimba',                  bank: 0, preset: 108, category: 'ethnic',     defaultVelocity: 70, range: [60, 96] },
  'bagpipe':            { gmName: 'Bagpipe',                  bank: 0, preset: 109, category: 'ethnic',     defaultVelocity: 80, range: [48, 96] },
  'fiddle':             { gmName: 'Fiddle',                   bank: 0, preset: 110, category: 'ethnic',     defaultVelocity: 80, range: [48, 96] },
  'shanai':             { gmName: 'Shanai',                   bank: 0, preset: 111, category: 'ethnic',     defaultVelocity: 80, range: [48, 96] },

  // Percussive
  'tinkle-bell':        { gmName: 'Tinkle Bell',              bank: 0, preset: 112, category: 'percussion', defaultVelocity: 80, range: [72, 108] },
  'agogo':              { gmName: 'Agogo',                    bank: 0, preset: 113, category: 'percussion', defaultVelocity: 80, range: [60, 96] },
  'steel-drums':        { gmName: 'Steel Drums',              bank: 0, preset: 114, category: 'percussion', defaultVelocity: 80, range: [48, 84] },
  'woodblock':          { gmName: 'Woodblock',                bank: 0, preset: 115, category: 'percussion', defaultVelocity: 80, range: [60, 96] },
  'taiko-drum':         { gmName: 'Taiko Drum',               bank: 0, preset: 116, category: 'percussion', defaultVelocity: 100, range: [36, 72] },
  'melodic-tom':        { gmName: 'Melodic Tom',              bank: 0, preset: 117, category: 'percussion', defaultVelocity: 80, range: [36, 72] },
  'synth-drum':         { gmName: 'Synth Drum',               bank: 0, preset: 118, category: 'percussion', defaultVelocity: 90, range: [36, 72] },
  'reverse-cymbal':     { gmName: 'Reverse Cymbal',           bank: 0, preset: 119, category: 'percussion', defaultVelocity: 80, range: [48, 84] },

  // Sound Effects
  'guitar-fret-noise':  { gmName: 'Guitar Fret Noise',        bank: 0, preset: 120, category: 'sfx',        defaultVelocity: 70, range: [60, 96] },
  'breath-noise':       { gmName: 'Breath Noise',             bank: 0, preset: 121, category: 'sfx',        defaultVelocity: 60, range: [60, 96] },
  'seashore':           { gmName: 'Seashore',                 bank: 0, preset: 122, category: 'sfx',        defaultVelocity: 80, range: [36, 96] },
  'bird-tweet':         { gmName: 'Bird Tweet',               bank: 0, preset: 123, category: 'sfx',        defaultVelocity: 70, range: [72, 108] },
  'helicopter':         { gmName: 'Helicopter',               bank: 0, preset: 125, category: 'sfx',        defaultVelocity: 80, range: [36, 72] },
  'applause':           { gmName: 'Applause',                 bank: 0, preset: 126, category: 'sfx',        defaultVelocity: 90, range: [36, 96] },
  'gunshot':            { gmName: 'Gunshot',                  bank: 0, preset: 127, category: 'sfx',        defaultVelocity: 100, range: [36, 72] },

  // Drum Kits (Bank 128)
  'drums':              { gmName: 'Standard Drum Kit',        bank: 128, preset: 0,  category: 'drums',      defaultVelocity: 100, range: [35, 81] },
  'drum-kit':           { gmName: 'Standard Drum Kit',        bank: 128, preset: 0,  category: 'drums',      defaultVelocity: 100, range: [35, 81] },
  'standard-drums':     { gmName: 'Standard Drum Kit',        bank: 128, preset: 0,  category: 'drums',      defaultVelocity: 100, range: [35, 81] },
  'room-drums':         { gmName: 'Room Drum Kit',            bank: 128, preset: 8,  category: 'drums',      defaultVelocity: 100, range: [35, 81] },
  'power-drums':        { gmName: 'Power Drum Kit',           bank: 128, preset: 16, category: 'drums',      defaultVelocity: 110, range: [35, 81] },
  'electronic-drums':   { gmName: 'Electronic Drum Kit',      bank: 128, preset: 24, category: 'drums',      defaultVelocity: 100, range: [35, 81] },
  'tr-808':             { gmName: 'TR-808 Drum Kit',          bank: 128, preset: 25, category: 'drums',      defaultVelocity: 100, range: [35, 81] },
  'jazz-drums':         { gmName: 'Jazz Drum Kit',            bank: 128, preset: 32, category: 'drums',      defaultVelocity: 90, range: [35, 81] },
  'brush-drums':        { gmName: 'Brush Drum Kit',           bank: 128, preset: 40, category: 'drums',      defaultVelocity: 80, range: [35, 81] },
  'orchestra-drums':    { gmName: 'Orchestra Drum Kit',       bank: 128, preset: 48, category: 'drums',      defaultVelocity: 100, range: [35, 81] },
  'sfx-kit':            { gmName: 'Sound FX Kit',             bank: 128, preset: 56, category: 'drums',      defaultVelocity: 100, range: [35, 81] }
});

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Drum Note Mapping (Bank 128)
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  Drum kits use a different mapping than melodic instruments.
  Each MIDI note triggers a different drum sound rather than
  a pitch. This mapping connects note numbers to drum names
  for the standard GM drum kit.

  Standard GM drum mapping (notes 35-81):
  35: Acoustic Bass Drum
  36: Bass Drum 1
  37: Side Stick
  38: Acoustic Snare
  ... etc.

  This allows musicians to trigger drums by name:
  "play kick at velocity 100" instead of "play note 36 at
  velocity 100."
*/

/*
  IN OTHER WORDS:
  This is the "drum kit legend" — the picture on the box that
  shows which pad is which. Note 36 is the kick drum. Note 38
  is the snare. Note 42 is the hi-hat. Instead of memorizing
  numbers, musicians can say "hit the kick" and the system
  knows to play note 36.
*/

export const DRUM_MAP: DrumMap = Object.freeze({
  35: 'acoustic-bass-drum',
  36: 'bass-drum',
  37: 'side-stick',
  38: 'acoustic-snare',
  39: 'hand-clap',
  40: 'electric-snare',
  41: 'low-floor-tom',
  42: 'closed-hi-hat',
  43: 'high-floor-tom',
  44: 'pedal-hi-hat',
  45: 'low-tom',
  46: 'open-hi-hat',
  47: 'low-mid-tom',
  48: 'hi-mid-tom',
  49: 'crash-cymbal-1',
  50: 'high-tom',
  51: 'ride-cymbal-1',
  52: 'chinese-cymbal',
  53: 'ride-bell',
  54: 'tambourine',
  55: 'splash-cymbal',
  56: 'cowbell',
  57: 'crash-cymbal-2',
  58: 'vibraslap',
  59: 'ride-cymbal-2',
  60: 'hi-bongo',
  61: 'low-bongo',
  62: 'mute-hi-conga',
  63: 'open-hi-conga',
  64: 'low-conga',
  65: 'high-timbale',
  66: 'low-timbale',
  67: 'high-agogo',
  68: 'low-agogo',
  69: 'cabasa',
  70: 'maracas',
  71: 'short-whistle',
  72: 'long-whistle',
  73: 'short-guiro',
  74: 'long-guiro',
  75: 'claves',
  76: 'hi-wood-block',
  77: 'low-wood-block',
  78: 'mute-cuica',
  79: 'open-cuica',
  80: 'mute-triangle',
  81: 'open-triangle'
});

// Reverse drum map (name -> note)
export const DRUM_NOTE_MAP: DrumNoteMap = Object.freeze(
  Object.fromEntries(Object.entries(DRUM_MAP).map(([note, name]) => [name, parseInt(note)]))
);

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Public API (The InstrumentMap Service)
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The public API provides instrument lookup and utility functions:
  - get(name): Return instrument info by name
  - getByGMPreset(bank, preset): Find instrument by GM numbers
  - getByCategory(category): List all instruments in a family
  - getDrumNote(drumName): Get MIDI note for a drum sound
  - getDrumName(note): Get drum name for a MIDI note
  - isValid(name): Check if instrument exists
  - listAll(): Return all instrument names
  - listCategories(): Return all category names
  - getDefaultVelocity(name): Get suggested velocity
  - isInRange(name, note): Check if note is in instrument's range

  The getWorshipSetup() helper returns a pre-configured set of
  instruments common in contemporary worship music.
*/

/*
  IN OTHER WORDS:
  This is the "instrument catalog" at the music store. You can
  look up instruments by name, by number, by category, or just
  browse the whole collection. You can check if a note is playable
  on a given instrument (no point asking a tuba to play note 100).
  You can get suggestions for how hard to play (velocity). It's
  the complete reference guide for the orchestra.
*/

export const InstrumentMap = {

  get(name: string): InstrumentInfo | null {
    return INSTRUMENT_MAP[name] || null;
  },

  getByGMPreset(bank: number, preset: number): { name: string } & InstrumentInfo | null {
    for (const [name, info] of Object.entries(INSTRUMENT_MAP)) {
      if (info.bank === bank && info.preset === preset) {
        return { name, ...info };
      }
    }
    return null;
  },

  getByCategory(category: string): Array<{ name: string } & InstrumentInfo> {
    return Object.entries(INSTRUMENT_MAP)
      .filter(([_, info]) => info.category === category)
      .map(([name, info]) => ({ name, ...info }));
  },

  getDrumNote(drumName: string): number | null {
    return DRUM_NOTE_MAP[drumName] || null;
  },

  getDrumName(note: number): string | null {
    return DRUM_MAP[note] || null;
  },

  isValid(name: string): boolean {
    return name in INSTRUMENT_MAP;
  },

  listAll(): string[] {
    return Object.keys(INSTRUMENT_MAP);
  },

  listCategories(): string[] {
    const categories = new Set<string>();
    Object.values(INSTRUMENT_MAP).forEach(info => categories.add(info.category));
    return Array.from(categories);
  },

  getDefaultVelocity(name: string): number {
    const info = this.get(name);
    return info ? info.defaultVelocity : 80;
  },

  isInRange(name: string, note: number): boolean {
    const info = this.get(name);
    if (!info || !info.range) return true;
    return note >= info.range[0] && note <= info.range[1];
  },

  // Helper for worship music common configurations
  getWorshipSetup(): WorshipSetup {
    return {
      piano: this.get('piano'),
      'acoustic-guitar': this.get('acoustic-guitar'),
      bass: this.get('bass'),
      drums: this.get('drums'),
      strings: this.get('strings'),
      'electric-guitar': this.get('electric-guitar'),
      saxophone: this.get('saxophone'),
      organ: this.get('organ')
    };
  },

  // Get all instruments for a specific worship style
  getContemporaryWorshipInstruments(): Array<{ name: string } & InstrumentInfo> {
    const names = ['piano', 'acoustic-guitar', 'electric-guitar', 'bass', 'drums', 'strings', 'synth-pad'];
    return names
      .map(name => {
        const info = this.get(name);
        return info ? { name, ...info } : null;
      })
      .filter((item): item is { name: string } & InstrumentInfo => item !== null);
  },

  getTraditionalWorshipInstruments(): Array<{ name: string } & InstrumentInfo> {
    const names = ['piano', 'organ', 'choir', 'strings', 'brass-section', 'flute'];
    return names
      .map(name => {
        const info = this.get(name);
        return info ? { name, ...info } : null;
      })
      .filter((item): item is { name: string } & InstrumentInfo => item !== null);
  },

  getGospelWorshipInstruments(): Array<{ name: string } & InstrumentInfo> {
    const names = ['piano', 'organ', 'bass', 'drums', 'synth-brass', 'saxophone', 'choir'];
    return names
      .map(name => {
        const info = this.get(name);
        return info ? { name, ...info } : null;
      })
      .filter((item): item is { name: string } & InstrumentInfo => item !== null);
  }

};

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: React Hook for NTCC Music App
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The useInstrumentMap hook provides React components with easy
  access to instrument lookups and worship-specific configurations.
  It memoizes results to prevent unnecessary recalculations.
*/

/*
  IN OTHER WORDS:
  This is the "instrument catalog app" on the worship team's tablet.
  It lets them browse instruments, check if a note is playable,
  and load pre-configured setups for different worship styles.
*/

import { useMemo, useCallback } from 'react';

export interface UseInstrumentMapReturn {
  get: (name: string) => InstrumentInfo | null;
  getByCategory: (category: string) => Array<{ name: string } & InstrumentInfo>;
  getDrumNote: (name: string) => number | null;
  getDrumName: (note: number) => string | null;
  isValid: (name: string) => boolean;
  listAll: () => string[];
  listCategories: () => string[];
  getDefaultVelocity: (name: string) => number;
  isInRange: (name: string, note: number) => boolean;
  worshipSetup: WorshipSetup;
  contemporaryWorship: Array<{ name: string } & InstrumentInfo>;
  traditionalWorship: Array<{ name: string } & InstrumentInfo>;
  gospelWorship: Array<{ name: string } & InstrumentInfo>;
}

export function useInstrumentMap(): UseInstrumentMapReturn {
  const worshipSetup = useMemo(() => InstrumentMap.getWorshipSetup(), []);
  const contemporaryWorship = useMemo(() => InstrumentMap.getContemporaryWorshipInstruments(), []);
  const traditionalWorship = useMemo(() => InstrumentMap.getTraditionalWorshipInstruments(), []);
  const gospelWorship = useMemo(() => InstrumentMap.getGospelWorshipInstruments(), []);

  const get = useCallback((name: string) => InstrumentMap.get(name), []);
  const getByCategory = useCallback((category: string) => InstrumentMap.getByCategory(category), []);
  const getDrumNote = useCallback((name: string) => InstrumentMap.getDrumNote(name), []);
  const getDrumName = useCallback((note: number) => InstrumentMap.getDrumName(note), []);
  const isValid = useCallback((name: string) => InstrumentMap.isValid(name), []);
  const listAll = useCallback(() => InstrumentMap.listAll(), []);
  const listCategories = useCallback(() => InstrumentMap.listCategories(), []);
  const getDefaultVelocity = useCallback((name: string) => InstrumentMap.getDefaultVelocity(name), []);
  const isInRange = useCallback((name: string, note: number) => InstrumentMap.isInRange(name, note), []);

  return {
    get,
    getByCategory,
    getDrumNote,
    getDrumName,
    isValid,
    listAll,
    listCategories,
    getDefaultVelocity,
    isInRange,
    worshipSetup,
    contemporaryWorship,
    traditionalWorship,
    gospelWorship
  };
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Module Export & Global Registration
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  Named exports for ES modules with global fallback for direct
  browser usage. The INSTRUMENT_MAP and DRUM_MAP are exported
  for direct access, while the InstrumentMap object provides the
  primary API.
*/

/*
  IN OTHER WORDS:
  This is the "shipping label" that makes sure the instrument
  catalog can be delivered to any part of the NTCC Music App
  that needs it.
*/

if (typeof window !== 'undefined') {
  (window as any).InstrumentMap = InstrumentMap;
  (window as any).INSTRUMENT_MAP = INSTRUMENT_MAP;
  (window as any).DRUM_MAP = DRUM_MAP;
  (window as any).DRUM_NOTE_MAP = DRUM_NOTE_MAP;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: End of Module
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  This concludes the instrumentMap.ts module. It provides
  a complete General MIDI instrument mapping for the NTCC
  Music App, enabling intuitive instrument selection by name
  rather than by bank:preset numbers.

  The mapping covers:
  - 128 General MIDI melodic instruments
  - 10 General MIDI drum kits
  - 47 individual drum sounds
  - 12 instrument categories
  - Worship music common configurations (contemporary, traditional, gospel)

  This abstraction layer makes the synthesis engine accessible
  to musicians who understand "piano" and "guitar" but not
  "bank 0, preset 0" and "bank 0, preset 24."
*/

/*
  IN OTHER WORDS:
  This is the "orchestra roster" — the complete list of every
  instrument available, organized by section. When the worship
  leader says "Strings, section 1," everyone knows who should
  stand up. When they say "Bring in the saxophone," the saxophonist
  knows it's their turn. The roster also knows each musician's range
  (how high and low they can play) and their preferred volume
  (how loud they normally play). It's the human-friendly face
  of the technical SoundFont system.
*/

/* End of instrumentMap.ts */
/* © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community */
