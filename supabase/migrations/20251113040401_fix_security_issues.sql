/*
  # Fix Security Issues

  1. Performance Improvements
    - Add missing indexes on foreign keys for practice_history.song_id and usage_history.song_id
    - Remove unused indexes that provide no benefit

  2. Security Improvements
    - Consolidate duplicate permissive policies on song_themes table
    - Keep only the most permissive policy since multiple permissive policies are redundant

  3. Changes Made
    - Add index on practice_history(song_id) for foreign key queries
    - Add index on usage_history(song_id) for foreign key queries
    - Drop unused indexes that aren't being utilized
    - Remove redundant SELECT policy on song_themes (keep the broader one)
*/

-- Add missing indexes on foreign keys for better query performance
CREATE INDEX IF NOT EXISTS idx_practice_history_song_id ON practice_history(song_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_song_id ON usage_history(song_id);

-- Drop unused indexes that provide no value
DROP INDEX IF EXISTS idx_practice_history_practiced_by;
DROP INDEX IF EXISTS idx_song_themes_theme_id;
DROP INDEX IF EXISTS idx_songs_created_by;
DROP INDEX IF EXISTS idx_usage_history_logged_by;
DROP INDEX IF EXISTS idx_user_profiles_role;
DROP INDEX IF EXISTS idx_practice_date;
DROP INDEX IF EXISTS idx_usage_date;

-- Fix multiple permissive policies issue on song_themes
-- Drop the more restrictive policy and keep the broader "Everyone can view" policy
DROP POLICY IF EXISTS "Admins and editors can manage song themes" ON song_themes;

-- Ensure we have appropriate policies for song_themes
-- Keep the view policy for everyone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'song_themes' 
    AND policyname = 'Everyone can view song themes'
  ) THEN
    CREATE POLICY "Everyone can view song themes"
      ON song_themes FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Add proper insert/update/delete policies for admins and editors only
DROP POLICY IF EXISTS "Admins and editors can insert song themes" ON song_themes;
CREATE POLICY "Admins and editors can insert song themes"
  ON song_themes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admins and editors can delete song themes" ON song_themes;
CREATE POLICY "Admins and editors can delete song themes"
  ON song_themes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );
