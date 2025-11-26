/*
  # Fix Transactions Table RLS Policy

  1. Changes
    - Add INSERT policy for authenticated users on transactions table
    - Allow users to create their own transaction records
    - Maintain existing security model

  2. Security
    - Users can only insert transactions where they are the user_id
    - Existing SELECT and service role policies remain unchanged
*/

-- Add INSERT policy for authenticated users
CREATE POLICY "Users can create their own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);