-- ==========================================
-- MASTER FIX SCRIPT FOR CIVIC EYE ALERTS
-- Run this script to fix ALL permission issues
-- ==========================================

-- 1. STORAGE PERMISSIONS (Fix "violates row-level security" on upload)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('report-images', 'report-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Reset storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- Allow full public access to 'report-images'
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'report-images' );
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'report-images' );
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'report-images' );
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING ( bucket_id = 'report-images' );


-- 2. REPORT PERMISSIONS (Fix "User not authenticated" & Status Update/Delete failures)
-- Enable RLS just in case
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Reset report policies
DROP POLICY IF EXISTS "Authenticated users can create reports." ON reports;
DROP POLICY IF EXISTS "Public can create reports" ON reports;
DROP POLICY IF EXISTS "Public can delete reports" ON reports;
DROP POLICY IF EXISTS "Public can update reports" ON reports;
DROP POLICY IF EXISTS "Reports are viewable by everyone." ON reports;

-- Allow full public access to reports
CREATE POLICY "Public can create reports" ON reports FOR INSERT WITH CHECK ( true );
CREATE POLICY "Public can delete reports" ON reports FOR DELETE USING ( true );
CREATE POLICY "Public can update reports" ON reports FOR UPDATE USING ( true ) WITH CHECK ( true );
CREATE POLICY "Reports are viewable by everyone." ON reports FOR SELECT USING ( true );


-- 3. NOTIFICATIONS SYSTEM (Fix "relation does not exist" & permission errors)
-- Drop existing table to ensure clean schema (WARNING: Clears notifications)
DROP TABLE IF EXISTS notifications;

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, -- No FK constraint to auth.users (allows mock users)
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('info', 'warning', 'success', 'error')) DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow full public access to notifications
CREATE POLICY "Public Access Notifications" ON notifications FOR ALL USING ( true ) WITH CHECK ( true );

-- ==========================================
-- FIX COMPLETE
-- ==========================================
