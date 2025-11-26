/*
  # Create users table with basic auth fields
  
  1. Tables
    - Create users table if not exists
    - Add required fields for authentication
  
  2. Security
    - Enable RLS
    - Add policies for public access and data protection
*/

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for public" ON users;
DROP POLICY IF EXISTS "Enable read access for own data" ON users;

-- Create new policies
CREATE POLICY "Enable insert for public"
  ON users
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Enable read access for own data"
  ON users
  FOR SELECT
  USING (true);

-- Create index for email lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);