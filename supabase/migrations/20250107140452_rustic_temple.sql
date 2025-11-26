/*
  # Add email column to users table

  1. Changes
    - Add email column to users table
    - Make email column NOT NULL
    - Add unique constraint on email
    - Add index for email lookups

  2. Security
    - No changes to RLS policies needed
*/

-- Add email column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Make email column NOT NULL and unique
ALTER TABLE users 
ALTER COLUMN email SET NOT NULL,
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);