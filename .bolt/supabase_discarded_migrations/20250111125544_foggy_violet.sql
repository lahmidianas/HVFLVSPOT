/*
  # Rollback sweet_thunder migration

  1. Changes Reverted
    - Drop policies created in sweet_thunder
    - Restore original foreign key constraint
    - Restore original policies
  
  2. Security
    - Maintain RLS on events table
    - Restore original access patterns
*/

-- Drop policies created in sweet_thunder
DROP POLICY IF EXISTS "Organizers can manage their own events" ON events;
DROP POLICY IF EXISTS "Public event viewing access" ON events;

-- Restore original foreign key constraint
ALTER TABLE events 
DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;

ALTER TABLE events
ADD CONSTRAINT events_organizer_id_fkey 
FOREIGN KEY (organizer_id) REFERENCES organizers(id);

-- Restore original policies
CREATE POLICY "Event management access"
  ON events
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = organizer_id::text)
  WITH CHECK (auth.uid()::text = organizer_id::text);

CREATE POLICY "Public event viewing access"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);