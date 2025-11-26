/*
  # System Accounts Table

  1. New Tables
    - `system_accounts`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `api_key` (text)
      - `permissions` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `system_accounts` table
    - Add policy for system accounts to read their own data
*/

CREATE TABLE IF NOT EXISTS system_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  api_key TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for system accounts to read their own data
CREATE POLICY "System accounts can read own data"
  ON system_accounts
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM system_accounts WHERE id = auth.uid()
  ));

-- Create index for API key lookups
CREATE INDEX idx_system_accounts_api_key ON system_accounts(api_key);