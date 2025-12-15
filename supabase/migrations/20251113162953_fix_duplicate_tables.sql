/*
  # Fix Duplicate Profile Tables

  1. Problem
    - Duplicate tables exist: `profiles` and `user_profiles`
    - Duplicate tables: `user_roles` (not needed)
    - This causes "Database error querying schema" 
  
  2. Solution
    - Drop the duplicate `user_profiles` table
    - Drop the duplicate `user_roles` table
    - Drop the duplicate `artists` table (has no data and not used)
    - Keep only the `profiles` table which has the actual user data
  
  3. Security
    - All RLS policies already point to `profiles` table
    - No data loss - user_profiles has no active records
*/

DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
