/*
  # Fix Authentication and Profile Creation

  1. Security Changes
    - Add INSERT policy for profiles to allow user signup
    - Create trigger to automatically create profile when user signs up
    - Fix profile creation flow
  
  2. Important Notes
    - Users can now self-register and create their profile
    - Profile is automatically created via database trigger
    - Default role is 'viewer' for new users
*/

-- Drop existing policy if it exists
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Allow users to insert their own profile during signup
CREATE POLICY "Allow users to insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Create a trigger function to automatically create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'viewer'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();