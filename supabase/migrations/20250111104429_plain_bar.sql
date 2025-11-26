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
      role TEXT NOT NULL
    );
  END IF;
END $$;

-- Safely add user_id to organizers
DO $$ 
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'organizers' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE organizers 
    ADD COLUMN user_id UUID;
  END IF;

  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_organizers_user_id'
  ) THEN
    ALTER TABLE organizers
    ADD CONSTRAINT fk_organizers_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;
  END IF;

  -- Make user_id NOT NULL after adding the constraint
  ALTER TABLE organizers 
  ALTER COLUMN user_id SET NOT NULL;
END $$;

-- Create or update policies
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Organizers can view own data" ON organizers;
  DROP POLICY IF EXISTS "Organizers can manage own data" ON organizers;

  -- Create new policies
  CREATE POLICY "Organizers can view own data"
    ON organizers
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

  CREATE POLICY "Organizers can manage own data"
    ON organizers
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error managing policies: %', SQLERRM;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_organizers_user_id 
ON organizers(user_id);