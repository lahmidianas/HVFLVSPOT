/*
  # Fix Event Search Implementation

  1. Changes
    - Enable pg_trgm extension
    - Add search vector column
    - Create search vector update function and trigger
    - Add proper indexes for full-text search
    - Update existing records

  2. Details
    - Adds proper full-text search capabilities
    - Enables trigram matching for better text similarity search
    - Maintains search vector automatically via trigger
    - Indexes for optimal search performance
*/

-- Enable required extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

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

-- Create function to update search vector
CREATE OR REPLACE FUNCTION events_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector updates
DROP TRIGGER IF EXISTS events_search_vector_update ON events;
CREATE TRIGGER events_search_vector_update
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION events_search_vector_update();

-- Create indexes for search
CREATE INDEX IF NOT EXISTS idx_events_search_vector 
ON events USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_events_title_trigram 
ON events USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_events_location_trigram 
ON events USING GIN (location gin_trgm_ops);

-- Update existing records
UPDATE events
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(location, '')), 'C')
WHERE search_vector IS NULL;