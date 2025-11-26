/*
  # Add user metadata column

  1. Changes
    - Add JSONB metadata column to users table for storing preferences
    - Create GIN index for efficient metadata querying
    - Add RLS policy for metadata access

  2. Security
    - Enable RLS for metadata access
    - Users can only read their own metadata
*/

-- Add metadata column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE users ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create GIN index for metadata if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_metadata 
ON users USING GIN (metadata);

-- Create policy for metadata access
CREATE POLICY "Users can read own metadata"
  ON users
  FOR SELECT
  USING (auth.uid() = id);