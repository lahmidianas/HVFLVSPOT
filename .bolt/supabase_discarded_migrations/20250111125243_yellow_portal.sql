/*
  # Rollback plain_bar migration

  1. Changes Reverted
    - Drop foreign key constraint on organizers.user_id
    - Drop user_id column from organizers table
    - Drop policies for organizers table
    - Drop index on user_id
  
  2. Security
    - Maintain RLS on organizers table
    - Restore original policies
*/

-- Drop foreign key constraint
ALTER TABLE organizers 
DROP CONSTRAINT IF EXISTS fk_organizers_user_id;

-- Drop user_id column
ALTER TABLE organizers 
DROP COLUMN IF EXISTS user_id;

-- Drop existing policies
DROP POLICY IF EXISTS "Organizers can view own data" ON organizers;
DROP POLICY IF EXISTS "Organizers can manage own data" ON organizers;

-- Drop index
DROP INDEX IF EXISTS idx_organizers_user_id;

-- Restore original policies
CREATE POLICY "Organizers can manage their own profile"
  ON organizers
  FOR ALL
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);

CREATE POLICY "Public organizer viewing access"
  ON organizers
  FOR SELECT
  TO authenticated
  USING (true);