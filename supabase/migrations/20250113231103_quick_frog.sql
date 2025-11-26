-- Create organizers table
CREATE TABLE IF NOT EXISTS organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website_url TEXT,
  social_media JSONB DEFAULT '{}'::jsonb,
  business_address TEXT,
  tax_id TEXT,
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_id UNIQUE (user_id),
  CONSTRAINT unique_company_name UNIQUE (company_name)
);

-- Enable RLS
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_organizers_user_id ON organizers(user_id);
CREATE INDEX idx_organizers_verified ON organizers(verified);
CREATE INDEX idx_organizers_company_name ON organizers(company_name);

-- Create policies
CREATE POLICY "Organizers can manage their own profile"
  ON organizers
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can view verified organizers"
  ON organizers
  FOR SELECT
  TO authenticated
  USING (verified = true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_organizer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_organizer_timestamp
  BEFORE UPDATE ON organizers
  FOR EACH ROW
  EXECUTE FUNCTION update_organizer_updated_at();

-- Create function to sync user role when organizer is created
CREATE OR REPLACE FUNCTION sync_organizer_role()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET role = 'Organizer'
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync role
CREATE TRIGGER sync_organizer_role_trigger
  AFTER INSERT ON organizers
  FOR EACH ROW
  EXECUTE FUNCTION sync_organizer_role();