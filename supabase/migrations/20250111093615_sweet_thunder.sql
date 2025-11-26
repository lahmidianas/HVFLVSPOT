-- Drop existing foreign key constraint if it exists
ALTER TABLE events 
DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;

-- Update organizer_id to reference users table
ALTER TABLE events
ADD CONSTRAINT events_organizer_id_fkey 
FOREIGN KEY (organizer_id) REFERENCES users(id);

-- Drop existing policies
DROP POLICY IF EXISTS "Organizers can manage their own events" ON events;
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
DROP POLICY IF EXISTS "Anyone can view events" ON events;

-- Create new policies
CREATE POLICY "Organizers can manage their own events"
  ON events
  FOR ALL
  TO authenticated
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- Recreate view policy with a different name to avoid conflict
CREATE POLICY "Public event viewing access"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);