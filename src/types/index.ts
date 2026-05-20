// ============================================================
// FILE: src/types/index.ts
// NTCC Music App — Complete TypeScript Type Definitions
// ============================================================

// This Area Of Code Is: Core Database Schema Types (Supabase Tables)
// Explanation: These interfaces mirror the Supabase database tables exactly.
//              Every CRUD operation uses these types for type-safe database calls.
//              They define the shape of data stored in PostgreSQL via Supabase.
// In Other Words: These are the "blueprints" for every piece of data in the app —
//                  songs, users, teams, services, and everything stored in the database.

export interface Song {
  id: string
  title: string
  artist?: string
  composer?: string
  lyricist?: string
  ccli_number?: string
  license_type?: 'ccli' | 'public_domain' | 'original' | 'other'
  key?: string
  tempo?: number
  time_signature?: string
  lyrics?: string
  lyrics_es?: string
  lyrics_en?: string
  chords?: string
  chords_es?: string
  chords_en?: string
  category?: 'hymn' | 'praise' | 'worship' | 'gospel' | 'contemporary' | 'traditional'
  tags?: string[]
  language?: string
  translation_status?: 'none' | 'partial' | 'complete'
  sheet_music_url?: string
  audio_url?: string
  background_track_url?: string
  video_url?: string
  created_at: string
  updated_at: string
  created_by: string
  is_favorite?: boolean
  usage_count?: number
  last_used?: string
}

export interface User {
  id: string
  email: string
  full_name?: string
  display_name?: string
  avatar_url?: string
  role: 'admin' | 'music_director' | 'worship_leader' | 'musician' | 'singer' | 'viewer'
  instrument?: string
  vocal_range?: string
  phone?: string
  bio?: string
  is_active: boolean
  created_at: string
  last_login?: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  default_view: 'grid' | 'list'
  notifications_enabled: boolean
  auto_scroll_lyrics: boolean
  chord_notation: 'english' | 'spanish' | 'german' | 'numeric'
  default_key?: string
}

export interface Team {
  id: string
  name: string
  description?: string
  leader_id: string
  members?: TeamMember[]
  schedule?: ServiceSchedule[]
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  user?: User
  role_in_team: 'leader' | 'co_leader' | 'member' | 'backup'
  instrument?: string
  vocal_part?: 'soprano' | 'alto' | 'tenor' | 'bass' | 'none'
  joined_at: string
  is_active: boolean
}

export interface ServiceSchedule {
  id: string
  team_id: string
  date: string
  time: string
  location?: string
  theme?: string
  notes?: string
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface WorshipSet {
  id: string
  title: string
  date: string
  team_id?: string
  service_id?: string
  songs: SetSong[]
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
  is_template: boolean
}

export interface SetSong {
  id: string
  set_id: string
  song_id: string
  song?: Song
  order_index: number
  key: string
  tempo?: number
  notes?: string
  transition_type?: 'none' | 'fade' | 'immediate' | 'loop'
}

export interface PracticeSession {
  id: string
  title: string
  team_id?: string
  scheduled_at: string
  duration_minutes?: number
  location?: string
  video_call_url?: string
  recording_url?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  attendees?: PracticeAttendee[]
  notes?: string
  created_by: string
  created_at: string
}

export interface PracticeAttendee {
  id: string
  session_id: string
  user_id: string
  user?: User
  joined_at?: string
  left_at?: string
  is_present: boolean
}

export interface CCLIReport {
  id: string
  reporting_period: string
  songs_used: CCLISongUsage[]
  total_copies?: number
  total_projections?: number
  total_streams?: number
  total_prints?: number
  notes?: string
  submitted_by: string
  submitted_at: string
  status: 'draft' | 'submitted' | 'approved'
}

export interface CCLISongUsage {
  id: string
  report_id: string
  song_id: string
  song?: Song
  usage_count: number
  usage_type: 'projection' | 'copy' | 'stream' | 'print' | 'recording'
  date_used: string
}

export interface Resource {
  id: string
  title: string
  description?: string
  file_url: string
  file_type: 'pdf' | 'doc' | 'image' | 'audio' | 'video' | 'sheet_music' | 'other'
  category: 'sermon_notes' | 'media' | 'document' | 'tutorial' | 'other'
  tags?: string[]
  uploaded_by: string
  created_at: string
  is_public: boolean
}

export interface Translation {
  id: string
  song_id: string
  language_code: string
  language_name: string
  lyrics?: string
  chords?: string
  status: 'pending' | 'in_progress' | 'review' | 'approved'
  translated_by?: string
  reviewed_by?: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'service_reminder' | 'practice_reminder' | 'song_added' | 'team_update' | 'system'
  title: string
  message: string
  is_read: boolean
  created_at: string
  action_url?: string
}

export interface AppSettings {
  id: string
  church_name?: string
  church_logo_url?: string
  default_language: string
  supported_languages: string[]
  ccli_license_number?: string
  ccli_license_expiry?: string
  enable_auto_dubbing: boolean
  enable_ai_tools: boolean
  enable_offline_mode: boolean
  max_file_size_mb: number
  created_at: string
  updated_at: string
}

// ============================================================
// This Area Of Code Is: Audio & Music Processing Types
// Explanation: Types for audio processing, tuning, metronome,
//              waveform visualization, and real-time audio features.
//              Used by the tuner, metronome, recording, and Unity Solution™ modules.
// In Other Words: These types handle everything related to sound —
//                  tuning instruments, keeping beat, recording sessions, and audio effects.

export interface AudioConfig {
  sampleRate: number
  bufferSize: number
  channels: number
  bitDepth: number
}

export interface PitchData {
  frequency: number
  note: string
  octave: number
  cents: number
  isInTune: boolean
}

export interface TunerSettings {
  referencePitch: number
  tolerance: number
  instrument: string
  notation: 'english' | 'spanish' | 'german' | 'numeric'
}

export interface MetronomeSettings {
  bpm: number
  timeSignature: string
  sound: 'click' | 'wood' | 'cowbell' | 'hihat' | 'voice'
  accentFirstBeat: boolean
  visualPulse: boolean
}

export interface RecordingSession {
  id: string
  title: string
  audioBlob?: Blob
  duration: number
  createdAt: Date
  waveformData?: number[]
}

export interface WaveformConfig {
  barWidth: number
  barGap: number
  color: string
  smoothing: number
}

export interface AudioEffect {
  id: string
  name: string
  type: 'reverb' | 'delay' | 'chorus' | 'eq' | 'compression'
  params: Record<string, number>
  isActive: boolean
}

// ============================================================
// This Area Of Code Is: UI & Component Prop Types
// Explanation: Reusable prop interfaces for React components.
//              These ensure consistent props across the UI layer
//              and enable type-safe component composition.
// In Other Words: These are the "contracts" for how components talk to each other —
//                  what data they send and receive.

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  isDisabled?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onClick?: () => void
  children: React.ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: React.ReactNode
  footer?: React.ReactNode
  hideCloseButton?: boolean
}

export interface CardProps {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
  actions?: React.ReactNode
  isLoading?: boolean
  className?: string
  onClick?: () => void
}

export interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date' | 'file'
  placeholder?: string
  value?: string | number | boolean
  options?: { label: string; value: string }[]
  error?: string
  required?: boolean
  disabled?: boolean
  onChange: (value: string | number | boolean) => void
  onBlur?: () => void
}

export interface DataTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  isLoading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  pagination?: PaginationConfig
  actions?: (row: T) => React.ReactNode
}

export interface TableColumn<T> {
  key: string
  header: string
  width?: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

export interface PaginationConfig {
  page: number
  perPage: number
  total: number
  onPageChange: (page: number) => void
  onPerPageChange?: (perPage: number) => void
}

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  content: React.ReactNode
  isDisabled?: boolean
}

export interface DropdownOption {
  label: string
  value: string
  icon?: React.ReactNode
  isDisabled?: boolean
  onClick?: () => void
}

// ============================================================
// This Area Of Code Is: API & Service Response Types
// Explanation: Standardized response shapes for all API calls,
//              Supabase queries, and service layer functions.
//              Ensures consistent error handling and data access.
// In Other Words: These types wrap every API response so the app knows
//                  whether a request succeeded or failed, and what data came back.

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
  status: 'success' | 'error' | 'loading'
  message?: string
}

export interface ApiError {
  code: string
  message: string
  details?: string
  hint?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  perPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface SupabaseQueryOptions {
  select?: string
  eq?: Record<string, string | number | boolean>
  order?: { column: string; ascending?: boolean }
  limit?: number
  offset?: number
  search?: { column: string; query: string }
}

// ============================================================
// This Area Of Code Is: Authentication & Session Types
// Explanation: Types for user authentication state, JWT tokens,
//              session management, and permission checking.
// In Other Words: These types track who is logged in, what they can do,
//                  and how long their session lasts.

export interface AuthSession {
  user: User | null
  session: SessionData | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface SessionData {
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
  user: User
}

export interface Permission {
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
  allowed: boolean
}

export interface RolePermissions {
  role: string
  permissions: Permission[]
}

// ============================================================
// This Area Of Code Is: Real-Time & Collaboration Types
// Explanation: Types for WebSocket events, live collaboration,
//              video calls, and synchronized state across users.
// In Other Words: These types handle live features — when multiple people
//                  use the app together in real-time (chat, video, shared editing).

export interface RealTimeEvent {
  type: 'song_update' | 'set_change' | 'member_join' | 'member_leave' | 'chat_message' | 'cursor_move'
  payload: Record<string, unknown>
  timestamp: string
  userId: string
}

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: string
  type: 'text' | 'system' | 'file'
  fileUrl?: string
}

export interface VideoCallParticipant {
  id: string
  userId: string
  userName: string
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  joinedAt: string
}

export interface CursorPosition {
  userId: string
  x: number
  y: number
  page: string
  timestamp: string
}

// ============================================================
// This Area Of Code Is: Export & Report Types
// Explanation: Types for generating PDFs, CSVs, setlists, chord charts,
//              and other downloadable/exportable content.
// In Other Words: These types define what the app can print, download,
//                  or export — like chord sheets, setlists, and reports.

export interface ExportConfig {
  format: 'pdf' | 'csv' | 'txt' | 'json'
  filename: string
  includeHeaders?: boolean
  orientation?: 'portrait' | 'landscape'
  pageSize?: 'a4' | 'letter' | 'legal'
}

export interface ChordChartConfig {
  song: Song
  key: string
  notation: 'english' | 'spanish' | 'german' | 'numeric'
  showLyrics: boolean
  showChords: boolean
  columns: number
  fontSize: number
  transpose: number
}

export interface SetlistPrintConfig {
  set: WorshipSet
  includeChords: boolean
  includeLyrics: boolean
  includeNotes: boolean
  format: 'pdf' | 'txt'
}

// ============================================================
// This Area Of Code Is: Utility & Helper Types
// Explanation: Generic utility types used across the codebase
//              for type manipulation, strict typing, and developer experience.
// In Other Words: These are "helper" types that make TypeScript smarter —
//                  like making certain fields optional or extracting specific keys.

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type WithTimestamps<T> = T & {
  created_at: string
  updated_at: string
}

export type DatabaseTable =
  | 'ntcc_songs'
  | 'ntcc_users'
  | 'ntcc_teams'
  | 'ntcc_team_members'
  | 'ntcc_service_schedules'
  | 'ntcc_worship_sets'
  | 'ntcc_set_songs'
  | 'ntcc_practice_sessions'
  | 'ntcc_ccli_reports'
  | 'ntcc_resources'
  | 'ntcc_translations'
  | 'ntcc_notifications'
  | 'ntcc_app_settings'

export type AppRoute =
  | '/'
  | '/login'
  | '/signup'
  | '/dashboard'
  | '/songs'
  | '/songs/:id'
  | '/songs/add'
  | '/songs/edit/:id'
  | '/sets'
  | '/sets/:id'
  | '/teams'
  | '/teams/:id'
  | '/practice'
  | '/practice/:id'
  | '/services'
  | '/services/:id'
  | '/reports'
  | '/resources'
  | '/profile'
  | '/settings'
  | '/editor'
  | '/tuner'
  | '/metronome'

// ============================================================
// END OF FILE: src/types/index.ts
// Total Types Defined: 40+ interfaces, 15+ type aliases
// ============================================================
