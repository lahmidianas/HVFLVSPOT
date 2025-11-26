/*
  # Add search functionality to events table

  1. Changes
    - Add search_vector column to events table
    - Create function and trigger for automatic search vector updates
    - Update existing records with search vectors
    - Add GIN index for efficient searching

  2. Security
    - Maintain existing RLS policies
    - No changes to security model required
*/

-- Add search vector column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE events ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create GIN index for search vector if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_events_search_vector 
ON events USING GIN (search_vector);

-- Create or replace the function to update search vector
CREATE OR REPLACE FUNCTION events_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'events_search_vector_update'
  ) THEN
    CREATE TRIGGER events_search_vector_update
      BEFORE INSERT OR UPDATE ON events
      FOR EACH ROW
      EXECUTE FUNCTION events_search_vector_update();
  END IF;
END $$;

-- Update existing records
UPDATE events
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(location, '')), 'C')
WHERE search_vector IS NULL;