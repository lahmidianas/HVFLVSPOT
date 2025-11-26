/*
  # Update services to use auth.users

  1. Changes
    - Create secure view for user profiles
    - Update foreign key constraints
  
  2. Security
    - Use simple security check in view
*/

-- Create a secure view that combines auth.users with profile data
CREATE VIEW user_profiles 
WITH (security_barrier = true)
AS
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url,
  au.raw_user_meta_data->>'phone' as phone,
  au.raw_user_meta_data->'device_tokens' as device_tokens,
  au.raw_user_meta_data->>'role' as role,
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE 
  -- Only allow users to see their own profile
  auth.uid() = au.id;

-- Grant access to the view
GRANT SELECT ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- Update foreign key constraints to reference auth.users
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_user_id_fkey,
  ADD CONSTRAINT transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE notification_preferences
  DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey,
  ADD CONSTRAINT notification_preferences_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_user_id_fkey,
  ADD CONSTRAINT bookings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_organizer_id_fkey,
  ADD CONSTRAINT events_organizer_id_fkey 
  FOREIGN KEY (organizer_id) REFERENCES auth.users(id);