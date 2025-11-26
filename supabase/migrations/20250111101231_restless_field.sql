-- Safely handle foreign key constraint
DO $$ 
BEGIN
  -- Drop existing foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'events_organizer_id_fkey'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT events_organizer_id_fkey;
  END IF;

  -- Add new foreign key constraint
  ALTER TABLE events
  ADD CONSTRAINT events_organizer_id_fkey 
  FOREIGN KEY (organizer_id) REFERENCES users(id);

EXCEPTION WHEN OTHERS THEN
  -- Log error and continue
  RAISE NOTICE 'Error updating foreign key: %', SQLERRM;
END $$;

-- Safely handle policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Organizers can manage their own events" ON events;
  DROP POLICY IF EXISTS "Public event viewing access" ON events;
  DROP POLICY IF EXISTS "Anyone can view events" ON events;

EXCEPTION WHEN OTHERS THEN
  -- Log error and continue
  RAISE NOTICE 'Error dropping policies: %', SQLERRM;
END $$;

-- Create new policies with error handling
DO $$ 
BEGIN
  -- Create management policy
  CREATE POLICY "Organizers can manage their own events"
    ON events
    FOR ALL
    TO authenticated
    USING (auth.uid() = organizer_id)
    WITH CHECK (auth.uid() = organizer_id);

  -- Create viewing policy
  CREATE POLICY "Anyone can view events"
    ON events
    FOR SELECT
    TO authenticated
    USING (true);

EXCEPTION WHEN OTHERS THEN
  -- Log error and continue
  RAISE NOTICE 'Error creating policies: %', SQLERRM;
END $$;