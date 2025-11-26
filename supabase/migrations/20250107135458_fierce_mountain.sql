/*
  # Authentication System Updates
  
  1. New Tables
    - system_accounts table with proper RLS policies
  
  2. Updates
    - Add role column to users table
    - Add proper indexes for performance
  
  3. Security
    - Enable RLS
    - Add appropriate policies
*/

-- Create system_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  api_key TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on system_accounts
ALTER TABLE system_accounts ENABLE ROW LEVEL SECURITY;

-- Create indexes for system_accounts
CREATE INDEX IF NOT EXISTS idx_system_accounts_name ON system_accounts(name);
CREATE INDEX IF NOT EXISTS idx_system_accounts_api_key ON system_accounts(api_key);

-- Create policies for system_accounts
CREATE POLICY "Allow public read of system_accounts"
  ON system_accounts
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Add role column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT;

-- Set default role for existing users
UPDATE users 
SET role = 'User' 
WHERE role IS NULL;

-- Make role column NOT NULL after setting defaults
ALTER TABLE users 
ALTER COLUMN role SET NOT NULL;

-- Create index for users table
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create policy for superadmin
CREATE POLICY "Only superadmin can modify system_accounts"
  ON system_accounts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SuperAdmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SuperAdmin'
    )
  );