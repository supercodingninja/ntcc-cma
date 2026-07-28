// ==========================================================================
// This Area Of Code Is: The Song ⇄ USMG Bridge.
// Explanation: The entire existing app (library, charts, transposition,
// setlists, UnityLED scenes) already speaks our Song/ChordPro format. This
// bridge converts it to and from USMG so everything we built instantly
// becomes part of the OmniScore graph — no rewrite, no downtime.
// In Other Words: The translator that lets our current house speak the new
// universal language today.
// ==========================================================================

import {
  createUSMG, validateUSMG, type USMGDocument, type Glyph, type SonicEvent,
  type HarmonyNode, type SemanticSection,
} from './usmg';
import type { Song, SongSection, SectionKind } from '../lib/music';
import { NOTE_INDEX_FROM_NAME } from './pitch';
import { registerIngestor, registerRenderer, type Ingestor, type Renderer } from './registry';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Rough seconds-per-beat helper: duration of one beat at the song's bpm. */
function beatSec(bpm: number): number {
  return 60 / Math.max(20, bpm);
}

// --------------------------- Song → USMG -----------------------------------
export function songToUSMG(song: Song): USMGDocument {
  const doc = createUSMG({
    title: song.title, artist: song.artist, key: song.key,
    timeSignature: song.timeSignature, bpm: song.bpm, language: song.language,
    ccliNumber: song.ccliNumber, copyrightInfo: song.copyrightInfo,
    sourceKind: 'chordpro', confidence: 1,
  });

  const bSec = beatSec(song.bpm);
  const beatsPerBar = parseInt(song.timeSignature, 10) || 4;
  let cursor = 0; // running onset in seconds

  song.sections.forEach((sec: SongSection) => {
    const start = cursor;
    sec.lines.forEach((line) => {
      line.segments.forEach((seg, i) => {
        // Chord symbols become harmony nodes + chord glyphs; lyric words
        // become lyric glyphs. Even spacing: one beat per segment.
        const onset = cursor + i * bSec;
        if (seg.chord) {
          const rootIdx = NOTE_INDEX_FROM_NAME[seg.chord.replace(/[^A-G#b].*$/, '')] ?? 0;
          doc.harmony.push({
            id: crypto.randomUUID(), symbol: seg.chord,
            fn: seg.chord === song.key ? 'tonic' : 'unknown',
            onset, duration: bSec,
          } satisfies HarmonyNode);
          doc.glyphs.push({
            id: crypto.randomUUID(), kind: 'chord-symbol',
            x: onset / bSec / beatsPerBar * 4, y: 5, staffIndex: 0,
          } satisfies Glyph);
          // Sonic event: the chord root as a reference pitch.
          doc.events.push({
            id: crypto.randomUUID(), pitch: 60 + rootIdx, onset,
            duration: bSec, velocity: 80, voice: 0, staffIndex: 0, confidence: 1,
          } satisfies SonicEvent);
        }
        if (seg.lyric.trim()) {
          doc.glyphs.push({
            id: crypto.randomUUID(), kind: 'lyric',
            x: onset / bSec / beatsPerBar * 4, y: -2, staffIndex: 0,
            hints: { text: seg.lyric },
          } satisfies Glyph);
        }
      });
      cursor += Math.max(1, line.segments.length) * bSec;
    });
    doc.sections.push({
      id: crypto.randomUUID(), kind: sec.kind as SectionKind, label: sec.label,
      startOnset: start, endOnset: cursor, intent: sec.label,
    } satisfies SemanticSection);
  });

  return doc;
}

// --------------------------- USMG → Song -----------------------------------
// Lossy by design for now: the bridge restores title/meta/sections/harmony
// into a displayable chord chart. Full glyph-perfect round-trips arrive with
// the Phase 13 engraving engine.
export function usmgToSong(doc: USMGDocument, id: string): Song {
  const sections: SongSection[] = doc.sections.map((s) => {
    const chords = doc.harmony
      .filter((h) => h.onset >= s.startOnset && h.onset < s.endOnset)
      .map((h) => `[${h.symbol}]`)
      .join('  ');
    return {
      kind: s.kind, label: s.label,
      lines: chords ? [{ segments: [{ chord: '', lyric: chords }] }] : [],
    };
  });

  return {
    id, title: doc.meta.title, artist: doc.meta.artist, key: doc.meta.key,
    bpm: doc.meta.bpm, timeSignature: doc.meta.timeSignature,
    language: doc.meta.language, credit: doc.meta.artist,
    ccliNumber: doc.meta.ccliNumber, copyrightInfo: doc.meta.copyrightInfo,
    sections,
  };
}

// This Area Of Code Is: Self-registration as OmniScore plugins.
// Explanation: The bridge registers itself as both an Ingestor (ChordPro
// songs → USMG) and a Renderer (USMG → Song chart data) at import time —
// proving the plugin model works with real, working adapters from day one.
// In Other Words: The first two plugs are already in the power strip.
export const chordProIngestor: Ingestor<Song> = {
  id: 'chordpro.song',
  label: 'ChordPro Song Ingestor',
  accepts: ['application/x-chordpro', 'song/chart'],
  async ingest(input) {
    const doc = songToUSMG(input);
    const v = validateUSMG(doc);
    return v.ok ? { doc } : { errors: v.errors };
  },
};

export const chartRenderer: Renderer<Song> = {
  id: 'render.chart',
  label: 'Chord Chart Renderer',
  outputs: ['song/chart'],
  async render(doc) {
    return { output: usmgToSong(doc, crypto.randomUUID()) };
  },
};

registerIngestor(chordProIngestor as Ingestor);
registerRenderer(chartRenderer as Renderer);

export { NOTE_NAMES };
