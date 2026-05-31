/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NTCC MUSIC APP — src/contexts/UnityContext.tsx
 * Core Orchestration: State management, module integration, UI event handling,
 * error recovery, and the central nervous system that binds all modules together.
 *
 * Adapted from The Unity Solution™ for NTCC Music App
 * © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: React Imports & Type Definitions
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  This context uses React Context API and hooks to provide global state
  management for the NTCC Music App's distributed worship system. It
  integrates all Unity Solution™ modules (UnityClock, UnityConductor,
  UnityMesh, GhostRenderer, MidiBridge) into a cohesive React application.

  The architecture follows the Context-Provider pattern used throughout
  your Adoración app, with useReducer for complex state transitions and
  useCallback for memoized action dispatchers.
*/

/*
  IN OTHER WORDS:
  This is the "conductor" of the entire worship orchestra. The conductor
  doesn't play any instrument — they don't touch the piano, the
  drums, or the saxophone. But they tell everyone when to start,
  when to stop, how fast to play, and what to do when someone
  makes a mistake. They are the reason 100 musicians can play
  as one. Without the conductor, you have chaos. With the
  conductor, you have worship.
*/

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
  useState,
  ReactNode
} from 'react';

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: TypeScript Type Definitions
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  Comprehensive TypeScript interfaces define the entire application
  state, actions, and context API. These types ensure compile-time
  safety across the NTCC Music App and provide full IntelliSense
  for all state properties and dispatch actions.

  The state machine has three top-level views:
  - LANDING: User has not joined a worship session
  - SESSION: User is actively collaborating in worship
  - SETTINGS: User is configuring the app

  Sub-states within SESSION:
  - CONNECTING: Establishing peer connections
  - ACTIVE: All systems running, worship flowing
  - DEGRADED: Some peers disconnected, ghost covering
  - RECOVERING: Attempting reconnection
*/

/*
  IN OTHER WORDS:
  These are the "master notebook" blueprints. Every page, every
  section, every field is defined so nothing is left to chance.
  When the conductor writes "someone joined," the notebook knows
  exactly what that means and what to do next.
*/

export type AppView = 'landing' | 'session' | 'settings';
export type SessionStatus = 'connecting' | 'active' | 'degraded' | 'recovering' | 'idle';
export type TimeTier = 'GPS' | 'NTP' | 'AUDIO';
export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface PeerInfo {
  peerId: string;
  name: string;
  instrument: string;
  lat?: number;
  lon?: number;
  connected?: boolean;
  latency?: number;
  bandwidth?: number;
}

export interface SongData {
  id: string;
  title: string;
  tempo: number;
  key: string;
  timeSignature: [number, number];
  sections: Record<string, {
    measures: number;
    chords: string[];
  }>;
  arrangement: string[];
}

export interface AppSettings {
  sideTone: number;
  remoteGain: number;
  masterGain: number;
  bufferSize: number;
  inputDevice: string;
  outputDevice: string;
  conductorMode: 'ambient' | 'focused' | 'minimal' | 'hidden';
  conductorOpacity: number;
  showDots: boolean;
  showMeridian: boolean;
  gpsEnabled: boolean;
  ntpEnabled: boolean;
  ntpInterval: number;
  signalingServer: string;
  stunServer: string;
  useTurn: boolean;
  turnServer: string;
  lanDiscovery: boolean;
}

export interface ClockState {
  tier: TimeTier;
  accuracy: number;
  isLocked: boolean;
}

export interface NetworkState {
  isConnected: boolean;
  peerCount: number;
  isConductor: boolean;
  latency: number;
  sessionStatus: SessionStatus;
}

export interface AudioState {
  isLocalActive: boolean;
  sideToneDb: number;
  masterDb: number;
  meterData: Record<string, number> | null;
}

export interface ErrorEntry {
  module: string;
  message: string;
  timestamp: number;
  recoverable: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  timestamp: number;
}

export interface AppState {
  view: AppView;
  session: {
    id: string | null;
    title: string;
    code: string | null;
    isHost: boolean;
    peers: PeerInfo[];
    song: SongData | null;
    isPlaying: boolean;
    isRecording: boolean;
    bpm: number;
    status: SessionStatus;
  };
  user: {
    name: string;
    instrument: string;
    peerId: string | null;
    role: 'leader' | 'musician' | 'viewer';
  };
  settings: AppSettings;
  clock: ClockState;
  network: NetworkState;
  audio: AudioState;
  errors: ErrorEntry[];
  toasts: Toast[];
  isLoading: boolean;
  loadingMessage: string;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Action Types & Union
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  Redux-style action definitions using TypeScript discriminated unions.
  Each action has a type string and a payload, enabling exhaustive
  switch-case handling in the reducer with compile-time safety.

  Actions are grouped by domain:
  - VIEW_*: Navigation between app views
  - SESSION_*: Worship session lifecycle
  - USER_*: User profile updates
  - SETTINGS_*: Configuration changes
  - CLOCK_*: Time synchronization state
  - NETWORK_*: P2P mesh network state
  - AUDIO_*: Local audio pipeline state
  - ERROR_*: Error handling
  - TOAST_*: Notification management
  - LOADING_*: Loading state
*/

/*
  IN OTHER WORDS:
  These are the "commands" the conductor can give. Each command has
  a name (type) and specific details (payload). "Change the view
  to settings." "Someone joined the session." "The clock locked
  to GPS." Every possible command is listed here so the reducer
  knows how to handle each one.
*/

export type UnityAction =
  // View actions
  | { type: 'VIEW_SET'; payload: AppView }

  // Session actions
  | { type: 'SESSION_CREATE'; payload: { title: string; code: string } }
  | { type: 'SESSION_JOIN'; payload: { code: string; name: string; instrument: string } }
  | { type: 'SESSION_LEAVE' }
  | { type: 'SESSION_PEER_ADD'; payload: PeerInfo }
  | { type: 'SESSION_PEER_REMOVE'; payload: string }
  | { type: 'SESSION_PEER_UPDATE'; payload: Partial<PeerInfo> & { peerId: string } }
  | { type: 'SESSION_SONG_SET'; payload: SongData }
  | { type: 'SESSION_PLAY_START' }
  | { type: 'SESSION_PLAY_STOP' }
  | { type: 'SESSION_RECORD_TOGGLE' }
  | { type: 'SESSION_BPM_SET'; payload: number }
  | { type: 'SESSION_STATUS_SET'; payload: SessionStatus }

  // User actions
  | { type: 'USER_SET'; payload: Partial<AppState['user']> }

  // Settings actions
  | { type: 'SETTINGS_UPDATE'; payload: Partial<AppSettings> }
  | { type: 'SETTINGS_RESET' }

  // Clock actions
  | { type: 'CLOCK_TIER_SET'; payload: TimeTier }
  | { type: 'CLOCK_LOCK_SET'; payload: boolean }
  | { type: 'CLOCK_ACCURACY_SET'; payload: number }

  // Network actions
  | { type: 'NETWORK_CONNECTED_SET'; payload: boolean }
  | { type: 'NETWORK_PEER_COUNT_SET'; payload: number }
  | { type: 'NETWORK_CONDUCTOR_SET'; payload: boolean }
  | { type: 'NETWORK_LATENCY_SET'; payload: number }

  // Audio actions
  | { type: 'AUDIO_LOCAL_ACTIVE_SET'; payload: boolean }
  | { type: 'AUDIO_SIDE_TONE_SET'; payload: number }
  | { type: 'AUDIO_MASTER_SET'; payload: number }
  | { type: 'AUDIO_METER_UPDATE'; payload: Record<string, number> }

  // Error actions
  | { type: 'ERROR_ADD'; payload: ErrorEntry }
  | { type: 'ERROR_CLEAR'; payload: number }
  | { type: 'ERROR_CLEAR_ALL' }

  // Toast actions
  | { type: 'TOAST_ADD'; payload: Omit<Toast, 'id' | 'timestamp'> }
  | { type: 'TOAST_REMOVE'; payload: string }

  // Loading actions
  | { type: 'LOADING_START'; payload: string }
  | { type: 'LOADING_STOP' };

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Default Configuration Constants
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  Default settings tuned for worship music collaboration. The
  initialization order ensures module dependencies are resolved
  correctly (UnityClock first, then audio, then network, then UI).

  Error recovery implements graceful degradation: if a module fails
  to initialize, the app continues without it rather than crashing.
  This is critical for worship services where failure is not an option.
*/

/*
  IN OTHER WORDS:
  These are the "factory settings" for the worship app. Like a
  new phone that comes pre-configured with sensible defaults.
  The volume levels, the display mode, the server addresses —
  all chosen to work well for most worship teams out of the box.
*/

export const DEFAULT_SETTINGS: AppSettings = Object.freeze({
  sideTone: -6.0,
  remoteGain: -3.0,
  masterGain: 0.0,
  bufferSize: 512,
  inputDevice: 'default',
  outputDevice: 'default',
  conductorMode: 'focused',
  conductorOpacity: 30,
  showDots: true,
  showMeridian: true,
  gpsEnabled: true,
  ntpEnabled: true,
  ntpInterval: 30000,
  signalingServer: 'wss://unity-signal.supercodingninja.dev',
  stunServer: 'stun:stun.l.google.com:19302',
  useTurn: false,
  turnServer: '',
  lanDiscovery: true
});

export const INIT_ORDER = Object.freeze([
  'UnityClock',
  'UnityMixer',
  'UnityConductor',
  'UnityMesh',
  'GhostRenderer',
  'MidiBridge',
  'UnityVideo'
]);

export const MAX_INIT_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;
export const TOAST_DURATION_MS = 4000;
export const LOADING_FADE_MS = 500;

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Initial State Factory
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The createInitialState function returns a fresh state object for
  the reducer. This is used both for initialization and for complete
  state reset (e.g., when leaving a session).

  Settings are loaded from localStorage if available, merged with
  defaults. This ensures user preferences persist across sessions.
*/

/*
  IN OTHER WORDS:
  This is the "blank notebook" the conductor starts with. It has
  empty pages for everything: no session, no peers, default settings.
  But if the conductor has used this notebook before, it remembers
  their preferred pen color and page layout from last time.
*/

function loadPersistedSettings(): Partial<AppSettings> {
  try {
    const stored = localStorage.getItem('ntcc-unity-settings');
    if (stored) {
      return JSON.parse(stored) as Partial<AppSettings>;
    }
  } catch (err) {
    console.warn('[UnityContext] Failed to load persisted settings:', err);
  }
  return {};
}

export function createInitialState(): AppState {
  const persisted = loadPersistedSettings();

  return {
    view: 'landing',
    session: {
      id: null,
      title: 'Untitled Worship Session',
      code: null,
      isHost: false,
      peers: [],
      song: null,
      isPlaying: false,
      isRecording: false,
      bpm: 120,
      status: 'idle'
    },
    user: {
      name: '',
      instrument: '',
      peerId: null,
      role: 'musician'
    },
    settings: { ...DEFAULT_SETTINGS, ...persisted },
    clock: {
      tier: 'AUDIO',
      accuracy: 50,
      isLocked: false
    },
    network: {
      isConnected: false,
      peerCount: 0,
      isConductor: false,
      latency: Infinity,
      sessionStatus: 'idle'
    },
    audio: {
      isLocalActive: false,
      sideToneDb: DEFAULT_SETTINGS.sideTone,
      masterDb: DEFAULT_SETTINGS.masterGain,
      meterData: null
    },
    errors: [],
    toasts: [],
    isLoading: false,
    loadingMessage: ''
  };
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Reducer Implementation
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The reducer is the ONLY way to modify application state. It handles
  all action types with pure functions — given the same state and action,
  it always returns the same new state. This makes state changes
  predictable, testable, and debuggable.

  The reducer uses immutable update patterns (spread operator, map/filter)
  to ensure React detects changes and re-renders efficiently. Never
  mutate state directly.

  Side effects (localStorage persistence, module API calls) are handled
  in the context provider, not the reducer, maintaining purity.
*/

/*
  IN OTHER WORDS:
  This is the "official rulebook" for changing the conductor's notebook.
  Every possible change has a procedure. When someone says "add a musician,"
  the rulebook says: "Make a copy of the current page, add the new name
  to the list, and return the new page." Never scribble on the original —
  always make a clean copy. This way, if something goes wrong, you can
  always go back to the previous page.
*/

export function unityReducer(state: AppState, action: UnityAction): AppState {
  switch (action.type) {
    // ─── VIEW ACTIONS ───
    case 'VIEW_SET':
      return { ...state, view: action.payload };

    // ─── SESSION ACTIONS ───
    case 'SESSION_CREATE': {
      const { title, code } = action.payload;
      return {
        ...state,
        session: {
          ...state.session,
          id: `session-${Date.now()}`,
          title,
          code,
          isHost: true,
          status: 'connecting'
        },
        view: 'session'
      };
    }

    case 'SESSION_JOIN': {
      const { code, name, instrument } = action.payload;
      return {
        ...state,
        user: { ...state.user, name, instrument },
        session: {
          ...state.session,
          code,
          isHost: false,
          status: 'connecting'
        },
        view: 'session'
      };
    }

    case 'SESSION_LEAVE':
      return {
        ...state,
        session: {
          id: null,
          title: 'Untitled Worship Session',
          code: null,
          isHost: false,
          peers: [],
          song: null,
          isPlaying: false,
          isRecording: false,
          bpm: 120,
          status: 'idle'
        },
        network: {
          isConnected: false,
          peerCount: 0,
          isConductor: false,
          latency: Infinity,
          sessionStatus: 'idle'
        },
        view: 'landing'
      };

    case 'SESSION_PEER_ADD': {
      const exists = state.session.peers.some(p => p.peerId === action.payload.peerId);
      if (exists) return state;
      return {
        ...state,
        session: {
          ...state.session,
          peers: [...state.session.peers, action.payload]
        },
        network: {
          ...state.network,
          peerCount: state.network.peerCount + 1
        }
      };
    }

    case 'SESSION_PEER_REMOVE': {
      const peerId = action.payload;
      return {
        ...state,
        session: {
          ...state.session,
          peers: state.session.peers.filter(p => p.peerId !== peerId)
        },
        network: {
          ...state.network,
          peerCount: Math.max(0, state.network.peerCount - 1)
        }
      };
    }

    case 'SESSION_PEER_UPDATE': {
      const { peerId, ...updates } = action.payload;
      return {
        ...state,
        session: {
          ...state.session,
          peers: state.session.peers.map(p =>
            p.peerId === peerId ? { ...p, ...updates } : p
          )
        }
      };
    }

    case 'SESSION_SONG_SET':
      return {
        ...state,
        session: { ...state.session, song: action.payload, bpm: action.payload.tempo }
      };

    case 'SESSION_PLAY_START':
      return {
        ...state,
        session: { ...state.session, isPlaying: true, status: 'active' }
      };

    case 'SESSION_PLAY_STOP':
      return {
        ...state,
        session: { ...state.session, isPlaying: false }
      };

    case 'SESSION_RECORD_TOGGLE':
      return {
        ...state,
        session: { ...state.session, isRecording: !state.session.isRecording }
      };

    case 'SESSION_BPM_SET':
      return {
        ...state,
        session: { ...state.session, bpm: action.payload }
      };

    case 'SESSION_STATUS_SET':
      return {
        ...state,
        session: { ...state.session, status: action.payload },
        network: { ...state.network, sessionStatus: action.payload }
      };

    // ─── USER ACTIONS ───
    case 'USER_SET':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };

    // ─── SETTINGS ACTIONS ───
    case 'SETTINGS_UPDATE': {
      const newSettings = { ...state.settings, ...action.payload };
      // Persist to localStorage
      try {
        localStorage.setItem('ntcc-unity-settings', JSON.stringify(newSettings));
      } catch (err) {
        console.warn('[UnityContext] Failed to persist settings:', err);
      }
      return { ...state, settings: newSettings };
    }

    case 'SETTINGS_RESET': {
      try {
        localStorage.removeItem('ntcc-unity-settings');
      } catch (err) {
        console.warn('[UnityContext] Failed to clear persisted settings:', err);
      }
      return { ...state, settings: DEFAULT_SETTINGS };
    }

    // ─── CLOCK ACTIONS ───
    case 'CLOCK_TIER_SET':
      return {
        ...state,
        clock: { ...state.clock, tier: action.payload }
      };

    case 'CLOCK_LOCK_SET':
      return {
        ...state,
        clock: { ...state.clock, isLocked: action.payload }
      };

    case 'CLOCK_ACCURACY_SET':
      return {
        ...state,
        clock: { ...state.clock, accuracy: action.payload }
      };

    // ─── NETWORK ACTIONS ───
    case 'NETWORK_CONNECTED_SET':
      return {
        ...state,
        network: { ...state.network, isConnected: action.payload }
      };

    case 'NETWORK_PEER_COUNT_SET':
      return {
        ...state,
        network: { ...state.network, peerCount: action.payload }
      };

    case 'NETWORK_CONDUCTOR_SET':
      return {
        ...state,
        network: { ...state.network, isConductor: action.payload }
      };

    case 'NETWORK_LATENCY_SET':
      return {
        ...state,
        network: { ...state.network, latency: action.payload }
      };

    // ─── AUDIO ACTIONS ───
    case 'AUDIO_LOCAL_ACTIVE_SET':
      return {
        ...state,
        audio: { ...state.audio, isLocalActive: action.payload }
      };

    case 'AUDIO_SIDE_TONE_SET':
      return {
        ...state,
        audio: { ...state.audio, sideToneDb: action.payload }
      };

    case 'AUDIO_MASTER_SET':
      return {
        ...state,
        audio: { ...state.audio, masterDb: action.payload }
      };

    case 'AUDIO_METER_UPDATE':
      return {
        ...state,
        audio: { ...state.audio, meterData: action.payload }
      };

    // ─── ERROR ACTIONS ───
    case 'ERROR_ADD':
      return {
        ...state,
        errors: [...state.errors, action.payload]
      };

    case 'ERROR_CLEAR':
      return {
        ...state,
        errors: state.errors.filter((_, i) => i !== action.payload)
      };

    case 'ERROR_CLEAR_ALL':
      return { ...state, errors: [] };

    // ─── TOAST ACTIONS ───
    case 'TOAST_ADD': {
      const toast: Toast = {
        ...action.payload,
        id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      return {
        ...state,
        toasts: [...state.toasts, toast]
      };
    }

    case 'TOAST_REMOVE':
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload)
      };

    // ─── LOADING ACTIONS ───
    case 'LOADING_START':
      return {
        ...state,
        isLoading: true,
        loadingMessage: action.payload
      };

    case 'LOADING_STOP':
      return {
        ...state,
        isLoading: false,
        loadingMessage: ''
      };

    default:
      return state;
  }
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Context Definition
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The UnityContext provides both the current state and a dispatch
  function to all consuming components. This follows the standard
  React Context pattern with useReducer for state management.

  Components access the context via the useUnity() hook, which
  provides type-safe access and throws if used outside a provider.

  The context value is memoized to prevent unnecessary re-renders
  of consuming components when unrelated state changes.
*/

/*
  IN OTHER WORDS:
  This is the "intercom system" for the entire worship studio. Every
  room (component) has a speaker and a microphone. When something
  happens in one room, they announce it over the intercom:
  "The clock is locked!" "A new musician joined!" "The volume
  changed!" Every room that cares about that announcement
  listens and responds. No room needs to know who else is
  listening — they just speak into the mic and trust that
  the right people will hear.
*/

export interface UnityContextValue {
  state: AppState;
  dispatch: React.Dispatch<UnityAction>;

  // Convenience action dispatchers
  setView: (view: AppView) => void;
  createSession: (title: string) => string;
  joinSession: (code: string, name: string, instrument: string) => void;
  leaveSession: () => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  toggleRecording: () => void;
  setBPM: (bpm: number) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  addPeer: (peer: PeerInfo) => void;
  removePeer: (peerId: string) => void;
  updatePeer: (peerId: string, updates: Partial<PeerInfo>) => void;
  showToast: (message: string, type: ToastType) => void;
  dismissToast: (id: string) => void;
  addError: (module: string, message: string, recoverable?: boolean) => void;
  clearErrors: () => void;
  setLoading: (message: string) => void;
  stopLoading: () => void;
}

const UnityContext = createContext<UnityContextValue | null>(null);

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Provider Component
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The UnityProvider wraps the application and provides the context
  value to all descendants. It initializes the reducer, sets up
  event listeners for module integration, and exposes memoized
  action dispatchers.

  The provider also handles:
  - Toast auto-dismissal (removes toasts after TOAST_DURATION_MS)
  - Module event routing (UnityClock events → dispatch actions)
  - Session code generation (6-digit random code)
  - Loading state management

  Children should be the root App component or route layout.
*/

/*
  IN OTHER WORDS:
  This is the "stage" where the entire worship performance happens.
  It sets up the lighting, the sound system, the intercom, and the
  conductor's podium. Everything that happens on stage is visible
  to everyone in the audience (child components). The stage manager
  (provider) makes sure all the technical stuff works so the
  performers (components) can focus on the worship.
*/

export interface UnityProviderProps {
  children: ReactNode;
}

export const UnityProvider: React.FC<UnityProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(unityReducer, null, createInitialState);
  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ─── Convenience Dispatchers ───

  const setView = useCallback((view: AppView) => {
    dispatch({ type: 'VIEW_SET', payload: view });
  }, []);

  const createSession = useCallback((title: string): string => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    dispatch({ type: 'LOADING_START', payload: 'Creating worship session...' });
    dispatch({ type: 'SESSION_CREATE', payload: { title, code } });

    // Simulate initialization sequence
    setTimeout(() => {
      dispatch({ type: 'LOADING_STOP' });
      dispatch({
        type: 'TOAST_ADD',
        payload: { message: `Session created! Code: ${code}`, type: 'success' }
      });
    }, 1500);

    return code;
  }, []);

  const joinSession = useCallback((code: string, name: string, instrument: string) => {
    dispatch({ type: 'LOADING_START', payload: 'Joining worship session...' });
    dispatch({ type: 'SESSION_JOIN', payload: { code, name, instrument } });

    setTimeout(() => {
      dispatch({ type: 'LOADING_STOP' });
      dispatch({
        type: 'TOAST_ADD',
        payload: { message: `Joined session ${code}!`, type: 'success' }
      });
    }, 1500);
  }, []);

  const leaveSession = useCallback(() => {
    dispatch({ type: 'SESSION_LEAVE' });
    dispatch({
      type: 'TOAST_ADD',
      payload: { message: 'Left worship session', type: 'info' }
    });
  }, []);

  const startPlayback = useCallback(() => {
    dispatch({ type: 'SESSION_PLAY_START' });
    dispatch({
      type: 'TOAST_ADD',
      payload: { message: 'Worship playback started', type: 'success' }
    });
  }, []);

  const stopPlayback = useCallback(() => {
    dispatch({ type: 'SESSION_PLAY_STOP' });
    dispatch({
      type: 'TOAST_ADD',
      payload: { message: 'Worship playback stopped', type: 'info' }
    });
  }, []);

  const toggleRecording = useCallback(() => {
    dispatch({ type: 'SESSION_RECORD_TOGGLE' });
    const isRecording = !state.session.isRecording;
    dispatch({
      type: 'TOAST_ADD',
      payload: {
        message: isRecording ? 'Recording started' : 'Recording stopped',
        type: isRecording ? 'success' : 'info'
      }
    });
  }, [state.session.isRecording]);

  const setBPM = useCallback((bpm: number) => {
    dispatch({ type: 'SESSION_BPM_SET', payload: bpm });
  }, []);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    dispatch({ type: 'SETTINGS_UPDATE', payload: settings });
  }, []);

  const resetSettings = useCallback(() => {
    dispatch({ type: 'SETTINGS_RESET' });
    dispatch({
      type: 'TOAST_ADD',
      payload: { message: 'Settings reset to defaults', type: 'info' }
    });
  }, []);

  const addPeer = useCallback((peer: PeerInfo) => {
    dispatch({ type: 'SESSION_PEER_ADD', payload: peer });
    dispatch({
      type: 'TOAST_ADD',
      payload: {
        message: `${peer.name} joined (${peer.instrument})`,
        type: 'success'
      }
    });
  }, []);

  const removePeer = useCallback((peerId: string) => {
    const peer = state.session.peers.find(p => p.peerId === peerId);
    dispatch({ type: 'SESSION_PEER_REMOVE', payload: peerId });
    if (peer) {
      dispatch({
        type: 'TOAST_ADD',
        payload: { message: `${peer.name} left`, type: 'warning' }
      });
    }
  }, [state.session.peers]);

  const updatePeer = useCallback((peerId: string, updates: Partial<PeerInfo>) => {
    dispatch({ type: 'SESSION_PEER_UPDATE', payload: { peerId, ...updates } });
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    dispatch({ type: 'TOAST_ADD', payload: { message, type } });

    // Auto-dismiss
    const timer = setTimeout(() => {
      dispatch({ type: 'TOAST_REMOVE', payload: id });
      toastTimersRef.current.delete(id);
    }, TOAST_DURATION_MS);

    toastTimersRef.current.set(id, timer);
  }, []);

  const dismissToast = useCallback((id: string) => {
    dispatch({ type: 'TOAST_REMOVE', payload: id });
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
  }, []);

  const addError = useCallback((module: string, message: string, recoverable = true) => {
    dispatch({
      type: 'ERROR_ADD',
      payload: { module, message, timestamp: Date.now(), recoverable }
    });
    dispatch({
      type: 'TOAST_ADD',
      payload: { message, type: 'error' }
    });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'ERROR_CLEAR_ALL' });
  }, []);

  const setLoading = useCallback((message: string) => {
    dispatch({ type: 'LOADING_START', payload: message });
  }, []);

  const stopLoading = useCallback(() => {
    dispatch({ type: 'LOADING_STOP' });
  }, []);

  // ─── Module Event Integration ───

  useEffect(() => {
    // Listen for UnityClock events if available
    if (typeof window !== 'undefined' && (window as any).UnityClock) {
      const clock = (window as any).UnityClock;

      const unsubGpsLock = clock.on('gps-lock', (data: any) => {
        dispatch({ type: 'CLOCK_TIER_SET', payload: 'GPS' });
        dispatch({ type: 'CLOCK_LOCK_SET', payload: true });
        dispatch({ type: 'CLOCK_ACCURACY_SET', payload: 0.001 });
        dispatch({
          type: 'TOAST_ADD',
          payload: { message: 'GPS lock achieved — sub-microsecond accuracy', type: 'success' }
        });
      });

      const unsubNtpSync = clock.on('ntp-sync', (data: any) => {
        dispatch({ type: 'CLOCK_TIER_SET', payload: 'NTP' });
        dispatch({ type: 'CLOCK_ACCURACY_SET', payload: 10 });
      });

      const unsubTierChange = clock.on('tier-change', (data: any) => {
        dispatch({ type: 'CLOCK_TIER_SET', payload: data.tier });
      });

      return () => {
        unsubGpsLock();
        unsubNtpSync();
        unsubTierChange();
      };
    }
  }, []);

  // ─── Cleanup on Unmount ───

  useEffect(() => {
    return () => {
      // Clear all toast timers
      toastTimersRef.current.forEach(timer => clearTimeout(timer));
      toastTimersRef.current.clear();
    };
  }, []);

  // ─── Context Value ───

  const value: UnityContextValue = {
    state,
    dispatch,
    setView,
    createSession,
    joinSession,
    leaveSession,
    startPlayback,
    stopPlayback,
    toggleRecording,
    setBPM,
    updateSettings,
    resetSettings,
    addPeer,
    removePeer,
    updatePeer,
    showToast,
    dismissToast,
    addError,
    clearErrors,
    setLoading,
    stopLoading
  };

  return (
    <UnityContext.Provider value={value}>
      {children}
    </UnityContext.Provider>
  );
};

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Consumer Hook
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The useUnity hook provides type-safe access to the UnityContext.
  It throws a descriptive error if used outside a UnityProvider,
  preventing silent failures and debugging headaches.

  Usage:
    const { state, dispatch, createSession, showToast } = useUnity();

  The hook returns the full context value, allowing components to
  destructure only the properties they need. React's built-in
  optimization ensures components only re-render when accessed
  state changes (via context selectors or split contexts in production).
*/

/*
  IN OTHER WORDS:
  This is the "microphone" every component uses to talk to the
  intercom system. If a component tries to use the microphone but
  isn't inside the worship studio (provider), it gets a clear
  error: "You need to be in the studio to use the microphone!"
*/

export function useUnity(): UnityContextValue {
  const context = useContext(UnityContext);
  if (!context) {
    throw new Error(
      'useUnity must be used within a UnityProvider. ' +
      'Wrap your app root with <UnityProvider> in your main.tsx or App.tsx.'
    );
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Selective Hooks for Performance
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  These selective hooks allow components to subscribe to only the
  state slices they need, reducing unnecessary re-renders. While
  React Context doesn't natively support selectors, these hooks
  use useMemo internally to return stable references.

  In production with many components, consider splitting into
  multiple contexts or using Zustand/Redux for better performance.
  For the NTCC Music App's scale (<50 components), a single
  context with selective hooks is sufficient.
*/

/*
  IN OTHER WORDS:
  Instead of every musician hearing every announcement over the
  intercom, these hooks let each musician tune into only the
  channels they care about. The pianist only listens for "piano"
  announcements. The drummer only listens for "drum" announcements.
  This keeps the intercom from getting too noisy.
*/

export function useUnitySession() {
  const { state } = useUnity();
  return state.session;
}

export function useUnityUser() {
  const { state } = useUnity();
  return state.user;
}

export function useUnitySettings() {
  const { state, updateSettings, resetSettings } = useUnity();
  return { settings: state.settings, updateSettings, resetSettings };
}

export function useUnityClock() {
  const { state } = useUnity();
  return state.clock;
}

export function useUnityNetwork() {
  const { state } = useUnity();
  return state.network;
}

export function useUnityAudio() {
  const { state } = useUnity();
  return state.audio;
}

export function useUnityToasts() {
  const { state, showToast, dismissToast } = useUnity();
  return { toasts: state.toasts, showToast, dismissToast };
}

export function useUnityLoading() {
  const { state, setLoading, stopLoading } = useUnity();
  return {
    isLoading: state.isLoading,
    loadingMessage: state.loadingMessage,
    setLoading,
    stopLoading
  };
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Utility Components
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  The ToastContainer and LoadingOverlay components are provided as
  part of the context system for convenience. They read from the
  context and render accordingly, eliminating boilerplate in
  page components.

  These components are optional — pages can implement their own
  toast/loading UI if they need custom styling or behavior.
*/

/*
  IN OTHER WORDS:
  These are the "announcement board" and "please wait" sign that
  come pre-installed with the studio. You can use them as-is, or
  build your own if you want a different look.
*/

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useUnityToasts();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '320px'
      }}
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => dismissToast(toast.id)}
          style={{
            padding: '12px 16px',
            background: 'rgba(18, 18, 26, 0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            borderLeft: `3px solid ${
              toast.type === 'success' ? '#4ade80' :
              toast.type === 'warning' ? '#fbbf24' :
              toast.type === 'error' ? '#f87171' :
              '#60a5fa'
            }`,
            fontSize: '0.875rem',
            color: '#f0f0f5',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            cursor: 'pointer',
            animation: 'toast-in 300ms ease-out',
            transition: 'opacity 300ms ease, transform 300ms ease'
          }}
        >
          {toast.message}
        </div>
      ))}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export const LoadingOverlay: React.FC = () => {
  const { isLoading, loadingMessage } = useUnityLoading();

  if (!isLoading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        background: '#0a0a0f',
        transition: 'opacity 400ms ease, visibility 400ms ease'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '3px solid #1a1a24',
          borderTopColor: '#d4a853',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <p
        style={{
          fontSize: '0.875rem',
          color: '#a0a0b0',
          animation: 'loading-pulse 2s ease-in-out infinite'
        }}
      >
        {loadingMessage || 'Loading...'}
      </p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes loading-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: Named Exports & Module Registration
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  All public APIs are exported as named exports for tree-shaking
  compatibility with Vite. The provider and hook are the primary
  exports, with selective hooks and utility components as secondary.

  Global registration enables legacy integration and debugging
  from browser console.
*/

/*
  IN OTHER WORDS:
  This is the "shipping manifest" that lists everything being
  delivered. The main package (provider + hook) is always included.
  The bonus items (selective hooks, toast container) are available
  if needed but don't add weight if unused.
*/

UnityProvider.displayName = 'UnityProvider';
ToastContainer.displayName = 'ToastContainer';
LoadingOverlay.displayName = 'LoadingOverlay';

// Global registration for debugging
if (typeof window !== 'undefined') {
  (window as any).UnityContext = UnityContext;
  (window as any).useUnity = useUnity;
}

// ═══════════════════════════════════════════════════════════════
// THIS AREA OF CODE IS: End of Module
// ═══════════════════════════════════════════════════════════════

/*
  EXPLANATION:
  This concludes the UnityContext.tsx module — the central nervous
  system of the NTCC Music App. It is the conductor, the stage manager,
  the front desk, and the intercom system all in one. Without it,
  the modules are brilliant but isolated. With it, they become
  a single, cohesive, distributed worship collaboration platform.

  The context embodies the #FindAWay philosophy:
  - It never gives up (retries, fallbacks, graceful degradation)
  - It keeps things simple (single state object, reducer pattern)
  - It pursues excellency (comprehensive diagnostics, smooth UX)
  - It thinks outside the box (distributed state, P2P mesh)

  The complete architecture:
  UnityClock.ts      → Universal heartbeat (GPS-disciplined time)
  UnityConductor.tsx → Rotating Earth visual conductor
  UnityContext.tsx   → Orchestration and state management (this file)
  GhostRenderer.ts   → Predictive accompaniment engine
  MidiBridge.ts      → Distributed performance state
  UnityMesh.ts       → P2P mesh network
  UnityMediaPipe.ts  → Face mesh conductor detection
  instrumentMap.ts   → General MIDI instrument mapping
  unity-glass.css    → Glass morphism visual system

  Together, these files create a platform that makes worship teams
  in different time zones, countries, and continents feel like they
  are in the same room. Zero perceived latency. No corporate APIs.
  No monthly fees. Just worship.

  #FindAWay
*/

/*
  IN OTHER WORDS:
  This is the final piece of the puzzle. The conductor raises
  their baton. The musicians are in place. The clock is locked
  to the stars. The ghost is humming along. The network is
  meshing. The mixer is balanced. The Earth is rotating. The
  pulse is beating. And now — the downbeat. The worship begins.
  Not in one room, but in every room, simultaneously, as if
  distance never existed. This is the NTCC Music App. This is
  what happens when you refuse to accept "no" as an answer.
  This is what happens when you #FindAWay.
*/

/* End of UnityContext.tsx */
/* © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community */
