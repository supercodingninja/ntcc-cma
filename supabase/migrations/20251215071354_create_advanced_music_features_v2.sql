/*
  # Advanced Music Practice Features Schema

  1. New Tables
    - `sheet_music` - Stores uploaded sheet music files with metadata
    - `music_annotations` - User annotations on sheet music
    - `advanced_practice_sessions` - Enhanced practice session tracking
    - `practice_recordings` - Audio recordings during practice
    - `practice_goals` - User practice goals
    - `collaborative_rooms` - Real-time practice rooms
    - `room_participants` - Participants in collaborative rooms
    - `ai_practice_feedback` - AI-generated practice feedback
    - `practice_preferences` - User practice preferences

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

-- Sheet Music Table
CREATE TABLE IF NOT EXISTS sheet_music (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  composer text DEFAULT 'Unknown',
  file_url text,
  file_type text NOT NULL,
  key_signature text,
  time_signature text DEFAULT '4/4',
  tempo integer DEFAULT 120,
  instruments jsonb DEFAULT '[]',
  extracted_data jsonb DEFAULT '{}',
  duration_seconds integer,
  difficulty_level text,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sheet_music ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sheet_music_select_policy"
  ON sheet_music FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "sheet_music_insert_policy"
  ON sheet_music FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sheet_music_update_policy"
  ON sheet_music FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sheet_music_delete_policy"
  ON sheet_music FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Music Annotations Table
CREATE TABLE IF NOT EXISTS music_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_music_id uuid REFERENCES sheet_music(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  measure_number integer NOT NULL,
  beat_position decimal DEFAULT 1,
  annotation_type text NOT NULL,
  content text NOT NULL,
  color text DEFAULT '#FFEB3B',
  position_x decimal,
  position_y decimal,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE music_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "annotations_select_policy"
  ON music_annotations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "annotations_insert_policy"
  ON music_annotations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "annotations_update_policy"
  ON music_annotations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "annotations_delete_policy"
  ON music_annotations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Advanced Practice Sessions Table
CREATE TABLE IF NOT EXISTS advanced_practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sheet_music_id uuid REFERENCES sheet_music(id) ON DELETE SET NULL,
  song_id uuid REFERENCES songs(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer DEFAULT 0,
  tempo_practiced integer,
  sections_practiced jsonb DEFAULT '[]',
  notes text,
  mood text,
  energy_level integer,
  focus_score integer,
  tools_used text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE advanced_practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "adv_sessions_select_policy"
  ON advanced_practice_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "adv_sessions_insert_policy"
  ON advanced_practice_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "adv_sessions_update_policy"
  ON advanced_practice_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "adv_sessions_delete_policy"
  ON advanced_practice_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Practice Recordings Table
CREATE TABLE IF NOT EXISTS practice_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES advanced_practice_sessions(id) ON DELETE CASCADE,
  sheet_music_id uuid REFERENCES sheet_music(id) ON DELETE SET NULL,
  recording_url text,
  file_size integer,
  duration_seconds integer,
  start_measure integer,
  end_measure integer,
  tempo integer,
  pitch_accuracy decimal,
  rhythm_accuracy decimal,
  overall_score decimal,
  waveform_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE practice_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recordings_select_policy"
  ON practice_recordings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "recordings_insert_policy"
  ON practice_recordings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recordings_update_policy"
  ON practice_recordings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recordings_delete_policy"
  ON practice_recordings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Practice Goals Table
CREATE TABLE IF NOT EXISTS practice_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sheet_music_id uuid REFERENCES sheet_music(id) ON DELETE SET NULL,
  song_id uuid REFERENCES songs(id) ON DELETE SET NULL,
  goal_type text NOT NULL,
  title text NOT NULL,
  description text,
  target_value integer NOT NULL,
  current_value integer DEFAULT 0,
  start_date date DEFAULT CURRENT_DATE,
  deadline date,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  streak_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE practice_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_select_policy"
  ON practice_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "goals_insert_policy"
  ON practice_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_update_policy"
  ON practice_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_delete_policy"
  ON practice_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Collaborative Rooms Table
CREATE TABLE IF NOT EXISTS collaborative_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  sheet_music_id uuid REFERENCES sheet_music(id) ON DELETE SET NULL,
  song_id uuid REFERENCES songs(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  is_private boolean DEFAULT false,
  password_hash text,
  max_participants integer DEFAULT 10,
  current_tempo integer DEFAULT 120,
  current_measure integer DEFAULT 1,
  is_playing boolean DEFAULT false,
  settings jsonb DEFAULT '{"metronome": true, "sync_playback": true, "allow_chat": true}',
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now()
);

ALTER TABLE collaborative_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_select_policy"
  ON collaborative_rooms FOR SELECT
  TO authenticated
  USING (is_active = true AND (is_private = false OR host_id = auth.uid()));

CREATE POLICY "rooms_insert_policy"
  ON collaborative_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "rooms_update_policy"
  ON collaborative_rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "rooms_delete_policy"
  ON collaborative_rooms FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id);

-- Room Participants Table
CREATE TABLE IF NOT EXISTS room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES collaborative_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  instrument text,
  part_name text,
  is_muted boolean DEFAULT false,
  is_ready boolean DEFAULT false,
  volume_level integer DEFAULT 100,
  joined_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_select_policy"
  ON room_participants FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM collaborative_rooms
    WHERE collaborative_rooms.id = room_participants.room_id
    AND (collaborative_rooms.is_private = false OR collaborative_rooms.host_id = auth.uid() OR room_participants.user_id = auth.uid())
  ));

CREATE POLICY "participants_insert_policy"
  ON room_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "participants_update_policy"
  ON room_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "participants_delete_policy"
  ON room_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM collaborative_rooms
    WHERE collaborative_rooms.id = room_participants.room_id
    AND collaborative_rooms.host_id = auth.uid()
  ));

-- AI Practice Feedback Table
CREATE TABLE IF NOT EXISTS ai_practice_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recording_id uuid REFERENCES practice_recordings(id) ON DELETE CASCADE,
  session_id uuid REFERENCES advanced_practice_sessions(id) ON DELETE CASCADE,
  feedback_type text NOT NULL,
  score decimal,
  feedback_content jsonb NOT NULL,
  suggestions text[],
  areas_to_improve text[],
  strengths text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_practice_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_select_policy"
  ON ai_practice_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "feedback_insert_policy"
  ON ai_practice_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User Practice Preferences Table
CREATE TABLE IF NOT EXISTS practice_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_tempo integer DEFAULT 120,
  metronome_sound text DEFAULT 'click',
  metronome_volume integer DEFAULT 80,
  count_in_bars integer DEFAULT 1,
  auto_scroll boolean DEFAULT true,
  show_measure_numbers boolean DEFAULT true,
  highlight_current_measure boolean DEFAULT true,
  practice_reminder_time time,
  daily_goal_minutes integer DEFAULT 30,
  preferred_instrument text,
  tuning_reference_hz decimal DEFAULT 440,
  theme text DEFAULT 'auto',
  notation_size text DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE practice_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preferences_select_policy"
  ON practice_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "preferences_insert_policy"
  ON practice_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "preferences_update_policy"
  ON practice_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sheet_music_user ON sheet_music(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_sheet ON music_annotations(sheet_music_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user ON music_annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_adv_sessions_user ON advanced_practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_adv_sessions_date ON advanced_practice_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_recordings_user ON practice_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON practice_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON collaborative_rooms(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_participants_room ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON ai_practice_feedback(user_id);
