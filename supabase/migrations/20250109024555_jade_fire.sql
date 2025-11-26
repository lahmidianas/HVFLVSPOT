-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'marketing', 'reminder')),
  content TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'sms')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  booking_enabled BOOLEAN DEFAULT true,
  payment_enabled BOOLEAN DEFAULT true,
  marketing_enabled BOOLEAN DEFAULT true,
  reminder_enabled BOOLEAN DEFAULT true,
  preferred_channel TEXT DEFAULT 'email' CHECK (preferred_channel IN ('email', 'push', 'sms')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add device tokens array to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS device_tokens TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their notification preferences"
  ON notification_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);