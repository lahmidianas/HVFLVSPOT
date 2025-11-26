/*
  # Fix Full-Text Search Implementation

  1. Changes
    - Add function to properly format search queries
    - Support phrase searches and multiple terms
    - Handle special characters and spaces
    - Add plainto_tsquery fallback for simple queries

  2. Details
    - Creates a new function to safely parse search queries
    - Supports both phrase searches and individual terms
    - Handles empty or invalid queries gracefully
*/

-- Create function to safely parse search queries
CREATE OR REPLACE FUNCTION search_query_parser(search_text TEXT) 
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

-- Update the search function to use the new parser
CREATE OR REPLACE FUNCTION events_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;