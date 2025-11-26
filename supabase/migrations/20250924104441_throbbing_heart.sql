/*
  # Fix Categories Public Access

  1. Security Updates
    - Add public read access policy for categories table
    - Allow anonymous users to view event categories
    - Maintain existing security for other operations

  2. Changes
    - Create policy for public SELECT access on categories
    - This enables the frontend to load categories using the anon key
*/

-- Add public read access policy for categories
CREATE POLICY "Public can view categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);