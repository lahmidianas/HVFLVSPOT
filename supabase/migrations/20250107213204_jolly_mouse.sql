/*
  # Update user signup policies

  1. Changes
    - Allow public access for user registration
    - Keep existing policies for authenticated users
    - Maintain data security
  
  2. Security
    - Enable RLS
    - Allow unauthenticated signup
    - Protect user data access
*/

-- Drop existing insert policies
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Service role can create user profiles" ON users;

-- Create new policies
CREATE POLICY "Allow public user registration"
  ON users
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Service role full access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Keep existing read policy
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());