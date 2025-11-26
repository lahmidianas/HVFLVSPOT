/*
  # Add Event Search Indexes and Metadata

  1. New Indexes
    - Add GiST index for location text search
    - Add B-tree indexes for common search fields
    - Add GIN index for JSONB metadata

  2. New Columns
    - Add metadata JSONB column for extensible attributes
    - Add search_vector column for full text search

  3. Changes
    - Add triggers to maintain search vector
    - Add function to update search vector
*/

-- Add metadata column for extensible attributes
ALTER TABLE events
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add search vector column
ALTER TABLE events
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create indexes for common search patterns
CREATE INDEX IF NOT EXISTS idx_events_title ON events (title);
CREATE INDEX IF NOT EXISTS idx_events_location ON events (location);
CREATE INDEX IF NOT EXISTS idx_events_category_id ON events (category_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events (start_date);
CREATE INDEX IF NOT EXISTS idx_events_price ON events (price);
CREATE INDEX IF NOT EXISTS idx_events_metadata ON events USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_events_search_vector ON events USING GIN (search_vector);

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

-- Create trigger to maintain search vector
DROP TRIGGER IF EXISTS events_search_vector_update ON events;
CREATE TRIGGER events_search_vector_update
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION events_search_vector_update();

-- Update existing records
UPDATE events
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(location, '')), 'C');

-- Add RLS policy for metadata
CREATE POLICY "Anyone can view event metadata"
  ON events
  FOR SELECT
  USING (true);