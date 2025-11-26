/*
  # Add password field to users table

  1. Changes
    - Add password column to users table
    - Create index for password lookups
*/

-- Add password column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';

-- Create index for password lookups
CREATE INDEX IF NOT EXISTS idx_users_password ON users(password);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());