-- Drop table to reset everything (easiest way to fix bad schema/constraints)
-- WARNING: Deletes existing notifications
DROP TABLE IF EXISTS notifications;

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, -- No longer references auth.users to allow mock users
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('info', 'warning', 'success', 'error')) DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE to select/insert/update/delete (for dev simplicity)
CREATE POLICY "Public Access"
ON notifications FOR ALL
USING ( true )
WITH CHECK ( true );
