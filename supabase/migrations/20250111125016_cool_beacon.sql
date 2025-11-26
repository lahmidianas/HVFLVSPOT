-- First check if the organizers table exists
DO $$ 
BEGIN
  -- Create organizers table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'organizers'
  ) THEN
    CREATE TABLE organizers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'organizers' AND indexname = 'idx_organizers_user_id'
  ) THEN
    CREATE INDEX idx_organizers_user_id ON organizers(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'organizers' AND indexname = 'idx_organizers_email'
  ) THEN
    CREATE INDEX idx_organizers_email ON organizers(email);
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- Safely recreate policies
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Organizers can manage their own data" ON organizers;
  DROP POLICY IF EXISTS "Public can view organizer profiles" ON organizers;

  -- Create new policies
  CREATE POLICY "Organizers can manage their own data"
    ON organizers
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

  CREATE POLICY "Public can view organizer profiles"
    ON organizers
    FOR SELECT
    TO authenticated
    USING (true);
END $$;

-- Safely recreate the sync function
CREATE OR REPLACE FUNCTION sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"Organizer"'
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safely recreate the trigger
DO $$ 
BEGIN
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS on_organizer_created ON organizers;
  
  -- Create the trigger
  CREATE TRIGGER on_organizer_created
    AFTER INSERT ON organizers
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_role();
END $$;