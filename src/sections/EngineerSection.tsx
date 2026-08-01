// ==========================================================================
// This Area Of Code Is: The Engineer Bench — universal tools for the three
// engineer seats. 🔊 Sound: live SPL loudness meter + house patch notes.
// 🎬 Media: the service run-sheet with check-offs. 🎚 Tempo: tap-tempo BPM
// + a real metronome click. Everything saves on the device — no account
// hopping, no lost notes. In Other Words: The booth in your pocket.
// ==========================================================================
import { useEffect, useRef, useState } from 'react';
import { useAuth, type Role } from '../lib/auth';

type Bench = 'sound' | 'media' | 'tempo';
const BENCHES: { id: Bench; icon: string; label: string }[] = [
  { id: 'sound', icon: '🔊', label: 'Sound Engineer' },
  { id: 'media', icon: '🎬', label: 'Media Engineer' },
  { id: 'tempo', icon: '🎚', label: 'Tempo Engineer' },
];

const NOTE_KEY = (b: Bench) => `ntcc.eng.${b}.notes`;
const RUN_KEY = 'ntcc.eng.media.runsheet';

export default function EngineerSection() {
  const { user } = useAuth();
  const start: Bench = user && ['sound', 'media', 'tempo'].includes(user.role) ? (user.role as Bench) : 'sound';
  const [bench, setBench] = useState<Bench>(start);

  return (
    <div className="space-y-5">
      <div className="glass-card p-5">
        <h2 className="text-accent font-semibold mb-1">🎛 The Engineer Bench</h2>
        <p className="text-muted text-sm">Universal tools for the booth — pick your seat.</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {BENCHES.map((b) => (
            <button key={b.id} className={`glass-btn text-sm ${bench === b.id ? 'primary' : ''}`}
                    onClick={() => setBench(b.id)} aria-pressed={bench === b.id}>
              {b.icon} {b.label}
            </button>
          ))}
        </div>
      </div>
      {bench === 'sound' && <SoundBench />}
      {bench === 'media' && <MediaBench />}
      {bench === 'tempo' && <TempoBench />}
    </div>
  );
}

/* ---------------- 🔊 SOUND: SPL + RTA + delay calc + patch notes ---------------- */
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','Bb','B'];
function hzToNote(hz: number): string {
  const n = Math.round(12 * Math.log2(hz / 440)) + 69;
  return `${NOTE_NAMES[n % 12]}${Math.floor(n / 12) - 1}`;
}

function SoundBench() {
  const [db, setDb] = useState<number | null>(null);
  const [peak, setPeak] = useState<number | null>(null);
  const [hot, setHot] = useState(''); // loudest frequency right now (feedback hunter)
  const [err, setErr] = useState('');
  const [notes, setNotes] = useState(() => localStorage.getItem(NOTE_KEY('sound')) ?? '');
  const [feet, setFeet] = useState('');
  // Auto-cleanup advisor: band energies the app watches so it can ADVISE the
  // engineer (never act alone — the engineer can override any suggestion).
  const [bands, setBands] = useState({ rumble: 0, harsh: 0 });
  const [overridden, setOverridden] = useState<string[]>([]);
  const stopRef = useRef<(() => void) | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startMeter = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      src.connect(an);
      const buf = new Float32Array(an.fftSize);
      const freq = new Uint8Array(an.frequencyBinCount);
      let alive = true;
      const tick = () => {
        if (!alive) return;
        // Loudness
        an.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        const level = Math.max(-99, Math.round(20 * Math.log10(rms || 1e-8) + 94));
        setDb(level);
        setPeak((p) => (p === null || level > p ? level : p));
        // RTA spectrum + feedback hunter
        an.getByteFrequencyData(freq);
        let maxI = 0;
        for (let i = 1; i < freq.length; i++) if (freq[i] > freq[maxI]) maxI = i;
        const hz = (maxI * ctx.sampleRate) / an.fftSize;
        if (freq[maxI] > 140) setHot(`${Math.round(hz)} Hz ≈ ${hzToNote(hz)} — ring that band down`);
        else setHot('');
        // Cleanup advisor band analysis: rumble (<80 Hz) and harshness (2–5 kHz)
        const binHz = ctx.sampleRate / an.fftSize;
        const bandAvg = (lo: number, hi: number) => {
          let s = 0, n = 0;
          for (let i = Math.max(1, Math.floor(lo / binHz)); i <= Math.min(freq.length - 1, Math.ceil(hi / binHz)); i++) { s += freq[i]; n++; }
          return n ? s / n : 0;
        };
        setBands({ rumble: Math.round(bandAvg(20, 80)), harsh: Math.round(bandAvg(2000, 5000)) });
        const cv = canvasRef.current;
        if (cv) {
          const c = cv.getContext('2d');
          if (c) {
            const W = cv.width, H = cv.height;
            c.clearRect(0, 0, W, H);
            const bars = 48;
            for (let b = 0; b < bars; b++) {
              const idx = Math.floor((b / bars) * freq.length * 0.75);
              const v = freq[idx] / 255;
              c.fillStyle = `hsl(${140 - v * 120}, 70%, ${35 + v * 30}%)`;
              c.fillRect((b / bars) * W, H - v * H, W / bars - 2, v * H);
            }
          }
        }
        requestAnimationFrame(tick);
      };
      tick();
      stopRef.current = () => { alive = false; stream.getTracks().forEach((t) => t.stop()); void ctx.close(); };
      setErr('');
    } catch {
      setErr('Microphone blocked — allow mic access to meter the room.');
    }
  };
  useEffect(() => () => stopRef.current?.(), []);

  const delayMs = feet ? (Number(feet) / 1.125).toFixed(1) : null; // sound ≈ 1.125 ft/ms

  // This Area Of Code Is: The Auto-Cleanup Advisor.
  // Explanation: Our online audio has been sounding rough, so the app
  // watches the room and ADVISES the sound engineer on the fix — it never
  // touches the sound by itself, and the engineer can override any advice.
  const advice: Array<{ id: string; text: string }> = [];
  if (db !== null) {
    if (bands.rumble > 110) advice.push({ id: 'rumble', text: `Low rumble detected (${bands.rumble}/255 below 80 Hz) — advise engaging the high-pass filter on vocal channels to clean the stream.` });
    if (bands.harsh > 120) advice.push({ id: 'harsh', text: `Harsh 2–5 kHz energy (${bands.harsh}/255) — advise a gentle 2–3 dB cut there so the online mix stops sounding rough.` });
    if (db >= 92) advice.push({ id: 'hot', text: `Signal running hot (${db} dB) — advise backing input gain down ~3 dB to protect the stream from clipping.` });
    if (db < 45) advice.push({ id: 'quiet', text: `Very quiet room (${db} dB) — check the mic/line is up before advising cleanup.` });
  }
  const visibleAdvice = advice.filter((a) => !overridden.includes(a.id));

  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="font-semibold">🔊 Room Meter + Spectrum (RTA)</h3>
      <div className="text-center">
        <p className="text-5xl font-bold text-accent">{db ?? '—'}</p>
        <p className="text-muted text-xs">approx. dB in the room {peak !== null && `· peak ${peak}`}</p>
      </div>
      <canvas ref={canvasRef} width={560} height={120} className="w-full rounded-lg bg-black/30"
              aria-label="Real-time frequency spectrum" />
      {hot && <p className="text-sm text-red-300 text-center" role="alert">⚠️ {hot}</p>}
      <div className="flex gap-2 justify-center flex-wrap">
        <button className="glass-btn primary" onClick={() => void startMeter()}>Start meter</button>
        <button className="glass-btn" onClick={() => { stopRef.current?.(); setDb(null); setPeak(null); setHot(''); }}>Stop</button>
        <button className="glass-btn" onClick={() => setPeak(null)}>Reset peak</button>
      </div>
      {err && <p className="text-sm text-red-300">{err}</p>}

      {visibleAdvice.length > 0 && (
        <div className="border border-amber-300/50 rounded-xl p-3 space-y-2" role="alert">
          <h4 className="text-sm font-semibold">🧹 Auto-Cleanup Advisor <span className="text-muted font-normal">(advises first — you decide)</span></h4>
          {visibleAdvice.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-2 text-sm">
              <span>💡 {a.text}</span>
              <button className="glass-btn text-xs shrink-0"
                      onClick={() => setOverridden((o) => [...o, a.id])}>
                Override
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-white/10 pt-3">
        <h4 className="text-sm font-semibold mb-2">📏 Speaker Delay Calculator</h4>
        <div className="flex gap-2 items-center flex-wrap">
          <input className="auth-input !w-28 text-sm" inputMode="decimal" placeholder="feet"
                 value={feet} onChange={(e) => setFeet(e.target.value.replace(/[^0-9.]/g, ''))}
                 aria-label="Distance to speaker in feet" />
          <span className="text-sm text-muted">ft from mains →</span>
          <strong className="text-accent">{delayMs ?? '—'} ms</strong>
        </div>
        <p className="text-muted text-xs mt-1">Dial that delay into the delayed fill/speakers so the room lands as one wavefront.</p>
      </div>

      <label className="block text-sm font-semibold">House patch / board notes</label>
      <textarea className="auth-input !w-full min-h-28" value={notes}
                placeholder="Ch 1: Pastor's mic · Ch 2: Keys L …"
                onChange={(e) => { setNotes(e.target.value); localStorage.setItem(NOTE_KEY('sound'), e.target.value); }} />
    </div>
  );
}

/* ---------------- 🎬 MEDIA: run-sheet ---------------- */
function MediaBench() {
  const [items, setItems] = useState<{ text: string; done: boolean }[]>(() => {
    try { return JSON.parse(localStorage.getItem(RUN_KEY) ?? '[]'); } catch { return []; }
  });
  const [draft, setDraft] = useState('');
  const save = (next: typeof items) => { setItems(next); localStorage.setItem(RUN_KEY, JSON.stringify(next)); };

  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="font-semibold">🎬 Service Run-Sheet</h3>
      <div className="flex gap-2">
        <input className="auth-input !w-full" placeholder="e.g. Welcome slides up · 10:28"
               value={draft} onChange={(e) => setDraft(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { save([...items, { text: draft.trim(), done: false }]); setDraft(''); } }} />
        <button className="glass-btn primary" onClick={() => { if (draft.trim()) { save([...items, { text: draft.trim(), done: false }]); setDraft(''); } }}>
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="glass-card p-3 flex items-center gap-3">
            <input type="checkbox" checked={it.done} aria-label={`Done: ${it.text}`}
                   onChange={() => save(items.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} />
            <span className={`flex-1 text-sm ${it.done ? 'line-through text-muted' : ''}`}>{it.text}</span>
            <button className="glass-btn text-xs" onClick={() => save(items.filter((_, j) => j !== i))}>✕</button>
          </li>
        ))}
        {items.length === 0 && <p className="text-muted text-sm">No cues yet — build tonight's run above.</p>}
      </ul>

      <div className="border-t border-white/10 pt-3">
        <h4 className="text-sm font-semibold mb-2">🎥 Cinema Camera Quick Reference (phone rigs)</h4>
        <ul className="text-sm space-y-1 text-muted">
          <li><strong className="text-accent">Shutter:</strong> 180° rule — 1/(2×fps): 1/48 for 24fps, 1/120 for 60fps</li>
          <li><strong className="text-accent">ISO:</strong> lowest the room allows; raise light, not ISO</li>
          <li><strong className="text-accent">Focus:</strong> manual + peaking on the speaker's eyes; lock it before worship starts</li>
          <li><strong className="text-accent">White balance:</strong> lock to the stage lights (~3200K tungsten / 5600K LED) — never auto mid-service</li>
          <li><strong className="text-accent">Audio:</strong> feed the board's mix into the camera line-in; camera mics are backup only</li>
        </ul>
      </div>
    </div>
  );
}

/* ---------------- 🎚 TEMPO: tap BPM + metronome ---------------- */
function TempoBench() {
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState(96);
  const [clicking, setClicking] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  const tap = () => {
    const now = performance.now();
    const recent = [...taps, now].filter((t) => now - t < 3000);
    setTaps(recent);
    if (recent.length >= 2) {
      const gaps = recent.slice(1).map((t, i) => t - recent[i]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      setBpm(Math.round(60000 / avg));
      // Drift analysis — how steady is the human hand?
      const devs = gaps.map((g) => Math.abs(g - avg));
      const meanDev = devs.reduce((a, b) => a + b, 0) / devs.length;
      setDrift({ ms: Math.round(meanDev), score: Math.max(0, Math.round(100 - (meanDev / avg) * 400)) });
    }
  };
  const [drift, setDrift] = useState<{ ms: number; score: number } | null>(null);

  // Tempo map — the service's sections and their BPMs, saved on device.
  const MAP_KEY = 'ntcc.eng.tempo.map';
  const [mapRows, setMapRows] = useState<{ name: string; bpm: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem(MAP_KEY) ?? '[]'); } catch { return []; }
  });
  const [mapName, setMapName] = useState('');
  const saveMap = (rows: typeof mapRows) => { setMapRows(rows); localStorage.setItem(MAP_KEY, JSON.stringify(rows)); };

  const toggleClick = () => {
    if (clicking) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setClicking(false);
      return;
    }
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    const ctx = ctxRef.current;
    const click = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    };
    click();
    timerRef.current = window.setInterval(click, 60000 / bpm);
    setClicking(true);
  };
  // keep the click honest when BPM changes mid-run
  useEffect(() => {
    if (clicking && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 1200;
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.07);
      }, 60000 / bpm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm]);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <div className="glass-card p-5 space-y-4 text-center">
      <h3 className="font-semibold text-left">🎚 Tempo Tools</h3>
      <p className="text-6xl font-bold text-accent">{bpm} <span className="text-lg text-muted">BPM</span></p>
      <div className="flex gap-2 justify-center flex-wrap">
        <button className="glass-btn primary text-lg px-8" onClick={tap}>👆 TAP</button>
        <button className={`glass-btn ${clicking ? 'primary' : ''}`} onClick={toggleClick} aria-pressed={clicking}>
          {clicking ? '⏹ Stop click' : '▶ Metronome'}
        </button>
        <button className="glass-btn" onClick={() => setTaps([])}>Reset taps</button>
      </div>
      {drift && (
        <p className="text-sm">
          Timing drift: <strong className="text-accent">±{drift.ms} ms</strong> · steadiness{' '}
          <strong className={drift.score >= 85 ? 'text-green-300' : 'text-accent'}>{drift.score}%</strong>
          {drift.score >= 85 ? ' — locked to the grid 🔒' : ' — keep tapping, it tightens up'}
        </p>
      )}

      <div className="border-t border-white/10 pt-3 text-left">
        <h4 className="text-sm font-semibold mb-2">🗺 Service Tempo Map</h4>
        <div className="flex gap-2 flex-wrap">
          <input className="auth-input !w-full text-sm flex-1" placeholder="Section or song (e.g. Chorus 2)"
                 value={mapName} onChange={(e) => setMapName(e.target.value)} aria-label="Tempo map entry name" />
          <button className="glass-btn text-sm" onClick={() => {
            if (!mapName.trim()) return;
            saveMap([...mapRows, { name: mapName.trim(), bpm }]);
            setMapName('');
          }}>+ Add at {bpm} BPM</button>
        </div>
        <ul className="mt-2 space-y-1">
          {mapRows.map((r, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="flex-1">{r.name}</span>
              <strong className="text-accent">{r.bpm} BPM</strong>
              <button className="glass-btn text-xs" aria-label={`Remove ${r.name}`}
                      onClick={() => saveMap(mapRows.filter((_, j) => j !== i))}>✕</button>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-muted text-xs">Tap along with the track to catch its tempo; the metronome follows whatever BPM is showing.</p>
    </div>
  );
}
