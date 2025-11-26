-- Drop existing policies
DROP POLICY IF EXISTS "Organizers can manage their own profile" ON organizers;
DROP POLICY IF EXISTS "Public can view verified organizers" ON organizers;
DROP POLICY IF EXISTS "Allow test data creation" ON organizers;
DROP POLICY IF EXISTS "Allow all operations" ON organizers;

-- Create a new permissive policy
CREATE POLICY "Unrestricted access"
  ON organizers
  FOR ALL 
  USING (true)
  WITH CHECK (true);