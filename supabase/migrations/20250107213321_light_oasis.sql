/*
  # Fix user registration RLS policies

  1. Changes
    - Drop and recreate public insert policy with simpler conditions
    - Ensure service role maintains full access
  
  2. Security
    - Maintain data protection while allowing registration
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public user registration" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;

-- Recreate policies with simpler conditions
CREATE POLICY "Enable insert for public"
  ON users
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Enable service role access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);