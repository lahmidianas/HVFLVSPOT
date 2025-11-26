/*
  # Payment System Schema

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `event_id` (uuid, references events)
      - `ticket_id` (uuid, references tickets)
      - `amount` (decimal)
      - `status` (text)
      - `type` (text)
      - `reference_id` (uuid, for refunds)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on transactions table
    - Add policies for users to view their own transactions
    - Add policies for organizers to view their event transactions
    - Add policies for service role access
*/

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  ticket_id UUID REFERENCES tickets(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  type TEXT NOT NULL CHECK (type IN ('payment', 'refund')),
  reference_id UUID REFERENCES transactions(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view their event transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT organizer_id 
      FROM events 
      WHERE events.id = transactions.event_id
    )
  );

CREATE POLICY "Service role has full access"
  ON transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_event_id ON transactions(event_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);