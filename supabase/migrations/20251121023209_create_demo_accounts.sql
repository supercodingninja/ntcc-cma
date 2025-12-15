/*
  # Create Demo Accounts for NTCC CMA

  Creates test accounts for all three roles:
  
  1. Admin Account
     - Email: admin@ntcc-cma.demo
     - Password: Admin@123
     - Role: admin
     - Can manage all users, songs, and system settings
  
  2. Editor Account
     - Email: editor@ntcc-cma.demo
     - Password: Editor@123
     - Role: editor
     - Can add/edit songs and usage records
  
  3. Viewer Account
     - Email: viewer@ntcc-cma.demo
     - Password: Viewer@123
     - Role: viewer
     - Can only view songs and reports
  
  Note: These accounts will be created with profiles automatically via trigger
*/

-- First, check if demo accounts already exist and delete them to allow recreation
DO $$
DECLARE
  admin_id uuid;
  editor_id uuid;
  viewer_id uuid;
BEGIN
  -- Get existing demo user IDs
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@ntcc-cma.demo';
  SELECT id INTO editor_id FROM auth.users WHERE email = 'editor@ntcc-cma.demo';
  SELECT id INTO viewer_id FROM auth.users WHERE email = 'viewer@ntcc-cma.demo';

  -- Delete profiles first (due to foreign key)
  IF admin_id IS NOT NULL THEN
    DELETE FROM public.profiles WHERE id = admin_id;
  END IF;
  IF editor_id IS NOT NULL THEN
    DELETE FROM public.profiles WHERE id = editor_id;
  END IF;
  IF viewer_id IS NOT NULL THEN
    DELETE FROM public.profiles WHERE id = viewer_id;
  END IF;

  -- Delete auth users
  IF admin_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = admin_id;
  END IF;
  IF editor_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = editor_id;
  END IF;
  IF viewer_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = viewer_id;
  END IF;
END $$;

-- Create demo users in auth.users table
-- Note: Passwords are hashed using crypt function with bcrypt
-- Password: Admin@123
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@ntcc-cma.demo',
  crypt('Admin@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User"}',
  'authenticated',
  'authenticated'
);

-- Password: Editor@123
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'editor@ntcc-cma.demo',
  crypt('Editor@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Editor User"}',
  'authenticated',
  'authenticated'
);

-- Password: Viewer@123
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'viewer@ntcc-cma.demo',
  crypt('Viewer@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Viewer User"}',
  'authenticated',
  'authenticated'
);

-- Update profiles with correct roles (trigger should create them, but we ensure they have correct roles)
DO $$
DECLARE
  admin_id uuid;
  editor_id uuid;
  viewer_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@ntcc-cma.demo';
  SELECT id INTO editor_id FROM auth.users WHERE email = 'editor@ntcc-cma.demo';
  SELECT id INTO viewer_id FROM auth.users WHERE email = 'viewer@ntcc-cma.demo';

  -- Ensure profiles exist with correct roles
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (admin_id, 'admin@ntcc-cma.demo', 'Admin User', 'admin', now(), now())
  ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Admin User';

  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (editor_id, 'editor@ntcc-cma.demo', 'Editor User', 'editor', now(), now())
  ON CONFLICT (id) DO UPDATE SET role = 'editor', full_name = 'Editor User';

  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (viewer_id, 'viewer@ntcc-cma.demo', 'Viewer User', 'viewer', now(), now())
  ON CONFLICT (id) DO UPDATE SET role = 'viewer', full_name = 'Viewer User';
END $$;
