-- Enable required extension first
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create function to safely parse search queries
CREATE OR REPLACE FUNCTION event_search_query_parser(search_text TEXT) 
RETURNS tsquery AS $$
DECLARE
  query_text TEXT;
BEGIN
  -- Handle empty or NULL input
  IF search_text IS NULL OR trim(search_text) = '' THEN
    RETURN to_tsquery('');
  END IF;

  -- First try websearch_to_tsquery for advanced parsing
  BEGIN
    RETURN websearch_to_tsquery('english', search_text);
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to plainto_tsquery for simple text
    BEGIN
      RETURN plainto_tsquery('english', search_text);
    EXCEPTION WHEN OTHERS THEN
      -- If all else fails, return empty query
      RETURN to_tsquery('');
    END;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the search vector trigger function
CREATE OR REPLACE FUNCTION events_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(
      (SELECT string_agg(name, ' ')
       FROM categories 
       WHERE id = NEW.category_id), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure GIN indexes exist
CREATE INDEX IF NOT EXISTS idx_events_search_vector_gin 
ON events USING GIN (search_vector);

-- Create trigram indexes after pg_trgm is enabled
CREATE INDEX IF NOT EXISTS idx_events_title_trigram 
ON events USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_events_location_trigram 
ON events USING GIN (location gin_trgm_ops);

-- Update existing records
UPDATE events
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(location, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(
    (SELECT string_agg(name, ' ')
     FROM categories 
     WHERE id = category_id), '')), 'B');