/*
  # Rollback bronze_valley migration

  1. Changes Reverted
    - Drop policies created in bronze_valley
    - Reset events foreign key constraint
    - Clean up any orphaned constraints
  
  2. Security
    - Maintain RLS on events table
    - Restore original policies
*/

-- Safely drop policies created in bronze_valley
DROP POLICY IF EXISTS "Organizers can manage their own events" ON events;
DROP POLICY IF EXISTS "Anyone can view events" ON events;

-- Drop the foreign key constraint
ALTER TABLE events 
DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;

-- Restore original policies
CREATE POLICY "Public event viewing access"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event management access"
  ON events
  FOR ALL
  TO authenticated
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);