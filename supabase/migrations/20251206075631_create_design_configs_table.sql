/*
  # Create Design Configurations Table

  1. New Tables
    - `design_configs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `config_name` (text) - Name for this design configuration
      - `is_active` (boolean) - Whether this is the currently active design
      - `color_theme` (text) - Selected color theme
      - `font_pairing` (text) - Selected font pairing
      - `spacing_scale` (text) - Selected spacing scale
      - `border_style` (text) - Selected border style
      - `card_style` (text) - Selected card style
      - `button_style` (text) - Selected button style
      - `animation` (text) - Selected animation preset
      - `dark_mode` (boolean) - Dark mode enabled
      - `custom_css` (text) - Optional custom CSS
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `design_configs` table
    - Only admins can create/update/delete design configs
    - All users can view the active design config
*/

CREATE TABLE IF NOT EXISTS design_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  config_name text NOT NULL DEFAULT 'Default Config',
  is_active boolean DEFAULT false,
  color_theme text DEFAULT 'default',
  font_pairing text DEFAULT 'modern',
  spacing_scale text DEFAULT 'default',
  border_style text DEFAULT 'default',
  card_style text DEFAULT 'elevated',
  button_style text DEFAULT 'gradient',
  animation text DEFAULT 'smooth',
  dark_mode boolean DEFAULT false,
  custom_css text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE design_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active design config"
  ON design_configs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all design configs"
  ON design_configs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create design configs"
  ON design_configs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update design configs"
  ON design_configs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete design configs"
  ON design_configs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_design_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_design_configs_timestamp'
  ) THEN
    CREATE TRIGGER update_design_configs_timestamp
      BEFORE UPDATE ON design_configs
      FOR EACH ROW
      EXECUTE FUNCTION update_design_config_timestamp();
  END IF;
END $$;

INSERT INTO design_configs (config_name, is_active, color_theme, font_pairing, spacing_scale, border_style, card_style, button_style, animation)
VALUES ('Default Design', true, 'default', 'modern', 'default', 'default', 'elevated', 'gradient', 'smooth')
ON CONFLICT DO NOTHING;
