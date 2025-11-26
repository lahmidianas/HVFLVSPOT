/*
  # Remove foreign key constraint from users table

  1. Changes
    - Drop foreign key constraint users_id_fkey from users table
*/

-- Drop the foreign key constraint
ALTER TABLE IF EXISTS users
DROP CONSTRAINT IF EXISTS users_id_fkey;