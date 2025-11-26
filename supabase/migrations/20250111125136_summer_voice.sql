-- Safely drop trigger first
DROP TRIGGER IF EXISTS on_organizer_created ON organizers;

-- Drop function
DROP FUNCTION IF EXISTS sync_user_role();

-- Drop policies
DROP POLICY IF EXISTS "Organizers can manage their own data" ON organizers;
DROP POLICY IF EXISTS "Public can view organizer profiles" ON organizers;

-- Drop indexes
DROP INDEX IF EXISTS idx_organizers_user_id;
DROP INDEX IF EXISTS idx_organizers_email;

-- Drop the organizers table if it exists
DROP TABLE IF EXISTS organizers;