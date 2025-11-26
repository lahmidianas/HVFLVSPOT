/*
  # Fix notification preferences RLS policy

  1. Security Updates
    - Add service role policy for notification preferences
    - Ensure admin operations can bypass RLS restrictions
    - Maintain user privacy while allowing system operations

  2. Changes
    - Add service role full access policy
    - Keep existing user management policy
*/

-- Add service role policy for notification preferences
CREATE POLICY "Service role full access to notification preferences"
  ON notification_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);