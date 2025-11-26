-- First ensure users table exists
DO $$ 
BEGIN
  -- Create users table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'users'
  ) THEN
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'User'
    );
  END IF;
END $$;

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
  RAISE NOTICE 'Error updating foreign key: %', SQLERRM;
END $$;

-- Safely handle policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Organizers can manage their own events" ON events;
  DROP POLICY IF EXISTS "Public event viewing access" ON events;
  DROP POLICY IF EXISTS "Anyone can view events" ON events;

  -- Create management policy
  CREATE POLICY "Organizers can manage their own events"
    ON events
    FOR ALL
    TO authenticated
    USING (
      auth.uid() = organizer_id AND 
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'Organizer'
      )
    )
    WITH CHECK (
      auth.uid() = organizer_id AND 
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'Organizer'
      )
    );

  -- Create viewing policy
  CREATE POLICY "Anyone can view events"
    ON events
    FOR SELECT
    TO authenticated
    USING (true);

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error managing policies: %', SQLERRM;
END $$;