/*
  # Create Organizers Table

  1. New Tables
    - `organizers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `business_name` (text)
      - `description` (text)
      - `website` (text)
      - `phone` (text)
      - `address` (text)
      - `verified` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on organizers table
    - Add policies for organizer data access
    - Add policy for public verified organizer viewing
*/

-- Create organizers table
CREATE TABLE IF NOT EXISTS organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  phone TEXT,
  address TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_id UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_organizers_user_id ON organizers(user_id);
CREATE INDEX idx_organizers_verified ON organizers(verified);

-- Create policies
CREATE POLICY "Organizers can manage their own profile"
  ON organizers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can view verified organizers"
  ON organizers
  FOR SELECT
  TO authenticated
  USING (verified = true);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_organizer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_organizer_timestamp
  BEFORE UPDATE ON organizers
  FOR EACH ROW
  EXECUTE FUNCTION update_organizer_updated_at();