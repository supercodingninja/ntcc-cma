// ==========================================================================
// This Area Of Code Is: The Live Service stage ("Servicio en Vivo").
// Explanation: This is my Adoración flagship's signature — the whole church
// watches the service live, right inside the app, on any device. The video
// itself comes through YouTube Live (or any uploaded/direct video file), so
// it plays on iPhone, Android, and desktop with zero servers of our own.
// Around it I built the full live-service experience: the red EN VIVO
// badge, the participant panel, live on-screen captions (speech-to-text
// running on the device), a full time-stamped transcript you can save, and
// a join screen so nobody is dropped cold into a stream.
// In Other Words: Open the app, tap Live, and you're in church — with
// captions for the hard of hearing and a transcript for the bulletin.
// ==========================================================================

import { useEffect, useRef, useState } from 'react';
import { youtubeEmbed, isVideoFile } from '../lib/media';
import { resolveFileUrl, storeFile } from '../lib/fileStore';
import { useAuth } from '../lib/auth';
import { loadChurchProfile } from '../lib/church';
import { sanitizeText } from '../lib/shieldwall';

interface LiveConfig {
  title: string;
  speaker: string;
  url: string;          // YouTube live link, direct MP4, or idb:// upload
  startedAt: number;    // epoch ms — viewers compute "live for mm:ss"
}

interface TranscriptLine { at: number; text: string; }

const STORE_KEY = 'ntcc.live.service';
const loadConfig = (): LiveConfig | null => {
  try { const raw = localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) as LiveConfig : null; }
  catch { return null; }
};

// Caption languages — English first, Spanish second, the way we serve.
const CAPTION_LANGS: Array<[string, string]> = [
  ['en-US', 'English'], ['es-ES', 'Español'], ['pt-BR', 'Português'],
  ['fr-FR', 'Français'], ['tl-PH', 'Tagalog'], ['sw-KE', 'Kiswahili'],
];

export default function LiveSection() {
  const { user } = useAuth();
  const canHost = user ? user.role !== 'viewer' : false; // staff + engineers can host

  const [cfg, setCfg] = useState<LiveConfig | null>(loadConfig);
  const [joined, setJoined] = useState(false);
  const [viewers, setViewers] = useState(1);

  // Host setup form state
  const [title, setTitle] = useState(cfg?.title ?? 'Sunday Morning Service');
  const [speaker, setSpeaker] = useState(cfg?.speaker ?? '');
  const [url, setUrl] = useState(cfg?.url ?? '');

  // Playback state
  const [fileSrc, setFileSrc] = useState('');
  const [muted, setMuted] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Caption state
  const [captionsOn, setCaptionsOn] = useState(true);
  const [capLang, setCapLang] = useState('en-US');
  const [liveLine, setLiveLine] = useState('');
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const recogRef = useRef<{ stop: () => void } | null>(null);

  const [roomCode, setRoomCode] = useState('graham');
  const [inRoom, setInRoom] = useState(false);
  // This Area Of Code Is: The Viewer Stream Fallback.
  // Explanation: A viewer's only window is THEIR church's stream. If no host
  // has gone live on this device, fall back to the church's own stream link
  // (set by the director, or delivered once through the viewer invite link).
  const church = loadChurchProfile();
  const effectiveCfg = cfg ?? (church.streamUrl
    ? { title: `${church.name} — Live Stream`, speaker: '', url: church.streamUrl, startedAt: Date.now() }
    : null);
  const embed = effectiveCfg ? youtubeEmbed(effectiveCfg.url) : null;

  // This Area Of Code Is: Presence — the "1 espectador" counter.
  // Explanation: Every open viewer announces itself over BroadcastChannel
  // and answers roll-call. Devices watching together see the count rise.
  useEffect(() => {
    if (!joined) return;
    const me = crypto.randomUUID();
    const ch = new BroadcastChannel('ntcca.live.presence');
    const seen = new Set<string>([me]);
    ch.onmessage = (e) => {
      const d = e.data as { t: string; id: string };
      if (d.t === 'hello') { seen.add(d.id); ch.postMessage({ t: 'here', id: me }); }
      if (d.t === 'here') seen.add(d.id);
      if (d.t === 'bye') seen.delete(d.id);
      setViewers(seen.size);
    };
    ch.postMessage({ t: 'hello', id: me });
    const pulse = window.setInterval(() => ch.postMessage({ t: 'here', id: me }), 10000);
    return () => {
      window.clearInterval(pulse);
      ch.postMessage({ t: 'bye', id: me });
      ch.close();
    };
  }, [joined]);

  // Resolve uploaded video files (idb://) into playable object URLs.
  useEffect(() => {
    let alive = true;
    if (cfg && isVideoFile(cfg.url)) {
      void resolveFileUrl(cfg.url).then((u) => { if (alive) setFileSrc(u ?? ''); });
    } else setFileSrc('');
    return () => { alive = false; };
  }, [cfg]);

  // This Area Of Code Is: Live captions — the auto-transcription engine.
  // Explanation: The device's own speech recognition listens to the room
  // (or the stream playing out loud) and turns it into rolling captions,
  // exactly like Adoración's "Pastor Juan: Welcome to today's worship
  // service" line. Each finished sentence is stamped and filed into the
  // full transcript. Everything stays on the device.
  useEffect(() => {
    if (!joined || !captionsOn) { recogRef.current?.stop(); recogRef.current = null; return; }
    const SR = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionShim; webkitSpeechRecognition?: new () => SpeechRecognitionShim });
    const Ctor = SR.SpeechRecognition ?? SR.webkitSpeechRecognition;
    if (!Ctor) return; // graceful degradation — video still plays
    const rec = new Ctor();
    rec.lang = capLang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) {
          const text = r[0].transcript.trim();
          if (text) setTranscript((t) => [...t.slice(-199), { at: Date.now(), text }]);
        } else interim += r[0].transcript;
      }
      setLiveLine(interim);
    };
    rec.onend = () => { try { rec.start(); } catch { /* restarted next toggle */ } };
    try { rec.start(); recogRef.current = rec; } catch { /* mic denied */ }
    return () => { recogRef.current = null; try { rec.stop(); } catch { /* already stopped */ } };
  }, [joined, captionsOn, capLang]);

  const startService = () => {
    const clean: LiveConfig = {
      title: sanitizeText(title, 100) || 'Live Service',
      speaker: sanitizeText(speaker, 80),
      url: url.trim(),
      startedAt: Date.now(),
    };
    if (!clean.url) { alert('Paste the live stream link (YouTube Live or video URL) first.'); return; }
    localStorage.setItem(STORE_KEY, JSON.stringify(clean));
    setCfg(clean);
    setJoined(true);
  };

  const endService = () => {
    localStorage.removeItem(STORE_KEY);
    setCfg(null); setJoined(false); setTranscript([]); setLiveLine('');
  };

  const downloadTranscript = () => {
    const body = transcript.map((l) =>
      `[${new Date(l.at).toLocaleTimeString()}] ${cfg?.speaker || 'Speaker'}: ${l.text}`).join('\n');
    const blob = new Blob([`${cfg?.title ?? 'Live Service'} — Transcript\n\n${body}\n`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Join screen ("Unirse al Servicio en Vivo") ──────────────────────────
  if (effectiveCfg && !joined) {
    return (
      <div className="glass-card p-8 text-center max-w-xl mx-auto">
        <span className="service-badge" style={{ color: '#ff6b6b', borderColor: '#ff6b6b' }}>● LIVE</span>
        <h2 className="font-display text-2xl text-accent mt-3">{effectiveCfg.title}</h2>
        {effectiveCfg.speaker && <p className="text-muted mt-1">🎤 {cfg.speaker}</p>}
        <p className="text-muted text-sm mt-2">
          Started {new Date(effectiveCfg.startedAt).toLocaleTimeString()} · {viewers > 1 ? `${viewers} watching` : 'you are among the first'}
        </p>
        <div className="grid gap-3 mt-6">
          <button className="cta-gold py-3" onClick={() => { setCaptionsOn(true); setJoined(true); }}>
            📺 Join with Live Captions
          </button>
          <button className="glass-btn py-3" onClick={() => { setCaptionsOn(false); setJoined(true); }}>
            🔇 Join — Video Only
          </button>
        </div>
      </div>
    );
  }

  // ── Watching the service ────────────────────────────────────────────────
  if (effectiveCfg && joined) {
    return (
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div ref={stageRef} className="relative rounded-xl overflow-hidden border border-[var(--glass-border)] bg-black">
            {embed && (
              <iframe className="w-full aspect-video" src={embed} title={effectiveCfg.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
            )}
            {!embed && fileSrc && (
              <video className="w-full aspect-video" src={fileSrc} controls playsInline
                autoPlay muted={muted} preload="auto" />
            )}
            {!embed && !fileSrc && (
              <div className="aspect-video grid place-items-center text-muted text-sm p-6 text-center">
                That link is not playable here — use a YouTube Live link, a direct MP4 link, or upload a video file.
              </div>
            )}
            <span className="absolute top-3 left-3 service-badge" style={{ color: '#ff6b6b', borderColor: '#ff6b6b', background: 'rgba(0,0,0,.55)' }}>● EN VIVO · LIVE</span>
            <span className="absolute top-3 right-3 service-badge" style={{ background: 'rgba(0,0,0,.55)' }}>👥 {viewers}</span>
            {captionsOn && (liveLine || transcript.length > 0) && (
              <div className="absolute bottom-3 left-3 right-3 rounded-lg px-4 py-2 text-center text-sm md:text-base"
                   style={{ background: 'rgba(10,6,20,.78)' }}>
                <strong className="text-accent">{effectiveCfg.speaker || 'Speaker'}:</strong>{' '}
                {liveLine || transcript[transcript.length - 1]?.text}
              </div>
            )}
          </div>

          <div className="glass-card p-4 flex flex-wrap items-center gap-3">
            <button className="glass-btn text-sm" onClick={() => setMuted((m) => !m)}>
              {muted ? '🔇 Unmute' : '🔊 Mute'}
            </button>
            <button className="glass-btn text-sm" onClick={() => void stageRef.current?.requestFullscreen?.()}>
              ⛶ Fullscreen
            </button>
            <button className={`glass-btn text-sm ${captionsOn ? 'danger' : ''}`} onClick={() => setCaptionsOn((c) => !c)}>
              {captionsOn ? '📝 Captions: ON' : '📝 Captions: OFF'}
            </button>
            <select className="glass-btn text-sm" value={capLang} onChange={(e) => setCapLang(e.target.value)}>
              {CAPTION_LANGS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
            <span className="text-sm text-muted flex-1 text-center">{effectiveCfg.title}{cfg.speaker ? ` · ${cfg.speaker}` : ''}</span>
            <button className="glass-btn danger text-sm" onClick={() => setJoined(false)}>🚪 Leave</button>
            {canHost && <button className="glass-btn danger text-sm" onClick={endService}>⏹ End Service</button>}
          </div>
        </div>

        {/* Participants + full transcript — the right-hand panels from Adoración */}
        <div className="space-y-3">
          <div className="glass-card p-4">
            <h3 className="text-accent font-semibold mb-2">Participants</h3>
            <p className="text-sm">🎥 {effectiveCfg.speaker || 'Host'} <span className="text-green-400">● live</span></p>
            <p className="text-sm text-muted mt-1">👥 {viewers} viewer{viewers === 1 ? '' : 's'} connected</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-accent font-semibold">Full Transcript</h3>
              <button className="glass-btn text-xs" onClick={downloadTranscript} disabled={transcript.length === 0}>
                💾 Save
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2 text-sm">
              {transcript.length === 0 && (
                <p className="text-muted">Captions will appear here as speech is heard. Turn Captions ON and allow the microphone.</p>
              )}
              {transcript.map((l, i) => (
                <p key={i}>
                  <span className="text-muted text-xs">{new Date(l.at).toLocaleTimeString()} </span>
                  <strong className="text-accent">{effectiveCfg.speaker || 'Speaker'}</strong>{' '}{l.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── No live service yet: host setup (or waiting room for viewers) ──────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
    {/* This Area Of Code Is: The Unity Video Room.
        Explanation: Band members and choir across the world rehearse FACE TO
        FACE — that is the whole point of unity. No server of ours: the room
        rides on the free, proven Jitsi Meet service (if it ain't broke,
        don't fix it); each church uses its own room code. */}
    <div className="glass-card p-6">
      <h2 className="font-display text-2xl text-accent">🌍 Unity Video Room</h2>
      <p className="text-muted text-sm mt-1">
        Rehearse together from anywhere — across town or across the world. Everyone enters the same
        room code (get it from your director), taps Join, and you're all on one screen.
      </p>
      {!inRoom ? (
        <div className="mt-3 flex gap-2">
          <input className="auth-input w-full" autoCapitalize="off" placeholder="Room code (e.g. graham)"
                 value={roomCode} onChange={(e) => setRoomCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                 aria-label="Unity room code" />
          <button className="cta-gold px-5" disabled={!roomCode.trim()} onClick={() => setInRoom(true)}>
            🎥 Join
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <iframe
            title="Unity Video Room"
            src={`https://meet.jit.si/ntcca-${roomCode.trim()}#config.prejoinPageEnabled=false`}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style={{ width: '100%', height: 420, border: 0, borderRadius: 12 }}
          />
          <button className="glass-btn w-full" onClick={() => setInRoom(false)}>Leave room</button>
        </div>
      )}
    </div>

    <div className="glass-card p-6">
      <h2 className="font-display text-2xl text-accent">🔴 Live Service</h2>
      <p className="text-muted text-sm mt-1">
        Stream the service to every device. Paste a YouTube Live link (any shape), a direct MP4 link,
        or upload a video — the app handles the rest, on every phone and computer.
      </p>
      {canHost ? (
        <div className="mt-4 grid gap-3">
          <div>
            <label className="text-xs text-muted block mb-1">Service Title</label>
            <input className="auth-input w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Speaker / Worship Leader</label>
            <input className="auth-input w-full" value={speaker} onChange={(e) => setSpeaker(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Stream Link — YouTube Live, youtu.be, or direct MP4</label>
            <input className="auth-input w-full" inputMode="url" autoCapitalize="off"
              placeholder="https://youtube.com/watch?v=… or youtu.be/…"
              value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">…or upload a video file</label>
            <input type="file" accept="video/*" className="text-xs text-muted"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void storeFile(file).then((ref) => setUrl(ref));
              }} />
          </div>
          <button className="cta-gold py-3 mt-2" onClick={startService}>🔴 Go Live</button>
        </div>
      ) : (
        <p className="text-muted mt-4">No service is live right now. When your music director goes live, it will appear here — just tap Join.</p>
      )}
    </div>
    </div>
  );
}

// Minimal structural type for the Speech Recognition API across browsers.
interface SpeechRecognitionShim {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: SpeechRecognitionEventShim) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
interface SpeechRecognitionEventShim {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
