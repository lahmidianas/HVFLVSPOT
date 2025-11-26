/*
  # Rollback noisy_snowflake migration

  1. Changes
    - Drop user_profiles view
    - Restore original foreign key constraints
    - Remove auth.users references
*/

-- Drop the secure view
DROP VIEW IF EXISTS user_profiles;

-- Restore original foreign key constraints
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_user_id_fkey,
  ADD CONSTRAINT transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE notification_preferences
  DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey,
  ADD CONSTRAINT notification_preferences_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_user_id_fkey,
  ADD CONSTRAINT bookings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_organizer_id_fkey,
  ADD CONSTRAINT events_organizer_id_fkey 
  FOREIGN KEY (organizer_id) REFERENCES users(id);