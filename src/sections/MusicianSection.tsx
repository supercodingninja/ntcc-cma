// ==========================================================================
// This Area Of Code Is: The Musician Portal & Practice Accountability.
// Explanation: Musicians tap Begin/End Practice — sessions live only on
// THEIR device. Reports are due Saturday 8 AM and travel to the director
// through the device's own email/share sheet — no server, no stored user
// data, no liability. Directors keep the choir seating chart (sections,
// leads, multi-part), import everyone's report files, and get one
// accountability table plus a combined CCLI-style report they can save,
// download, or move to any of their own devices.
// In Other Words: A practice diary in every pocket and a binder on the
// director's desk — the church office never touches the papers.
// ==========================================================================
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import {
  activeSession, beginPractice, endPractice, loadIdentity, saveIdentity,
  weekSessions, reportDueState, emailReport, shareReport, downloadReport,
  parseReport, aggregateReports, combinedReportText, downloadCombinedReport,
  type PracticeReport,
} from '../lib/practice';
import {
  CHOIR_SECTIONS, loadRoster, addChoirMember, updateChoirMember,
  removeChoirMember, addBandMember, removeBandMember,
  exportRoster, importRoster, type TeamRoster,
} from '../lib/team';
import { VocalKeyFinder, ChordBuilder, PracticeQueue } from './PracticeTools';

function fmtMin(m: number): string {
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

// ---------------------------------------------------------------- musician
function MusicianView() {
  const [identity, setIdentity] = useState(loadIdentity());
  const [open, setOpen] = useState(activeSession());
  const [, setTick] = useState(0);
  const [week, setWeek] = useState(weekSessions());
  const [focus, setFocus] = useState('');
  const [msg, setMsg] = useState('');
  const roster = loadRoster();

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const due = reportDueState();
  const total = week.reduce((n, s) => n + s.minutes, 0);
  const elapsed = open ? Math.floor((Date.now() - open.startedAt) / 1000) : 0;

  const partOptions = [
    ...CHOIR_SECTIONS.map(String),
    ...Array.from(new Set(roster.band.flatMap((b) => b.instruments))),
    'Keys', 'Organ', 'Drums', 'Bass', 'Guitar',
  ].filter((v, i, a) => a.indexOf(v) === i);

  const togglePart = (p: string) => {
    const parts = identity.parts.includes(p)
      ? identity.parts.filter((x) => x !== p)
      : [...identity.parts, p];
    const next = { ...identity, parts };
    setIdentity(next);
    saveIdentity(next);
  };

  const stop = () => {
    endPractice();
    setOpen(null);
    setWeek(weekSessions());
  };

  const send = async (how: 'share' | 'email' | 'download') => {
    if (!identity.label.trim()) {
      setMsg('Add your name label first (First name + last initial, e.g. "Frederick T.") — or an appropriate alias your director recognizes.');
      return;
    }
    if (how === 'share') setMsg((await shareReport()) ? '📤 Handed to your share sheet — send it to your director.' : '⬇ Shared unavailable — report downloaded instead.');
    if (how === 'email') setMsg('✉️ Your email app is opening. Attach the file that just downloaded, then press send.');
    if (how === 'download') setMsg('⬇ Report downloaded — email or AirDrop it to your director.');
    if (how === 'email') emailReport();
    if (how === 'download') downloadReport();
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {due !== 'ok' && (
        <div className={`glass-card p-4 text-center font-semibold ${due === 'overdue' ? 'border border-red-400/60' : 'border border-amber-300/60'}`}>
          {due === 'overdue'
            ? '⏰ It\'s past Saturday 8:00 AM — send your practice report to your director now.'
            : '📅 Report due Saturday 8:00 AM — your report is ready below.'}
        </div>
      )}

      {/* identity */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="font-semibold">🎤 Your practice label</h3>
        <p className="text-sm text-muted">
          Voluntary — First name + last initial (e.g. "Frederick T."), or an appropriate alias.
          Your director knows who's who. Nothing leaves this device except the report YOU send.
        </p>
        <input className="auth-input !w-full" placeholder="First name + last initial"
               value={identity.label}
               onChange={(e) => { const n = { ...identity, label: e.target.value }; setIdentity(n); saveIdentity(n); }}
               aria-label="Practice name label" />
        <div>
          <p className="text-sm mb-1">Your part(s) — pick all that apply:</p>
          <div className="flex flex-wrap gap-2">
            {partOptions.map((p) => (
              <button key={p} onClick={() => togglePart(p)}
                      className={`glass-btn text-sm ${identity.parts.includes(p) ? 'primary' : ''}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <input className="auth-input !w-full" type="email" placeholder="Director's email (for the Saturday report)"
               value={identity.directorEmail}
               onChange={(e) => { const n = { ...identity, directorEmail: e.target.value }; setIdentity(n); saveIdentity(n); }}
               aria-label="Director email" />
      </div>

      {/* the button */}
      <div className="glass-card p-6 text-center space-y-3">
        {!open ? (
          <>
            <input className="auth-input !w-full" placeholder="What are you practicing? (song / part — optional)"
                   value={focus} onChange={(e) => setFocus(e.target.value)} aria-label="Practice focus" />
            <button className="glass-btn primary w-full text-lg py-4"
                    onClick={() => setOpen(beginPractice(focus))}>
              ▶ Begin Practice
            </button>
          </>
        ) : (
          <>
            <p className="text-4xl font-mono font-bold">
              {String(Math.floor(elapsed / 3600)).padStart(2, '0')}:
              {String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')}:
              {String(elapsed % 60).padStart(2, '0')}
            </p>
            {open.focus && <p className="text-muted">{open.focus}</p>}
            <button className="glass-btn w-full text-lg py-4 border border-red-400/60" onClick={stop}>
              ⏹ End Practice
            </button>
          </>
        )}
      </div>

      {/* this week */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="font-semibold">📖 This week on this device</h3>
        <p className="text-sm text-muted">{week.length} session(s) · {fmtMin(total)} total</p>
        {week.length === 0 && <p className="text-sm text-muted">No sessions yet — tap Begin Practice above.</p>}
        <ul className="space-y-1 text-sm">
          {week.map((s) => (
            <li key={s.id} className="flex justify-between border-b border-[var(--glass-border)] pb-1">
              <span>{new Date(s.startedAt).toLocaleDateString(undefined, { weekday: 'short' })}
                {s.focus ? ` · ${s.focus}` : ''}</span>
              <span>{fmtMin(s.minutes)}</span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          <button className="glass-btn primary" onClick={() => send('share')}>📤 Share report</button>
          <button className="glass-btn" onClick={() => send('email')}>✉️ Email director</button>
          <button className="glass-btn" onClick={() => send('download')}>⬇ Download</button>
        </div>
        {msg && <p className="text-sm">{msg}</p>}
      </div>

      {/* Vocal coach, theory, and the hit-list — the practice studio */}
      <VocalKeyFinder songKeys={[]} />
      <ChordBuilder />
      <PracticeQueue onPick={setFocus} />
    </div>
  );
}

// ---------------------------------------------------------------- director
function DirectorView() {
  const [roster, setRoster] = useState<TeamRoster>(loadRoster());
  const [name, setName] = useState('');
  const [bandName, setBandName] = useState('');
  const [bandInstr, setBandInstr] = useState('');
  const [reports, setReports] = useState<PracticeReport[]>([]);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const rosterRef = useRef<HTMLInputElement>(null);

  const refresh = () => setRoster(loadRoster());

  const importFiles = async (files: FileList | null) => {
    if (!files) return;
    let added = 0;
    const next = [...reports];
    for (const f of Array.from(files)) {
      const r = parseReport(await f.text());
      if (r) {
        const key = `${r.label}-${r.weekOf}`;
        const i = next.findIndex((x) => `${x.label}-${x.weekOf}` === key);
        if (i >= 0) next[i] = r; else next.push(r);
        added++;
      }
    }
    setReports(next);
    setMsg(added ? `✅ Imported ${added} report(s).` : '⚠️ No valid practice reports found in those files.');
  };

  const rows = aggregateReports(reports);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* choir sections */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="font-semibold">🎶 Choir seating chart</h3>
        <p className="text-sm text-muted">Enter names, assign sections (members may cover more than one), mark section leads. Stored only on this device.</p>
        <div className="flex gap-2">
          <input className="auth-input !w-full" placeholder="Choir member name" value={name}
                 onChange={(e) => setName(e.target.value)} aria-label="Choir member name" />
          <button className="glass-btn primary" onClick={() => { if (name.trim()) { addChoirMember(name); setName(''); refresh(); } }}>Add</button>
        </div>
        <ul className="space-y-2">
          {roster.choir.map((m) => (
            <li key={m.id} className="border border-[var(--glass-border)] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{m.name} {m.isLead && <span className="text-accent text-sm">★ lead</span>}</span>
                <span className="flex gap-2">
                  <button className="glass-btn text-sm" onClick={() => { updateChoirMember(m.id, { isLead: !m.isLead }); refresh(); }}>
                    {m.isLead ? 'Unlead' : 'Make lead'}
                  </button>
                  <button className="glass-btn text-sm" onClick={() => { removeChoirMember(m.id); refresh(); }}>Remove</button>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {CHOIR_SECTIONS.map((s) => (
                  <button key={s}
                          className={`glass-btn text-sm ${m.sections.includes(s) ? 'primary' : ''}`}
                          onClick={() => {
                            const sections = m.sections.includes(s)
                              ? m.sections.filter((x) => x !== s)
                              : [...m.sections, s];
                            updateChoirMember(m.id, { sections });
                            refresh();
                          }}>
                    {s}
                  </button>
                ))}
              </div>
            </li>
          ))}
          {roster.choir.length === 0 && <p className="text-sm text-muted">No choir members yet.</p>}
        </ul>
      </div>

      {/* band */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="font-semibold">🥁 Band roster</h3>
        <div className="flex gap-2">
          <input className="auth-input !w-full" placeholder="Musician name" value={bandName}
                 onChange={(e) => setBandName(e.target.value)} aria-label="Band member name" />
          <input className="auth-input !w-full" placeholder="Instruments (comma separated)" value={bandInstr}
                 onChange={(e) => setBandInstr(e.target.value)} aria-label="Instruments" />
          <button className="glass-btn primary" onClick={() => {
            if (bandName.trim()) {
              addBandMember(bandName, bandInstr.split(',').map((s) => s.trim()).filter(Boolean));
              setBandName(''); setBandInstr(''); refresh();
            }
          }}>Add</button>
        </div>
        <ul className="space-y-1 text-sm">
          {roster.band.map((m) => (
            <li key={m.id} className="flex justify-between border-b border-[var(--glass-border)] pb-1">
              <span>{m.name} — {m.instruments.join(', ') || '—'}</span>
              <button className="glass-btn text-sm" onClick={() => { removeBandMember(m.id); refresh(); }}>Remove</button>
            </li>
          ))}
          {roster.band.length === 0 && <p className="text-sm text-muted">No band members yet.</p>}
        </ul>
        <div className="flex gap-2 pt-1">
          <button className="glass-btn text-sm" onClick={exportRoster}>⬇ Export roster</button>
          <button className="glass-btn text-sm" onClick={() => rosterRef.current?.click()}>⬆ Import roster</button>
          <input ref={rosterRef} type="file" accept=".json,application/json" hidden
                 onChange={async (e) => {
                   const f = e.target.files?.[0];
                   if (f && importRoster(await f.text())) { refresh(); setMsg('✅ Roster loaded.'); }
                   e.target.value = '';
                 }} />
        </div>
      </div>

      {/* reports */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="font-semibold">📊 Saturday practice reports</h3>
        <p className="text-sm text-muted">
          Import the report files musicians emailed/AirDropped you. Everything stays on this device.
        </p>
        <button className="glass-btn primary w-full" onClick={() => fileRef.current?.click()}>
          ⬆ Import report file(s)
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" multiple hidden
               onChange={(e) => { void importFiles(e.target.files); e.target.value = ''; }} />
        {rows.length > 0 && (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[var(--glass-border)]">
                  <th className="py-1">Musician</th><th>Part(s)</th>
                  <th className="text-right">Sessions</th><th className="text-right">Minutes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.label}-${r.weekOf}`} className="border-b border-[var(--glass-border)]">
                    <td className="py-1">{r.label}</td>
                    <td>{r.parts.join(', ') || '—'}</td>
                    <td className="text-right">{r.sessions}</td>
                    <td className="text-right">{fmtMin(r.totalMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="grid grid-cols-2 gap-2">
              <button className="glass-btn primary" onClick={() => downloadCombinedReport(reports)}>
                ⬇ Download combined report
              </button>
              <button className="glass-btn" onClick={() => {
                const w = window.open('', '_blank');
                if (w) { w.document.write(`<pre style="font:14px monospace;padding:24px">${combinedReportText(reports)}</pre>`); w.print(); }
              }}>
                🖨 Print
              </button>
            </div>
          </>
        )}
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </div>
  );
}

export default function MusicianSection() {
  const { effectiveRole } = useAuth();
  const isDirector = effectiveRole === 'admin';
  return (
    <div className="space-y-4">
      <header className="text-center">
        <h2 className="text-2xl font-bold">{isDirector ? '🎼 Director — Team & Practice' : '🎤 Musician Portal'}</h2>
        <p className="text-muted text-sm">
          {isDirector
            ? 'Your seating chart, your reports — all on this device, no server.'
            : 'Your practice diary lives on this device. Only the report you choose to send ever leaves it.'}
        </p>
      </header>
      {isDirector ? <DirectorView /> : <MusicianView />}
    </div>
  );
}
