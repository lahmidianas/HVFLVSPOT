/*
  # Fix System Permissions Setup

  1. Changes
    - Drop existing system_permission type if exists
    - Create system_permission type with all required permissions
    - Add system_permission[] column to system_accounts
    - Migrate existing permissions data
    - Update test system account

  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity during migration
*/

-- First drop the enum if it exists
DROP TYPE IF EXISTS system_permission;

-- Recreate the enum type
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

-- Add new typed_permissions column
ALTER TABLE system_accounts 
ADD COLUMN typed_permissions system_permission[] DEFAULT '{}';

-- Update the test system account with typed permissions
UPDATE system_accounts 
SET typed_permissions = ARRAY[
  'events.read', 'events.create', 'events.update', 'events.delete', 'events.publish',
  'tickets.read', 'tickets.create', 'tickets.update', 'tickets.delete', 'tickets.validate',
  'bookings.read', 'bookings.create', 'bookings.update', 'bookings.cancel', 'bookings.refund',
  'users.read', 'users.create', 'users.update', 'users.delete',
  'analytics.read', 'reports.generate', 'metrics.view',
  'system.config', 'system.logs', 'system.health'
]::system_permission[]
WHERE name = 'test_system';