/*
  # System Accounts Setup

  1. Changes
    - Create system_accounts table with text array for permissions
    - Create system permissions enum type
    - Add test system account
*/

-- First create the table with text array
CREATE TABLE IF NOT EXISTS system_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  api_key TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create the enum type
CREATE TYPE system_permission AS ENUM (
  -- Event Management
  'events.read', 'events.create', 'events.update', 'events.delete', 'events.publish',
  -- Ticket Management
  'tickets.read', 'tickets.create', 'tickets.update', 'tickets.delete', 'tickets.validate',
  -- Booking Management
  'bookings.read', 'bookings.create', 'bookings.update', 'bookings.cancel', 'bookings.refund',
  -- User Management
  'users.read', 'users.create', 'users.update', 'users.delete',
  -- Analytics & Reporting
  'analytics.read', 'reports.generate', 'metrics.view',
  -- System Operations
  'system.config', 'system.logs', 'system.health'
);

-- Insert test system account
INSERT INTO system_accounts (name, api_key, permissions) VALUES (
  'test_system',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQN2YIpjR5OO',
  ARRAY[
    'events.read', 'events.create', 'events.update', 'events.delete', 'events.publish',
    'tickets.read', 'tickets.create', 'tickets.update', 'tickets.delete', 'tickets.validate',
    'bookings.read', 'bookings.create', 'bookings.update', 'bookings.cancel', 'bookings.refund',
    'users.read', 'users.create', 'users.update', 'users.delete',
    'analytics.read', 'reports.generate', 'metrics.view',
    'system.config', 'system.logs', 'system.health'
  ]
);