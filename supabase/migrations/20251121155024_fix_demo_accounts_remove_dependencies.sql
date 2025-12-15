/*
  # Fix Demo Accounts - Remove Dependencies and Broken Auth Entries

  The previous migration created auth.users entries that are causing "Database error querying schema" 
  because directly inserting into auth.users bypasses Supabase's auth system validation.

  This migration:
  1. Removes all data created by broken demo accounts
  2. Removes the broken demo accounts from auth.users and profiles
  3. Documents that demo accounts must be created via Supabase Auth Admin API or signup flow

  Note: After this migration, create demo accounts by signing up through the app with:
  - admin@ntcc-cma.demo / Admin@123
  - editor@ntcc-cma.demo / Editor@123
  - viewer@ntcc-cma.demo / Viewer@123
*/

-- Get the IDs of the broken demo accounts
DO $$
DECLARE
  admin_id uuid;
  editor_id uuid;
  viewer_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@ntcc-cma.demo';
  SELECT id INTO editor_id FROM auth.users WHERE email = 'editor@ntcc-cma.demo';
  SELECT id INTO viewer_id FROM auth.users WHERE email = 'viewer@ntcc-cma.demo';

  -- Delete all data referencing these users
  DELETE FROM public.usage_history WHERE recorded_by IN (admin_id, editor_id, viewer_id);
  DELETE FROM public.practice_history WHERE practiced_by IN (admin_id, editor_id, viewer_id);
  DELETE FROM public.songs WHERE created_by IN (admin_id, editor_id, viewer_id) OR updated_by IN (admin_id, editor_id, viewer_id);
  DELETE FROM public.profiles WHERE id IN (admin_id, editor_id, viewer_id);
  
  -- Delete the broken auth users
  DELETE FROM auth.users WHERE id IN (admin_id, editor_id, viewer_id);
END $$;
