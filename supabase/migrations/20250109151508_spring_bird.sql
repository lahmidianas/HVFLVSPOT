/*
  # Fix Event Search Query Parser

  1. Changes
    - Create a better search query parser function
    - Update search vector function
    - Add proper indexes
    - Update existing records

  2. Details
    - Uses websearch_to_tsquery for better multi-word handling
    - Properly handles quoted phrases
    - Maintains word relationships
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create function for safe query parsing
CREATE OR REPLACE FUNCTION safe_websearch_to_tsquery(search_text TEXT) 
RETURNS tsquery AS $$
BEGIN
  -- Handle empty input
  IF search_text IS NULL OR trim(search_text) = '' THEN
    RETURN to_tsquery('');
  END IF;

  -- First try websearch_to_tsquery for best phrase handling
  BEGIN
    RETURN websearch_to_tsquery('english', search_text);
  EXCEPTION WHEN OTHERS THEN
    -- Fall back to plainto_tsquery for simple text
    BEGIN
      RETURN plainto_tsquery('english', search_text);
    EXCEPTION WHEN OTHERS THEN
      -- If all else fails, return empty query
      RETURN to_tsquery('');
    END;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the search vector function
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