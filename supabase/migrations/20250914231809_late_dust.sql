/*
  # Fix Event-Organizer Relationship

  1. Schema Updates
    - Add proper foreign key constraint from events.organizer_id to organizers.user_id
    - Update RLS policies to work with the relationship
    - Add indexes for performance

  2. Security
    - Ensure RLS policies work correctly with the new relationship
    - Maintain data integrity with proper constraints
*/

-- First, ensure the foreign key constraint exists and is correct
-- The events.organizer_id should reference the user_id, not the organizer's id
-- because organizer_id in events table stores the user_id of the organizer

-- Drop existing constraint if it exists (in case it was incorrectly set up)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'events_organizer_id_fkey' 
    AND table_name = 'events'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT events_organizer_id_fkey;
  END IF;
END $$;

-- Add the correct foreign key constraint
-- events.organizer_id references users.id (since organizer_id stores the user's ID)
ALTER TABLE events 
ADD CONSTRAINT events_organizer_id_fkey 
FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add index for better performance on organizer queries
CREATE INDEX IF NOT EXISTS idx_events_organizer_id_performance 
ON events(organizer_id);

-- Update RLS policy to ensure organizers can manage their events
DROP POLICY IF EXISTS "Event management access" ON events;
CREATE POLICY "Event management access"
  ON events
  FOR ALL
  TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- Ensure organizers can create events
DROP POLICY IF EXISTS "Organizers can create events" ON events;
CREATE POLICY "Organizers can create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM organizers 
      WHERE user_id = auth.uid() AND verified = true
    )
  );