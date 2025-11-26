/*
  # Fix System Accounts RLS Policy Infinite Recursion

  1. Problem
    - Current policy creates infinite recursion by querying system_accounts table within its own policy
    - Policy tries to validate access by checking if uid() exists in system_accounts
    - This creates circular reference: Policy → Query → Policy → Query...

  2. Solution
    - Remove the recursive policy that queries system_accounts within itself
    - Add a simpler policy that allows service role full access
    - Add a policy for authenticated users with SuperAdmin role
    - Keep public read access for basic operations

  3. Security
    - Service role maintains full access for system operations
    - SuperAdmin users can manage system accounts
    - Public access limited to read-only for basic functionality
    - Removes circular dependency while maintaining security
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "System accounts can read own data" ON system_accounts;

-- Create a simple policy for service role access (bypasses RLS anyway but explicit)
CREATE POLICY "Service role full access to system accounts"
  ON system_accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a policy for SuperAdmin users to manage system accounts
CREATE POLICY "SuperAdmin can manage system accounts"
  ON system_accounts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'SuperAdmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'SuperAdmin'
    )
  );

-- Keep public read access for basic system operations
CREATE POLICY "Public read access to system accounts"
  ON system_accounts
  FOR SELECT
  TO public
  USING (true);