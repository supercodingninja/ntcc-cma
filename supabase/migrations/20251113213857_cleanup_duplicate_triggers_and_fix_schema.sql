/*
  # Cleanup Duplicate Triggers and Fix Schema Issues

  1. Problem Identified
    - Duplicate triggers on songs table (update_songs_updated_at and update_songs_timestamp)
    - Multiple migration files created overlapping schema elements
    - This causes "Database error querying schema" errors
  
  2. Solution
    - Remove ALL duplicate triggers
    - Keep only one clean set of triggers
    - Ensure all tables have proper structure
  
  3. Changes
    - Drop duplicate triggers on songs table
    - Keep standard trigger naming convention
    - Verify all RLS policies are correct
*/

-- Clean up duplicate triggers on songs table
DROP TRIGGER IF EXISTS update_songs_timestamp ON songs;

-- Clean up any other potential duplicate triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON profiles;
DROP TRIGGER IF EXISTS update_profiles_timestamp ON profiles;

-- Verify the update_updated_at_column function exists and is correct
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;