/*
  # Create Event Categories

  1. New Data
    - Insert standard event categories with proper slugs and descriptions
    - Categories: Music, Sports, Comedy, Arts, Festivals, Entertainment

  2. Security
    - Uses existing RLS policies on categories table
    - Public read access already enabled
*/

-- Insert event categories
INSERT INTO categories (name, slug, description) VALUES
  ('Music', 'music', 'Concerts, festivals, and live music events'),
  ('Sports', 'sports', 'Athletic competitions and sporting events'),
  ('Comedy', 'comedy', 'Stand-up comedy shows and humor events'),
  ('Arts', 'arts', 'Art exhibitions, galleries, and creative events'),
  ('Festivals', 'festivals', 'Cultural festivals and community celebrations'),
  ('Entertainment', 'entertainment', 'Shows, theater, and entertainment events')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;