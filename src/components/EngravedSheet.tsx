// ==========================================================================
// This Area Of Code Is: The engraving engine (OmniScore Phase 13).
// Explanation: A song's chord chart becomes a professionally engraved
// sheet — title plate, composer and credit lines, key/tempo/time block,
// sections set in two-column music typography with chords floating above
// their syllables, and the copyright strip at the foot. The PDF path is
// the browser's OWN print engine (native, no third-party dependency):
// tap Print / Save PDF and the engraving is the only thing on the page.
// In Other Words: One tap, and the song in your hand looks like it came
// out of a publishing house.
// ==========================================================================

import type { Song } from '../lib/music';
import { transposeChord } from '../lib/music';

const KIND_ORDER = ['intro', 'verse', 'chorus', 'bridge', 'tag', 'outro'];

export default function EngravedSheet({ song, onClose, partLabel, partKey, semis = 0, flats = false }: { song: Song; onClose: () => void; partLabel?: string; partKey?: string; semis?: number; flats?: boolean }) {
  const sections = [...song.sections].sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));

  return (
    <div className="engrave-overlay" role="dialog" aria-modal="true" aria-label={`Engraved sheet — ${song.title}`}>
      {/* Screen toolbar — never printed */}
      <div className="engrave-toolbar no-print">
        <button className="glass-btn hover-glass text-sm" onClick={onClose}>← Back</button>
        <span className="text-sm text-muted">Engraving preview — what prints is only the sheet</span>
        <button className="cta-gold text-sm px-5 py-2" onClick={() => window.print()}>
          🖨 Print / Save PDF
        </button>
      </div>

      {/* The sheet itself */}
      <div className="engrave-sheet">
        <header className="engrave-head">
          <p className="engrave-kicker">NTCCA Music App™ · Engraved Edition</p>
          <h1 className="engrave-title">{song.title}</h1>
          <p className="engrave-artist">{song.artist}</p>
          <div className="engrave-meta">
            <span>Key: <strong>{song.key}</strong></span>
            {partLabel && partKey && !partLabel.startsWith('Concert') && (
              <span>Part: <strong>{partLabel} — written in {partKey}</strong></span>
            )}
            <span>Tempo: <strong>𝅘𝅥 = {song.bpm}</strong></span>
            <span>Time: <strong>{song.timeSignature}</strong></span>
            {song.leadSinger && <span>Lead: <strong>{song.leadSinger}</strong></span>}
            {song.duration && <span>Duration: <strong>{song.duration}</strong></span>}
            {song.keyChanges && <span>Key change: <strong>{song.keyChanges}</strong></span>}
          </div>
          <hr className="engrave-rule" />
        </header>

        <main className="engrave-body">
          {sections.length === 0 && (
            <p className="engrave-empty">No chord chart on this song yet — add one in the editor and engrave again.</p>
          )}
          {sections.map((sec, i) => (
            <section key={i} className="engrave-section">
              <h2 className="engrave-section-label">{sec.label}</h2>
              {sec.lines.map((line, j) => (
                <div key={j} className="engrave-line">
                  {line.segments.map((seg, k) => (
                    <span key={k} className="engrave-seg">
                      <span className="engrave-chord">{transposeChord(seg.chord, semis, flats) || ' '}</span>
                      <span className="engrave-lyric">{seg.lyric || ' '}</span>
                    </span>
                  ))}
                </div>
              ))}
            </section>
          ))}
        </main>

        <footer className="engrave-foot">
          {song.copyrightInfo && <p>{song.copyrightInfo}</p>}
          {song.ccliNumber && <p>CCLI #{song.ccliNumber}</p>}
          <p>{song.credit}</p>
          <p className="engrave-brand">Engraved by OmniScore™ · © 2026 NTCCA Music App™</p>
        </footer>
      </div>
    </div>
  );
}
