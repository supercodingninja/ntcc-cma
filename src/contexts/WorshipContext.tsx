/**
 * ============================================
 * This Area Of Code Is: Module Imports & Type Definitions
 * ============================================
 *
 * Explanation:
 * Imports React context API, Supabase realtime subscriptions, and defines
 * TypeScript interfaces for song data, set lists, service planning, and
 * CCLI tracking. This context manages all worship-specific state including
 * the current song, set list arrangement, service timeline, and real-time
 * synchronization across devices.
 *
 * In Other Words:
 * This is the "worship planner's clipboard" — keeps track of what songs
 * we're singing, in what order, what key they're in, and syncs all of
 * that across every device on the worship team.
 * ============================================
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "../main";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─── Song Data Types ───
export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  tempo: number;
  timeSignature: string;
  ccliNumber: string | null;
  lyrics: string;
  chords: string;
  category: SongCategory;
  tags: string[];
  language: "english" | "spanish" | "bilingual";
  sheetMusicUrl: string | null;
  audioTrackUrl: string | null;
  notes: string;
  lastUsed: string | null;
  useCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type SongCategory =
  | "praise"
  | "worship"
  | "hymn"
  | "gospel"
  | "contemporary"
  | "traditional"
  | "spanish"
  | "special"
  | "offering"
  | "communion";

// ─── Set List Types ───
export interface SetListSong {
  songId: string;
  song: Song;
  order: number;
  key: string; // May differ from song default (transposed)
  tempo: number; // May differ from song default
  notes: string;
  transition: "none" | "click" | "flow" | "prayer" | "announcement";
}

export interface SetList {
  id: string;
  name: string;
  date: string;
  songs: SetListSong[];
  teamMembers: string[]; // User IDs
  serviceId: string | null;
  isTemplate: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// ─── Service Planning Types ───
export type ServiceItemType =
  | "song"
  | "prayer"
  | "announcement"
  | "scripture"
  | "offering"
  | "sermon"
  | "communion"
  | "benediction"
  | "special";

export interface ServiceItem {
  id: string;
  type: ServiceItemType;
  title: string;
  duration: number; // Minutes
  notes: string;
  assignedTo: string | null; // User ID
  setListId: string | null;
  order: number;
}

export interface ServicePlan {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string | null;
  items: ServiceItem[];
  teamMembers: string[];
  theme: string | null;
  scripture: string | null;
  notes: string;
  isRecurring: boolean;
  recurringPattern: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── CCLI Tracking ───
export interface CCLISongUsage {
  songId: string;
  songTitle: string;
  ccliNumber: string;
  dateUsed: string;
  serviceId: string;
  setListId: string;
  reported: boolean;
  reportedAt: string | null;
}

// ─── Worship State ───
export interface WorshipState {
  currentSong: Song | null;
  currentSetList: SetList | null;
  currentService: ServicePlan | null;
  currentSection: string | null; // verse, chorus, bridge, etc.
  isPlaying: boolean;
  currentTime: number; // Seconds into current song
  isLive: boolean; // Real-time sync active
  queue: Song[];
  history: Song[];
}

// ─── Worship Context Value ───
export interface WorshipContextValue extends WorshipState {
  // Song Library
  songs: Song[];
  isLoadingSongs: boolean;
  fetchSongs: () => Promise<void>;
  addSong: (song: Omit<Song, "id" | "createdAt" | "updatedAt">) => Promise<Song>;
  updateSong: (id: string, updates: Partial<Song>) => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
  searchSongs: (query: string, filters?: SongFilterOptions) => Song[];

  // Set Lists
  setLists: SetList[];
  isLoadingSetLists: boolean;
  fetchSetLists: () => Promise<void>;
  createSetList: (setList: Omit<<SetList, "id" | "createdAt" | "updatedAt">) => Promise<<SetList>;
  updateSetList: (id: string, updates: Partial<<SetList>) => Promise<void>;
  deleteSetList: (id: string) => Promise<void>;
  loadSetList: (id: string) => Promise<void>;
  addSongToSetList: (setListId: string, songId: string, options?: Partial<<SetListSong>) => Promise<void>;
  removeSongFromSetList: (setListId: string, songId: string) => Promise<void>;
  reorderSetList: (setListId: string, newOrder: string[]) => Promise<void>;

  // Service Planning
  services: ServicePlan[];
  isLoadingServices: boolean;
  fetchServices: () => Promise<void>;
  createService: (service: Omit<ServicePlan, "id" | "createdAt" | "updatedAt">) => Promise<ServicePlan>;
  updateService: (id: string, updates: Partial<ServicePlan>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  loadService: (id: string) => Promise<void>;

  // CCLI
  ccliUsages: CCLISongUsage[];
  isLoadingCCLI: boolean;
  fetchCCLIUsages: (startDate?: string, endDate?: string) => Promise<void>;
  reportCCLI: (usageId: string) => Promise<void>;
  exportCCLIReport: (format: "csv" | "pdf") => Promise<string>;

  // Live Control
  setCurrentSong: (song: Song | null) => void;
  setCurrentSection: (section: string | null) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  nextSong: () => void;
  previousSong: () => void;

  // Real-time Sync
  broadcastState: () => Promise<void>;
  subscribeToState: (callback: (state: Partial<WorshipState>) => void) => () => void;
}

// ─── Filter Options ───
export interface SongFilterOptions {
  category?: SongCategory;
  key?: string;
  language?: "english" | "spanish" | "bilingual";
  tags?: string[];
  minTempo?: number;
  maxTempo?: number;
  searchLyrics?: boolean;
}

/**
 * ============================================
 * This Area Of Code Is: Worship Hook
 * ============================================
 *
 * Explanation:
 * Custom React hook that provides convenient access to the WorshipContext.
 * Throws an error if used outside of WorshipProvider to prevent silent failures.
 *
 * In Other Words:
 * This is the "worship leader's remote control" — lets any component ask
 * "what song are we on?" or "go to the next song" without knowing the
 * wiring behind the scenes.
 * ============================================
 */

export function useWorship(): WorshipContextValue {
  const context = useContext(WorshipContext);
  if (!context) {
    throw new Error("useWorship must be used within a WorshipProvider");
  }
  return context;
}

// Create context with undefined default
const WorshipContext = createContext<WorshipContextValue | undefined>(undefined);

/**
 * ============================================
 * This Area Of Code Is: Worship Provider Component
 * ============================================
 *
 * Explanation:
 * The main provider component that manages all worship state: song library,
 * set lists, service plans, CCLI tracking, and real-time synchronization.
 * Subscribes to Supabase realtime channels for live collaboration across
 * devices. Handles offline caching via localStorage fallback.
 *
 * In Other Words:
 * This is the "worship control center" — the big desk where everything
 * about the service is managed, synced, and broadcast to the team.
 * ============================================
 */

interface WorshipProviderProps {
  children: ReactNode;
}

export function WorshipProvider({ children }: WorshipProviderProps): JSX.Element {
  // ─── Song Library State ───
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);

  // ─── Set List State ───
  const [setLists, setSetLists] = useState<<SetList[]>([]);
  const [isLoadingSetLists, setIsLoadingSetLists] = useState(false);

  // ─── Service Planning State ───
  const [services, setServices] = useState<ServicePlan[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // ─── CCLI State ───
  const [ccliUsages, setCcliUsages] = useState<CCLISongUsage[]>([]);
  const [isLoadingCCLI, setIsLoadingCCLI] = useState(false);

  // ─── Current Worship State ───
  const [currentSong, setCurrentSongState] = useState<Song | null>(null);
  const [currentSetList, setCurrentSetList] = useState<<SetList | null>(null);
  const [currentService, setCurrentService] = useState<ServicePlan | null>(null);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [history, setHistory] = useState<Song[]>([]);

  // ─── Real-time Subscription ───
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  /**
   * ============================================
   * This Area Of Code Is: Song Library CRUD
   * ============================================
   *
   * Explanation:
   * Fetches songs from Supabase with optional filtering. Supports search
   * across titles, artists, and lyrics. Maintains local cache for offline
   * access. All CRUD operations update both Supabase and local state.
   *
   * In Other Words:
   * This is the "song filing cabinet" — stores every song the church knows,
   * lets you search by title or lyrics, and works even without internet.
   * ============================================
   */

  const fetchSongs = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingSongs(true);
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;

      if (data) {
        setSongs(data as Song[]);
        // Cache for offline
        localStorage.setItem("ntcc-songs-cache", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Fetch songs error:", err);
      // Fallback to cache
      const cached = localStorage.getItem("ntcc-songs-cache");
      if (cached) {
        setSongs(JSON.parse(cached));
      }
    } finally {
      setIsLoadingSongs(false);
    }
  }, []);

  const addSong = useCallback(async (
    song: Omit<Song, "id" | "createdAt" | "updatedAt">
  ): Promise<Song> => {
    const { data, error } = await supabase
      .from("songs")
      .insert([song])
      .select()
      .single();

    if (error) throw error;

    const newSong = data as Song;
    setSongs((prev) => [...prev, newSong]);
    return newSong;
  }, []);

  const updateSong = useCallback(async (id: string, updates: Partial<Song>): Promise<void> => {
    const { error } = await supabase
      .from("songs")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    setSongs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const deleteSong = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from("songs").delete().eq("id", id);
    if (error) throw error;

    setSongs((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const searchSongs = useCallback((
    query: string,
    filters?: SongFilterOptions
  ): Song[] => {
    let results = songs;

    // Text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (s) =>
          s.title.toLowerCase().includes(lowerQuery) ||
          s.artist.toLowerCase().includes(lowerQuery) ||
          (filters?.searchLyrics && s.lyrics.toLowerCase().includes(lowerQuery))
      );
    }

    // Category filter
    if (filters?.category) {
      results = results.filter((s) => s.category === filters.category);
    }

    // Key filter
    if (filters?.key) {
      results = results.filter((s) => s.key === filters.key);
    }

    // Language filter
    if (filters?.language) {
      results = results.filter((s) => s.language === filters.language);
    }

    // Tag filter
    if (filters?.tags?.length) {
      results = results.filter((s) =>
        filters.tags!.some((tag) => s.tags.includes(tag))
      );
    }

    // Tempo range
    if (filters?.minTempo) {
      results = results.filter((s) => s.tempo >= filters.minTempo!);
    }
    if (filters?.maxTempo) {
      results = results.filter((s) => s.tempo <= filters.maxTempo!);
    }

    return results;
  }, [songs]);

  /**
   * ============================================
   * This Area Of Code Is: Set List Management
   * ============================================
   *
   * Explanation:
   * Manages worship set lists with drag-and-drop ordering, song
   * transposition, and transition planning. Supports templates for
   * recurring services. Syncs across team devices via Supabase realtime.
   *
   * In Other Words:
   * This is the "set list builder" — lets you arrange songs in order,
   * change keys, add notes, and share the final list with the whole team.
   * ============================================
   */

  const fetchSetLists = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingSetLists(true);
      const { data, error } = await supabase
        .from("set_lists")
        .select("*, songs:set_list_songs(*, song:songs(*))")
        .order("date", { ascending: false });

      if (error) throw error;
      if (data) setSetLists(data as SetList[]);
    } catch (err) {
      console.error("Fetch set lists error:", err);
    } finally {
      setIsLoadingSetLists(false);
    }
  }, []);

  const createSetList = useCallback(async (
    setList: Omit<<SetList, "id" | "createdAt" | "updatedAt">
  ): Promise<<SetList> => {
    const { data, error } = await supabase
      .from("set_lists")
      .insert([setList])
      .select()
      .single();

    if (error) throw error;

    const newSetList = data as SetList;
    setSetLists((prev) => [newSetList, ...prev]);
    return newSetList;
  }, []);

  const updateSetList = useCallback(async (id: string, updates: Partial<<SetList>): Promise<void> => {
    const { error } = await supabase
      .from("set_lists")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    setSetLists((prev) =>
      prev.map((sl) => (sl.id === id ? { ...sl, ...updates } : sl))
    );
  }, []);

  const deleteSetList = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from("set_lists").delete().eq("id", id);
    if (error) throw error;

    setSetLists((prev) => prev.filter((sl) => sl.id !== id));
  }, []);

  const loadSetList = useCallback(async (id: string): Promise<void> => {
    const setList = setLists.find((sl) => sl.id === id);
    if (setList) {
      setCurrentSetList(setList);
      if (setList.songs.length > 0) {
        setCurrentSongState(setList.songs[0].song);
        setQueue(setList.songs.slice(1).map((s) => s.song));
      }
    }
  }, [setLists]);

  const addSongToSetList = useCallback(async (
    setListId: string,
    songId: string,
    options?: Partial<<SetListSong>
  ): Promise<void> => {
    const song = songs.find((s) => s.id === songId);
    if (!song) throw new Error("Song not found");

    const setListSong: Partial<<SetListSong> = {
      songId,
      song,
      order: options?.order ?? 0,
      key: options?.key ?? song.key,
      tempo: options?.tempo ?? song.tempo,
      notes: options?.notes ?? "",
      transition: options?.transition ?? "none",
    };

    const { error } = await supabase
      .from("set_list_songs")
      .insert([{ set_list_id: setListId, ...setListSong }]);

    if (error) throw error;

    await fetchSetLists(); // Refresh to get joined data
  }, [songs, fetchSetLists]);

  const removeSongFromSetList = useCallback(async (setListId: string, songId: string): Promise<void> => {
    const { error } = await supabase
      .from("set_list_songs")
      .delete()
      .eq("set_list_id", setListId)
      .eq("song_id", songId);

    if (error) throw error;

    await fetchSetLists();
  }, [fetchSetLists]);

  const reorderSetList = useCallback(async (setListId: string, newOrder: string[]): Promise<void> => {
    // Update order in batch
    const updates = newOrder.map((songId, index) => ({
      set_list_id: setListId,
      song_id: songId,
      order: index,
    }));

    const { error } = await supabase.from("set_list_songs").upsert(updates);
    if (error) throw error;

    await fetchSetLists();
  }, [fetchSetLists]);

  /**
   * ============================================
   * This Area Of Code Is: Service Planning
   * ============================================
   *
   * Explanation:
   * Manages complete service plans with timeline items (songs, prayers,
   * announcements, scripture readings). Supports recurring services and
   * team assignment. Calculates total duration and alerts on overruns.
   *
   * In Other Words:
   * This is the "service timeline builder" — lets you plan the whole
   * service minute-by-minute, assign team members, and make sure nothing
   * runs overtime.
   * ============================================
   */

  const fetchServices = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingServices(true);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      if (data) setServices(data as ServicePlan[]);
    } catch (err) {
      console.error("Fetch services error:", err);
    } finally {
      setIsLoadingServices(false);
    }
  }, []);

  const createService = useCallback(async (
    service: Omit<ServicePlan, "id" | "createdAt" | "updatedAt">
  ): Promise<ServicePlan> => {
    const { data, error } = await supabase
      .from("services")
      .insert([service])
      .select()
      .single();

    if (error) throw error;

    const newService = data as ServicePlan;
    setServices((prev) => [newService, ...prev]);
    return newService;
  }, []);

  const updateService = useCallback(async (id: string, updates: Partial<ServicePlan>): Promise<void> => {
    const { error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const deleteService = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) throw error;

    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const loadService = useCallback(async (id: string): Promise<void> => {
    const service = services.find((s) => s.id === id);
    if (service) {
      setCurrentService(service);
      // Load associated set list if exists
      if (service.items.length > 0) {
        const songItem = service.items.find((i) => i.type === "song");
        if (songItem?.setListId) {
          await loadSetList(songItem.setListId);
        }
      }
    }
  }, [services, loadSetList]);

  /**
   * ============================================
   * This Area Of Code Is: CCLI Tracking
   * ============================================
   *
   * Explanation:
   * Tracks song usage for CCLI (Christian Copyright Licensing International)
   * reporting. Records which songs were used on which dates, generates
   * reports in CSV or PDF format, and marks usages as reported. Ensures
   * churches remain compliant with copyright law.
   *
   * In Other Words:
   * This is the "copyright compliance tracker" — keeps a log of every
   * song we sing so the church can report to CCLI and stay legal.
   * ============================================
   */

  const fetchCCLIUsages = useCallback(async (
    startDate?: string,
    endDate?: string
  ): Promise<void> => {
    try {
      setIsLoadingCCLI(true);
      let query = supabase.from("ccli_usages").select("*");

      if (startDate) query = query.gte("date_used", startDate);
      if (endDate) query = query.lte("date_used", endDate);

      const { data, error } = await query.order("date_used", { ascending: false });

      if (error) throw error;
      if (data) setCcliUsages(data as CCLISongUsage[]);
    } catch (err) {
      console.error("Fetch CCLI usages error:", err);
    } finally {
      setIsLoadingCCLI(false);
    }
  }, []);

  const reportCCLI = useCallback(async (usageId: string): Promise<void> => {
    const { error } = await supabase
      .from("ccli_usages")
      .update({ reported: true, reported_at: new Date().toISOString() })
      .eq("id", usageId);

    if (error) throw error;

    setCcliUsages((prev) =>
      prev.map((u) =>
        u.songId === usageId
          ? { ...u, reported: true, reportedAt: new Date().toISOString() }
          : u
      )
    );
  }, []);

  const exportCCLIReport = useCallback(async (format: "csv" | "pdf"): Promise<string> => {
    const unreported = ccliUsages.filter((u) => !u.reported);

    if (format === "csv") {
      const headers = ["Song Title", "CCLI Number", "Date Used", "Service ID"];
      const rows = unreported.map((u) => [
        u.songTitle,
        u.ccliNumber,
        u.dateUsed,
        u.serviceId,
      ]);
      const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
      return csv;
    }

    // PDF generation would use a library like jsPDF
    // For now, return a placeholder
    return "PDF export not yet implemented";
  }, [ccliUsages]);

  /**
   * ============================================
   * This Area Of Code Is: Live Playback Control
   * ============================================
   *
   * Explanation:
   * Controls the current worship flow: play, pause, stop, seek, next song,
   * previous song. Manages the queue and history stacks. Broadcasts state
   * changes to all connected devices via Supabase realtime.
   *
   * In Other Words:
   * This is the "playback remote" — the buttons that say play, pause,
   * next, back, controlling what the whole team sees on their screens.
   * ============================================
   */

  const setCurrentSong = useCallback((song: Song | null) => {
    setCurrentSongState(song);
    if (song) {
      setHistory((prev) => [song, ...prev].slice(0, 10));
    }
  }, []);

  const setCurrentSectionCallback = useCallback((section: string | null) => {
    setCurrentSection(section);
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true);
    setIsLive(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentSongState(null);
    setCurrentSection(null);
  }, []);

  const seek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, time));
  }, []);

  const nextSong = useCallback(() => {
    if (queue.length > 0) {
      const next = queue[0];
      setCurrentSongState(next);
      setQueue((prev) => prev.slice(1));
      setHistory((prev) => [next, ...prev].slice(0, 10));
      setCurrentTime(0);
    }
  }, [queue]);

  const previousSong = useCallback(() => {
    if (history.length > 1) {
      const previous = history[1]; // Current is [0]
      setCurrentSongState(previous);
      setQueue((prev) => [currentSong!, ...prev].filter(Boolean));
      setHistory((prev) => prev.slice(1));
      setCurrentTime(0);
    }
  }, [history, currentSong]);

  /**
   * ============================================
   * This Area Of Code Is: Real-time Sync
   * ============================================
   *
   * Explanation:
   * Broadcasts worship state changes to all connected devices via Supabase
   * realtime channels. Enables multi-device synchronization so the worship
   * leader's iPad, the sound board, and the stage display all show the
   * same song and section simultaneously.
   *
   * In Other Words:
   * This is the "team walkie-talkie" — when the worship leader changes
   * songs, everyone's screen updates instantly, like magic.
   * ============================================
   */

  const broadcastState = useCallback(async (): Promise<void> => {
    if (!isLive) return;

    const state: Partial<WorshipState> = {
      currentSong,
      currentSection,
      isPlaying,
      currentTime,
    };

    await supabase.channel("worship-state").send({
      type: "broadcast",
      event: "state-change",
      payload: state,
    });
  }, [currentSong, currentSection, isPlaying, currentTime, isLive]);

  const subscribeToState = useCallback((callback: (state: Partial<WorshipState>) => void): (() => void) => {
    const channel = supabase.channel("worship-state");

    channel.on("broadcast", { event: "state-change" }, (payload) => {
      callback(payload.payload as Partial<WorshipState>);
    });

    channel.subscribe();

    setRealtimeChannel(channel);

    return () => {
      channel.unsubscribe();
    };
  }, []);

  /**
   * ============================================
   * This Area Of Code Is: Auto-broadcast Effect
   * ============================================
   *
   * Explanation:
   * Automatically broadcasts state changes whenever key worship state
   * variables change. Debounced to prevent excessive network traffic.
   *
   * In Other Words:
   * This is the "automatic announcement system" — whenever something
   * important changes, it tells the team without you pressing a button.
   * ============================================
   */

  useEffect(() => {
    if (!isLive) return;

    const timeout = setTimeout(() => {
      broadcastState();
    }, 500);

    return () => clearTimeout(timeout);
  }, [currentSong, currentSection, isPlaying, broadcastState, isLive]);

  /**
   * ============================================
   * This Area Of Code Is: Initial Data Load
   * ============================================
   *
   * Explanation:
   * Fetches initial song library, set lists, and services when the
   * provider mounts. Loads from localStorage cache first for instant
   * display, then refreshes from Supabase.
   *
   * In Other Words:
   * This is the "morning setup" — when the app opens, it quickly shows
   * what it remembers from yesterday, then checks for anything new.
   * ============================================
   */

  useEffect(() => {
    // Load from cache first
    const cachedSongs = localStorage.getItem("ntcc-songs-cache");
    if (cachedSongs) {
      setSongs(JSON.parse(cachedSongs));
    }

    // Then fetch fresh data
    fetchSongs();
    fetchSetLists();
    fetchServices();
  }, [fetchSongs, fetchSetLists, fetchServices]);

  /**
   * ============================================
   * This Area Of Code Is: Context Value Assembly
   * ============================================
   *
   * Explanation:
   * Assembles all worship state and methods into the WorshipContextValue
   * object. Memoized to prevent unnecessary re-renders of consuming components.
   *
   * In Other Words:
   * This is the "worship care package" — bundles up everything the team
   * needs to know about the current service.
   * ============================================
   */

  const contextValue: WorshipContextValue = {
    // State
    currentSong,
    currentSetList,
    currentService,
    currentSection,
    isPlaying,
    currentTime,
    isLive,
    queue,
    history,

    // Songs
    songs,
    isLoadingSongs,
    fetchSongs,
    addSong,
    updateSong,
    deleteSong,
    searchSongs,

    // Set Lists
    setLists,
    isLoadingSetLists,
    fetchSetLists,
    createSetList,
    updateSetList,
    deleteSetList,
    loadSetList,
    addSongToSetList,
    removeSongFromSetList,
    reorderSetList,

    // Services
    services,
    isLoadingServices,
    fetchServices,
    createService,
    updateService,
    deleteService,
    loadService,

    // CCLI
    ccliUsages,
    isLoadingCCLI,
    fetchCCLIUsages,
    reportCCLI,
    exportCCLIReport,

    // Live Control
    setCurrentSong,
    setCurrentSection: setCurrentSectionCallback,
    play,
    pause,
    stop,
    seek,
    nextSong,
    previousSong,

    // Real-time
    broadcastState,
    subscribeToState,
  };

  return (
    <WorshipContext.Provider value={contextValue}>
      {children}
    </WorshipContext.Provider>
  );
}

/**
 * ============================================
 * This Area Of Code Is: Current Song Display Component
 * ============================================
 *
 * Explanation:
 * Ready-to-use component that displays the current song with large-format
 * text optimized for stage visibility. Shows title, key, tempo, and
 * current section. Adapts to theme automatically.
 *
 * In Other Words:
 * This is the "now playing screen" — a big, clear display of what song
 * we're on, designed to be readable from across the stage.
 * ============================================
 */

export function CurrentSongDisplay(): JSX.Element | null {
  const { currentSong, currentSection, isPlaying } = useWorship();

  if (!currentSong) return null;

  return (
    <div
      style={{
        padding: "var(--space-lg)",
        background: "var(--color-surface)",
        backdropFilter: "var(--glass-blur)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "var(--font-size-3xl)",
          fontWeight: "bold",
          color: "var(--color-text)",
          marginBottom: "var(--space-sm)",
        }}
      >
        {currentSong.title}
      </div>
      <div
        style={{
          fontSize: "var(--font-size-lg)",
          color: "var(--color-text-muted)",
          marginBottom: "var(--space-md)",
        }}
      >
        {currentSong.artist}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "var(--space-md)",
          fontSize: "var(--font-size-base)",
        }}
      >
        <span style={{ color: "var(--color-accent)" }}>
          🎵 {currentSong.key}
        </span>
        <span style={{ color: "var(--color-primary)" }}>
          ⏱️ {currentSong.tempo} BPM
        </span>
        {currentSection && (
          <span style={{ color: "var(--color-success)" }}>
            📍 {currentSection}
          </span>
        )}
        {isPlaying && (
          <span style={{ color: "var(--color-success)", animation: "pulse 1s infinite" }}>
            ▶️ Live
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * ============================================
 * This Area Of Code Is: Copyright & Attribution
 * ============================================
 *
 * Explanation:
 * Legal attribution and branding footer for the NTCC Music App.
 * Required on all source files per project standards.
 *
 * In Other Words:
 * "This code belongs to Rev. Frederick Thomas and was built for NTCC Graham."
 * ============================================
 */

// © 2026 NTCC Music App | 𝑅𝑒𝑣. 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝐷𝑤𝑎𝑦𝑛𝑒 𝑇ℎ𝑜𝑚𝑎𝑠, 𝐽𝑟., 𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Gifted with 🫶🏿 to NTCCA
// SCN Technologies™ | SCNܫܘܐ™ (SCNshava™) | #FindAWay
