/*
  # Create NTCC Music App Database Schema

  ## Overview
  Complete database schema for "The NTCC Music App" - A Church Music Management PWA
  
  ## 1. New Tables
  
  ### users_profiles
  - `id` (uuid, primary key) - References auth.users
  - `email` (text, unique, not null) - User email
  - `full_name` (text) - User's full name
  - `role` (text, not null) - User role: 'admin', 'editor', or 'viewer'
  - `viewing_as_role` (text) - Temporary role for viewing (admin/editor switching)
  - `phone` (text) - Phone number for notifications
  - `created_at` (timestamptz) - Account creation date
  - `updated_at` (timestamptz) - Last update timestamp
  - `last_login` (timestamptz) - Last login timestamp
  
  ### songs
  - `id` (uuid, primary key) - Unique song identifier
  - `title` (text, not null) - Song title
  - `artist` (text) - Artist/composer name
  - `lead_singer` (text) - Lead singer if applicable
  - `key` (text) - Musical key (e.g., "C", "G major")
  - `tempo` (integer) - Tempo in BPM
  - `duration` (integer) - Duration in seconds
  - `has_key_changes` (boolean, default false) - Indicates key changes
  - `key_changes` (jsonb) - Key change details
  - `theme` (text[]) - Array of themes/tags
  - `copyright_info` (text) - Full copyright information
  - `lyrics` (text) - Song lyrics
  - `chords` (text) - Chord progressions
  - `youtube_links` (text[]) - Array of YouTube URLs
  - `audio_files` (text[]) - Array of audio file URLs
  - `sheet_music_file` (text) - File path to .sib or .pdf
  - `sheet_music_type` (text) - 'sib' or 'pdf'
  - `created_by` (uuid) - User who created the entry
  - `updated_by` (uuid) - User who last updated
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### song_performances
  - `id` (uuid, primary key) - Unique performance identifier
  - `song_id` (uuid, not null) - References songs table
  - `service_type` (text, not null) - Type of service
  - `service_date` (date, not null) - Date of performance
  - `service_time` (text) - 'morning' or 'evening'
  - `conference_type` (text) - Type of conference if applicable
  - `notes` (text) - Performance notes
  - `recorded_by` (uuid) - User who recorded this performance
  - `created_at` (timestamptz) - Timestamp when recorded
  
  ### practice_sessions
  - `id` (uuid, primary key) - Unique practice session identifier
  - `song_id` (uuid, not null) - References songs table
  - `practice_date` (timestamptz, not null) - Date and time of practice
  - `duration` (integer) - Practice duration in minutes
  - `notes` (text) - Practice notes
  - `recorded_by` (uuid) - User who recorded this session
  - `created_at` (timestamptz) - Timestamp when recorded
  
  ### edit_history
  - `id` (uuid, primary key) - Unique edit identifier
  - `song_id` (uuid, not null) - References songs table
  - `edited_by` (uuid, not null) - User who made the edit
  - `edit_type` (text, not null) - Type of edit (e.g., 'sheet_music', 'metadata')
  - `changes` (jsonb) - JSON object describing changes made
  - `original_values` (jsonb) - Original values before edit
  - `created_at` (timestamptz) - Timestamp of edit
  
  ### admin_tasks
  - `id` (uuid, primary key) - Unique task identifier
  - `created_by` (uuid, not null) - Admin who created the task
  - `assigned_to` (uuid, not null) - User assigned to task
  - `task_type` (text, not null) - Type of task
  - `description` (text, not null) - Task description
  - `estimated_completion` (timestamptz) - Estimated completion time
  - `status` (text, default 'pending') - 'pending', 'in_progress', 'completed', 'unreachable'
  - `approval_status` (text) - 'pending', 'approved', 'rejected'
  - `approved_by` (uuid[]) - Array of admin user IDs who approved
  - `created_at` (timestamptz) - Task creation timestamp
  - `completed_at` (timestamptz) - Task completion timestamp
  
  ### style_changes
  - `id` (uuid, primary key) - Unique style change identifier
  - `created_by` (uuid, not null) - User who created the change
  - `changes` (jsonb, not null) - JSON object of style changes
  - `status` (text, default 'draft') - 'draft', 'pending_approval', 'approved', 'applied'
  - `approved_by` (uuid[]) - Array of admin user IDs who approved
  - `created_at` (timestamptz) - Creation timestamp
  - `applied_at` (timestamptz) - When changes were applied
  
  ### background_images
  - `id` (uuid, primary key) - Unique image identifier
  - `file_path` (text, not null) - Path to image file
  - `role` (text) - Role this image is for (or null for all)
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz) - Upload timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Admins can do everything
  - Editors can edit songs and view most data
  - Viewers can only view allowed content
  - Users can always view their own profile

  ## 3. Indexes
  - Performance indexes on frequently queried columns
  - Composite indexes for common query patterns

  ## 4. Functions
  - Auto-update timestamp triggers
  - Role checking helper functions
*/

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS background_images CASCADE;
DROP TABLE IF EXISTS style_changes CASCADE;
DROP TABLE IF EXISTS admin_tasks CASCADE;
DROP TABLE IF EXISTS edit_history CASCADE;
DROP TABLE IF EXISTS practice_sessions CASCADE;
DROP TABLE IF EXISTS song_performances CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS users_profiles CASCADE;

-- Create users_profiles table
CREATE TABLE IF NOT EXISTS users_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  viewing_as_role text CHECK (viewing_as_role IN ('admin', 'editor', 'viewer') OR viewing_as_role IS NULL),
  phone text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_login timestamptz
);

-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text,
  lead_singer text,
  key text,
  tempo integer,
  duration integer,
  has_key_changes boolean DEFAULT false,
  key_changes jsonb,
  theme text[] DEFAULT '{}',
  copyright_info text,
  lyrics text,
  chords text,
  youtube_links text[] DEFAULT '{}',
  audio_files text[] DEFAULT '{}',
  sheet_music_file text,
  sheet_music_type text CHECK (sheet_music_type IN ('sib', 'pdf') OR sheet_music_type IS NULL),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create song_performances table
CREATE TABLE IF NOT EXISTS song_performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  service_date date NOT NULL,
  service_time text CHECK (service_time IN ('morning', 'evening') OR service_time IS NULL),
  conference_type text,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  practice_date timestamptz NOT NULL,
  duration integer,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create edit_history table
CREATE TABLE IF NOT EXISTS edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  edited_by uuid NOT NULL REFERENCES auth.users(id),
  edit_type text NOT NULL,
  changes jsonb,
  original_values jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create admin_tasks table
CREATE TABLE IF NOT EXISTS admin_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  assigned_to uuid NOT NULL REFERENCES auth.users(id),
  task_type text NOT NULL,
  description text NOT NULL,
  estimated_completion timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'unreachable')),
  approval_status text CHECK (approval_status IN ('pending', 'approved', 'rejected') OR approval_status IS NULL),
  approved_by uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Create style_changes table
CREATE TABLE IF NOT EXISTS style_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  changes jsonb NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'applied')),
  approved_by uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  applied_at timestamptz
);

-- Create background_images table
CREATE TABLE IF NOT EXISTS background_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  role text CHECK (role IN ('admin', 'editor', 'viewer') OR role IS NULL),
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_theme ON songs USING gin(theme);
CREATE INDEX IF NOT EXISTS idx_song_performances_date ON song_performances(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_song_performances_song_id ON song_performances(song_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_date ON practice_sessions(practice_date DESC);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_song_id ON practice_sessions(song_id);
CREATE INDEX IF NOT EXISTS idx_edit_history_song_id ON edit_history(song_id);
CREATE INDEX IF NOT EXISTS idx_edit_history_date ON edit_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_profiles_role ON users_profiles(role);
CREATE INDEX IF NOT EXISTS idx_users_profiles_email ON users_profiles(email);

-- Enable Row Level Security
ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_images ENABLE ROW LEVEL SECURITY;

-- Create helper function to check user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text AS $$
  SELECT role FROM users_profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies for users_profiles
CREATE POLICY "Users can view own profile"
  ON users_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON users_profiles FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update own profile"
  ON users_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON users_profiles FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert profiles"
  ON users_profiles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'admin' OR auth.uid() = id);

CREATE POLICY "Admins can delete profiles"
  ON users_profiles FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for songs
CREATE POLICY "All authenticated users can view songs"
  ON songs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert songs"
  ON songs FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can update songs"
  ON songs FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins can delete songs"
  ON songs FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for song_performances
CREATE POLICY "All authenticated users can view performances"
  ON song_performances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert performances"
  ON song_performances FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can update performances"
  ON song_performances FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins can delete performances"
  ON song_performances FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for practice_sessions
CREATE POLICY "All authenticated users can view practices"
  ON practice_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert practices"
  ON practice_sessions FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can update practices"
  ON practice_sessions FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'editor'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins can delete practices"
  ON practice_sessions FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for edit_history
CREATE POLICY "All authenticated users can view edit history"
  ON edit_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert edit history"
  ON edit_history FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

-- RLS Policies for admin_tasks
CREATE POLICY "Admins can view all tasks"
  ON admin_tasks FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Editors can view their assigned tasks"
  ON admin_tasks FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Admins can insert tasks"
  ON admin_tasks FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update tasks"
  ON admin_tasks FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Assigned users can update their task status"
  ON admin_tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- RLS Policies for style_changes
CREATE POLICY "Admins can view all style changes"
  ON style_changes FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Editors can view their style changes"
  ON style_changes FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins and editors can insert style changes"
  ON style_changes FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins can update style changes"
  ON style_changes FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for background_images
CREATE POLICY "All authenticated users can view background images"
  ON background_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage background images"
  ON background_images FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_profiles_updated_at
  BEFORE UPDATE ON users_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert background images
INSERT INTO background_images (file_path, role, order_index) VALUES
  ('/src/assets/IMG_0733.jpeg', NULL, 1),
  ('/src/assets/IMG_0734.jpeg', NULL, 2),
  ('/src/assets/IMG_0735.jpeg', NULL, 3),
  ('/src/assets/IMG_0742.png', NULL, 4),
  ('/src/assets/IMG_1344.jpeg', NULL, 5),
  ('/src/assets/IMG_1346.jpeg', NULL, 6),
  ('/src/assets/IMG_1348.jpeg', NULL, 7),
  ('/src/assets/IMG_5384.jpeg', NULL, 8),
  ('/src/assets/IMG_5676.jpeg', NULL, 9),
  ('/src/assets/IMG_6147.jpeg', NULL, 10),
  ('/src/assets/IMG_6248.jpeg', NULL, 11),
  ('/src/assets/IMG_7081.jpeg', NULL, 12),
  ('/src/assets/IMG_7083.jpeg', NULL, 13),
  ('/src/assets/IMG_7084.jpeg', NULL, 14),
  ('/src/assets/IMG_7085.jpeg', NULL, 15),
  ('/src/assets/IMG_7086.jpeg', NULL, 16),
  ('/src/assets/IMG_7087.jpeg', NULL, 17),
  ('/src/assets/IMG_7088.jpeg', NULL, 18),
  ('/src/assets/IMG_7089.jpeg', NULL, 19),
  ('/src/assets/IMG_7090.jpeg', NULL, 20),
  ('/src/assets/IMG_7091.jpeg', NULL, 21),
  ('/src/assets/IMG_7092.jpeg', NULL, 22),
  ('/src/assets/IMG_7093.jpeg', NULL, 23),
  ('/src/assets/IMG_7094.jpeg', NULL, 24),
  ('/src/assets/IMG_7095.jpeg', NULL, 25),
  ('/src/assets/IMG_7096.jpeg', NULL, 26),
  ('/src/assets/IMG_7097.jpeg', NULL, 27),
  ('/src/assets/IMG_7098.jpeg', NULL, 28),
  ('/src/assets/IMG_7099.jpeg', NULL, 29),
  ('/src/assets/IMG_7100.jpeg', NULL, 30),
  ('/src/assets/IMG_7101.jpeg', NULL, 31),
  ('/src/assets/IMG_7102.jpeg', NULL, 32),
  ('/src/assets/IMG_7103.jpeg', NULL, 33),
  ('/src/assets/IMG_7104.jpeg', NULL, 34),
  ('/src/assets/IMG_7105.jpeg', NULL, 35),
  ('/src/assets/IMG_7107.jpeg', NULL, 36),
  ('/src/assets/IMG_7108.jpeg', NULL, 37),
  ('/src/assets/IMG_7108 copy.jpeg', NULL, 38),
  ('/src/assets/IMG_7109.jpeg', NULL, 39),
  ('/src/assets/IMG_7110.jpeg', NULL, 40),
  ('/src/assets/IMG_7111.jpeg', NULL, 41),
  ('/src/assets/IMG_7112.jpeg', NULL, 42),
  ('/src/assets/IMG_7113.jpeg', NULL, 43),
  ('/src/assets/IMG_7114.jpeg', NULL, 44),
  ('/src/assets/IMG_7116.jpeg', NULL, 45),
  ('/src/assets/IMG_7117.jpeg', NULL, 46),
  ('/src/assets/IMG_7118.jpeg', NULL, 47),
  ('/src/assets/IMG_7119.jpeg', NULL, 48),
  ('/src/assets/IMG_7120.jpeg', NULL, 49)
ON CONFLICT DO NOTHING;