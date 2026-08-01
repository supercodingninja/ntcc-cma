// ==========================================================================
// This Area Of Code Is: The Adoración-style Login screen.
// Explanation: Full-bleed worship photo, massive gold serif wordmark,
// floating dark-glass auth card, gold→amber gradient Sign In, glowing status
// pills, and the copyright strip. Signup uses the role's default password
// and forces a personal password on first login.
// In Other Words: The front door — the same beauty as Adoración, made ours.
// ==========================================================================

import { useEffect, useState, type CSSProperties } from 'react';
import { useAuth, type Role } from '../lib/auth';
import { loadChurchProfile, saveChurchProfile } from '../lib/church';
import { CHURCH_REGISTRY, findChurch } from '../lib/churches';
import { sanitizeText } from '../lib/shieldwall';
import { useI18n } from '../lib/i18n';
import { openLanguagePanel } from '../components/LanguageAccess';
import { openAccessPanel } from '../components/UniversalAccess';
import EarthOrb from '../components/EarthOrb';
import AccessOrb from '../components/AccessOrb';
import FlyingDove from '../components/FlyingDove';
import BrandEmblem from '../components/BrandEmblem';

export default function Login() {
  const { login, signup, resetPassword, user } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('viewer');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [church, setChurch] = useState(loadChurchProfile);
  const [pickerOpen, setPickerOpen] = useState(false);
  const social = findChurch(church.code)?.social ?? {};

  // This Area Of Code Is: The Church Door Picker.
  // Explanation: One icon, every church. Pick a church and the app walks you
  // through ITS door (its subdomain when live, its name and stream here),
  // then you pick your role. Viewers can hop to any church's stream;
  // members create their login under their own church.
  const chooseChurch = (code: string, name: string) => {
    saveChurchProfile({ ...church, code, name });
    const host = window.location.hostname;
    if (host.endsWith('praises.team')) {
      window.location.href = code === 'ntcca' ? 'https://praises.team/' : `https://${code}.praises.team/`;
    } else {
      window.location.href = `${window.location.pathname}?church=${code}`;
    }
  };
  useI18n();

  // While the login screen is showing, the two floating corner orbs rest —
  // on this screen both icons live INSIDE the card, exactly where marked.
  useEffect(() => {
    document.body.dataset.screen = 'login';
    return () => { delete document.body.dataset.screen; };
  }, []);

  // The earth rotates — and "PRAISE GOD" rises from its surface like a
  // person on the planet speaking: two clean spots (below, then left),
  // tail always rooted in the globe. Languages cycle; spots alternate.
  // ONE speaking bubble, in ONE aesthetic place: directly below the globe,
  // tail rooted in the planet — languages cycle, the spot never wanders.
  const SPOTS = [{ x: 6, y: 128 }];
  const CYCLE_LANGS: { t: string; c: string }[] = [
    { t: 'Praise God!',        c: 'Click here!' },      // North America
    { t: '¡Alaben a Dios!',    c: '¡Toca aquí!' },      // Latin America
    { t: 'Louvem a Deus!',     c: 'Toque aqui!' },      // Brazil
    { t: 'Louez Dieu !',       c: 'Cliquez ici !' },    // Europe
    { t: 'Lobet Gott!',        c: 'Hier klicken!' },    // Central Europe
    { t: 'Lodate Dio!',        c: 'Clicca qui!' },      // Southern Europe
    { t: 'سَبِّحوا الله',        c: 'اضغط هنا!' },        // Middle East
    { t: 'Msifuni Mungu!',     c: 'Bofya hapa!' },      // East Africa
    { t: 'Yin Olúwa!',         c: 'Tẹ ibi!' },          // West Africa
    { t: 'እግዚአብሔርን አመሰግናለሁ',   c: 'እዚህ ጠቅ ያድርጉ!' },     // Ethiopia
    { t: '赞美上帝!',            c: '点击这里！' },         // East Asia
    { t: '神を讃えよ!',          c: 'ここをタップ！' },     // Japan
    { t: '하나님을 찬양하라!',     c: '여기를 누르세요!' },   // Korea
    { t: 'परमेश्वर की स्तुति!',  c: 'यहाँ दबाएँ!' },       // South Asia
    { t: 'Purihin ang Diyos!', c: 'I-tap dito!' },      // The Philippines
    { t: 'Славьте Бога!',      c: 'Нажмите здесь!' },   // Northern Eurasia
  ];
  const [cycleIdx, setCycleIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCycleIdx((i) => (i + 1) % CYCLE_LANGS.length), 2400);
    return () => clearInterval(t);
  }, []);

  // Forced password reset on first login (role default passwords).
  if (user?.mustResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card p-8 w-full max-w-md">
          <h2 className="font-display text-2xl text-accent mb-2">Create Your Password</h2>
          <p className="text-muted text-sm mb-5">Welcome, {user.name}. Set your personal password to continue.</p>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                 placeholder="New personal password" className="auth-input" aria-label="New password" />
          <button className="glass-btn primary w-full mt-4 py-3" onClick={() => {
            if (newPassword.length < 4) { setError('Use at least 4 characters.'); return; }
            resetPassword(newPassword);
          }}>Set Password & Enter</button>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>
      </div>
    );
  }

  const submit = () => {
    setError('');
    const cleanEmail = sanitizeText(email.trim(), 120);
    if (mode === 'signin') {
      const r = login(cleanEmail, password.trim());
      if (!r.ok) setError(r.error ?? 'Sign in failed.');
    } else {
      const r = signup(cleanEmail, sanitizeText(name, 80), role, password);
      if (!r.ok) setError(r.error ?? 'Sign up failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 landing-root">
      {/* The dove leaves the emblem and crosses the sky, whenever He moves */}
      <FlyingDove />

      {/* TOP BAR — language orb left, the living emblem CENTER at top,
          accessibility orb right. Everything rises; every viewport shines */}
      <div className="landing-topbar">
        <span className="login-orb-col earth-stage landing-corner-l">
          <button className="login-orb" onClick={openLanguagePanel}
                  aria-label="Language — tap to choose your language">
            <EarthOrb size={52} />
          </button>
          <span
            key={cycleIdx}
            className="lang-bubble tail-t"
            style={{ '--bx': `${SPOTS[0].x}%`, '--by': `${SPOTS[0].y}%` } as CSSProperties}
            aria-hidden="true"
          >
            <span className="lang-bubble-praise">{CYCLE_LANGS[cycleIdx].t}</span>
            <span className="lang-bubble-click">{CYCLE_LANGS[cycleIdx].c}</span>
          </span>
        </span>
        <BrandEmblem />
        <span className="landing-corner-r">
          <button className="login-orb" onClick={openAccessPanel}
                  aria-label="Accessibility options — Universal Access">
            <AccessOrb size={58} />
          </button>
        </span>
      </div>

      {/* Wordmark — the ADORACIÓN presence */}
      <div className="text-center mb-6 mt-2">
        <h1 className="wordmark">NTCCA MUSIC APP™</h1>
        <p className="wordmark-sub">{church.name} · Praises.Team</p>
        {/* ⛪ Church picker — one icon, every church door */}
        <div className="relative inline-block mt-2">
          <button className="glass-btn text-sm inline-flex items-center gap-2" onClick={() => setPickerOpen(!pickerOpen)}
                  aria-label="Choose a church" aria-expanded={pickerOpen}>
            <img src="/ntcca-emblem.png" alt="NTCCA emblem" className="w-5 h-5 rounded-sm" />
            {church.name} ▾
          </button>
          {pickerOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 max-h-64 overflow-y-auto
                            rounded-xl border border-[var(--glass-border)] bg-[#17122a] shadow-xl z-20 text-left">
              {CHURCH_REGISTRY.map((c) => (
                <button key={c.code}
                        className={`w-full px-4 py-2 text-sm hover:bg-white/10 text-left flex items-center gap-2 ${c.code === church.code ? 'text-accent' : ''}`}
                        onClick={() => chooseChurch(c.code, c.name)}>
                  <img src="/ntcca-emblem.png" alt="" aria-hidden className="w-5 h-5 rounded-sm shrink-0" />
                  <span>
                    {c.kind === 'org' ? '🕊' : c.kind === 'seminary' ? '🎓' : '⛪'} {c.name}
                    <span className="block text-xs text-muted">
                      {c.code === 'ntcca' ? 'praises.team' : `${c.code}.praises.team`}
                    </span>
                  </span>
                  {c.code === church.code && <span className="ml-auto text-accent">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* This church's / the organization's real social presence
            (from the official YouTube links panels & myntcc.org) */}
        <div className="flex gap-3 justify-center mt-2 text-sm flex-wrap">
          {social.website && <a className="text-accent underline" href={social.website} target="_blank" rel="noreferrer">🌐 Website</a>}
          {social.facebook && <a className="text-accent underline" href={social.facebook} target="_blank" rel="noreferrer">📘 Facebook</a>}
          {social.instagram && <a className="text-accent underline" href={social.instagram} target="_blank" rel="noreferrer">📸 Instagram</a>}
          {social.twitter && <a className="text-accent underline" href={social.twitter} target="_blank" rel="noreferrer">𝕏 Twitter</a>}
          {social.youtube && <a className="text-accent underline" href={social.youtube} target="_blank" rel="noreferrer">▶️ YouTube</a>}
        </div>
        <div className="flex gap-2 justify-center mt-4 flex-wrap">
          <span className="pill pill-green">● SECURE</span>
          <span className="pill pill-blue">🧠 AI TRIO</span>
          <span className="pill pill-purple"><EarthOrb size={16} /> FREE FOREVER</span>
        </div>
      </div>

      {/* Floating glass auth card */}
      <div className="glass-card login-glass p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-1">{mode === 'signin' ? 'Welcome Back!' : 'Join the Team'}</h2>
        <p className="text-muted text-sm mb-5">
          {mode === 'signin' ? 'Continue your worship ministry' : 'Use the signup password from your church admin'}
        </p>

        {mode === 'signup' && (
          <>
            <input className="auth-input" placeholder="Full name" value={name}
                   onChange={(e) => setName(e.target.value)} aria-label="Full name" />
            <div className="flex gap-2 my-3 flex-wrap">
              {(['admin', 'sound', 'media', 'tempo', 'musician', 'editor', 'viewer'] as Role[]).map((r) => (
                <button key={r} className={`glass-btn flex-1 capitalize ${role === r ? 'primary' : ''}`}
                        style={{ minWidth: '30%' }}
                        onClick={() => setRole(r)} aria-pressed={role === r}>
                  {r === 'sound' ? '🔊 Sound Eng.' : r === 'media' ? '🎬 Media Eng.' : r === 'tempo' ? '🎚 Track Eng.' : r === 'musician' ? '🎤 Musician' : r}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mb-2">
              Signup codewords: viewers <b>view</b> · musicians <b>NxtGen</b> · engineers <b>sound</b> / <b>media</b> / <b>track</b> — get yours from your director.
            </p>
          </>
        )}

        <input className="auth-input" type="email" placeholder="Email Address" value={email}
               autoCapitalize="off" autoCorrect="off" autoComplete="email" inputMode="email"
               onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
        <input className="auth-input mt-3" type="password"
               autoCapitalize="off" autoCorrect="off" autoComplete="current-password"
               placeholder={mode === 'signup' ? 'Signup password (from admin)' : 'Password'}
               value={password} onChange={(e) => setPassword(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && submit()} aria-label="Password" />

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <button className="cta-gold w-full mt-5 py-3.5 text-lg" onClick={submit}>
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-muted mt-4">
          {mode === 'signin' ? "Don't have an account? " : 'Already have one? '}
          <button className="text-accent underline" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>

        {mode === 'signin' && (
          <div className="mt-4">
            <p className="text-center text-xs text-muted mb-2">Demo — one tap, no typing:</p>
            <div className="flex gap-1.5 flex-wrap justify-center">
              {([
                ['Admin', 'ad@demo.go', '1'],
                ['🎤 Musician', 'musician@ntcc-cma.demo', '1234'],
                ['🔊 Sound', 'sound@ntcc-cma.demo', '1234'],
                ['🎬 Media', 'media@ntcc-cma.demo', '1234'],
                ['🎚 Tempo', 'tempo@ntcc-cma.demo', '1234'],
                ['Viewer', 'viewer@ntcc-cma.demo', '1234'],
              ] as const).map(([label, em, pw]) => (
                <button key={em} className="glass-btn text-xs"
                        onClick={() => { const r = login(em, pw); if (!r.ok) setError(r.error ?? 'Demo sign-in failed.'); }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Copyright strip */}
      <p className="copyright-strip">
        © 2026 NTCCA Music App™ | Gifted to New Testament Christian Churches of America, INC. by 𝑅𝑒𝑣𝑒𝑟𝑒𝑛𝑑 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝐷. 𝑇ℎ𝑜𝑚𝑎𝑠, 𝐽𝑟., 𝑁𝑇𝐶𝐶 𝐺𝑟𝑎ℎ𝑎𝑚, 𝑊𝐴 | Class of 2011, Commissioned 𝒞ℎ𝑎𝑛𝑔ℯ 𝐘𝐨𝐮𝐫 𝒲ℴ𝑟𝑙𝑑
      </p>
    </div>
  );
}
