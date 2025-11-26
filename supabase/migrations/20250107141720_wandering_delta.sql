/*
  # Add user creation policy

  1. Changes
    - Add RLS policy to allow authenticated users to create their own profile
    - Add RLS policy to allow service role to create user profiles
*/

-- Policy to allow users to create their own profile
CREATE POLICY "Users can create their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy to allow service role to create user profiles
CREATE POLICY "Service role can create user profiles"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);