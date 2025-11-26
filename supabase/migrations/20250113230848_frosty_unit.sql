-- Drop trigger first
DROP TRIGGER IF EXISTS update_organizer_timestamp ON organizers;

-- Drop function
DROP FUNCTION IF EXISTS update_organizer_updated_at();

-- Drop policies
DROP POLICY IF EXISTS "Organizers can manage their own profile" ON organizers;
DROP POLICY IF EXISTS "Public can view verified organizers" ON organizers;

-- Drop indexes
DROP INDEX IF EXISTS idx_organizers_user_id;
DROP INDEX IF EXISTS idx_organizers_verified;

-- Drop table
DROP TABLE IF EXISTS organizers;