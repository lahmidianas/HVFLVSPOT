/*
  # Add Organizers Table and Event Management Schema Updates

  1. New Tables
    - `organizers`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, unique, not null)
      - `phone` (text)
      - `created_at` (timestamptz)

  2. Changes
    - Add `organizer_id` to events table
    - Create foreign key relationship
    - Add indexes for performance

  3. Security
    - Enable RLS on organizers table
    - Add policies for organizer access
*/

-- Create organizers table
CREATE TABLE IF NOT EXISTS organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add organizer_id to events table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'organizer_id'
  ) THEN
    ALTER TABLE events 
    ADD COLUMN organizer_id UUID REFERENCES organizers(id);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizers_id ON organizers(id);
CREATE INDEX IF NOT EXISTS idx_organizers_email ON organizers(email);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);

-- Enable Row Level Security
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- Create policies for organizers table
CREATE POLICY "Organizers can view their own data"
  ON organizers
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Organizers can update their own data"
  ON organizers
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Create policy for events to reference organizers
CREATE POLICY "Events can reference organizers"
  ON organizers
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to sync user role with organizer
CREATE OR REPLACE FUNCTION sync_user_organizer() 
RETURNS trigger AS $$
BEGIN
  -- When a new organizer is created, update user role
  IF TG_OP = 'INSERT' THEN
    UPDATE auth.users
    SET raw_user_meta_data = 
      jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        '"Organizer"'
      )
    WHERE id::text = NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for organizer sync
DROP TRIGGER IF EXISTS on_organizer_created ON organizers;
CREATE TRIGGER on_organizer_created
  AFTER INSERT ON organizers
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_organizer();