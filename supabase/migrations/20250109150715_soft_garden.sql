/*
  # Fix Event Search Implementation

  1. Changes
    - Enable pg_trgm extension
    - Create function for safe query parsing
    - Update search vector function
    - Add proper indexes for search
    - Update existing records

  2. Details
    - Adds proper full-text search capabilities
    - Enables trigram matching for better text similarity search
    - Maintains search vector automatically via trigger
    - Indexes for optimal search performance
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create function for safe query parsing
CREATE OR REPLACE FUNCTION safe_to_tsquery(search_text TEXT) 
RETURNS tsquery AS $$
BEGIN
  -- Handle empty input
  IF search_text IS NULL OR trim(search_text) = '' THEN
    RETURN to_tsquery('');
  END IF;

  -- Convert the search text to a tsquery safely
  RETURN to_tsquery('english', 
    string_agg(lexeme, ' & ')
  ) FROM unnest(
    regexp_split_to_array(
      trim(regexp_replace(search_text, '[^a-zA-Z0-9]+', ' ', 'g')),
      '\s+'
    )
  ) AS lexeme;
EXCEPTION 
  WHEN OTHERS THEN
    -- Return empty query on any error
    RETURN to_tsquery('');
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