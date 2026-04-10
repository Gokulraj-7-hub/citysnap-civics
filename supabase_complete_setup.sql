-- Complete Database Setup for CivicEye Redesign
-- Run this entire script in Supabase SQL Editor

-- 1. Enable PostGIS for location features (optional but recommended)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create profiles table (links to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  role text check (role in ('user', 'admin')) default 'user',
  created_at timestamptz default now()
);

-- 3. Create reports table with all new columns
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users, -- Nullable for anonymous reports
  title text default 'Civic Issue Report',
  ai_description text,
  user_notes text,
  latitude numeric,
  longitude numeric,
  address text,
  image_url text,
  status text check (status in ('pending', 'in-progress', 'resolved')) default 'pending',
  severity text check (severity in ('low', 'medium', 'high', 'critical')) default 'medium',
  state text,
  district text,
  city text,
  collector_name text,
  collector_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Create location hierarchy table
CREATE TABLE IF NOT EXISTS public.india_locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  state text NOT NULL,
  district text NOT NULL,
  city text,
  collector_name text,
  collector_email text,
  collector_phone text,
  created_at timestamptz DEFAULT now()
);

-- 5. Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.india_locations ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Reports are viewable by everyone." ON reports;
DROP POLICY IF EXISTS "Authenticated users can create reports." ON reports;
DROP POLICY IF EXISTS "Anyone can create reports." ON reports;
DROP POLICY IF EXISTS "Users can update their own reports." ON reports;
DROP POLICY IF EXISTS "Public can view locations" ON india_locations;

-- 7. Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone." 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- 8. Policies for Reports (Allow anonymous reporting)
CREATE POLICY "Reports are viewable by everyone." 
  ON reports FOR SELECT USING (true);

CREATE POLICY "Anyone can create reports." 
  ON reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own reports." 
  ON reports FOR UPDATE USING (auth.uid() = user_id);

-- 9. Policies for Locations
CREATE POLICY "Public can view locations" 
  ON india_locations FOR SELECT USING (true);

-- 10. Insert sample location data for major Indian cities
INSERT INTO public.india_locations (state, district, city, collector_name, collector_email) VALUES
-- Tamil Nadu
('Tamil Nadu', 'Chennai', 'Chennai', 'District Collector Chennai', 'collector.chennai@tn.gov.in'),
('Tamil Nadu', 'Coimbatore', 'Coimbatore', 'District Collector Coimbatore', 'collector.coimbatore@tn.gov.in'),
('Tamil Nadu', 'Madurai', 'Madurai', 'District Collector Madurai', 'collector.madurai@tn.gov.in'),
('Tamil Nadu', 'Tiruchirappalli', 'Trichy', 'District Collector Trichy', 'collector.trichy@tn.gov.in'),

-- Maharashtra
('Maharashtra', 'Mumbai City', 'Mumbai', 'District Collector Mumbai', 'collector.mumbai@mh.gov.in'),
('Maharashtra', 'Pune', 'Pune', 'District Collector Pune', 'collector.pune@mh.gov.in'),
('Maharashtra', 'Nagpur', 'Nagpur', 'District Collector Nagpur', 'collector.nagpur@mh.gov.in'),
('Maharashtra', 'Thane', 'Thane', 'District Collector Thane', 'collector.thane@mh.gov.in'),

-- Karnataka
('Karnataka', 'Bangalore Urban', 'Bangalore', 'District Collector Bangalore', 'collector.bangalore@ka.gov.in'),
('Karnataka', 'Mysore', 'Mysore', 'District Collector Mysore', 'collector.mysore@ka.gov.in'),
('Karnataka', 'Mangalore', 'Mangalore', 'District Collector Mangalore', 'collector.mangalore@ka.gov.in'),

-- Delhi
('Delhi', 'New Delhi', 'New Delhi', 'District Magistrate New Delhi', 'dm.newdelhi@delhi.gov.in'),
('Delhi', 'South Delhi', 'South Delhi', 'District Magistrate South Delhi', 'dm.southdelhi@delhi.gov.in'),
('Delhi', 'North Delhi', 'North Delhi', 'District Magistrate North Delhi', 'dm.northdelhi@delhi.gov.in'),

-- West Bengal
('West Bengal', 'Kolkata', 'Kolkata', 'District Magistrate Kolkata', 'dm.kolkata@wb.gov.in'),
('West Bengal', 'Howrah', 'Howrah', 'District Magistrate Howrah', 'dm.howrah@wb.gov.in'),

-- Gujarat
('Gujarat', 'Ahmedabad', 'Ahmedabad', 'District Collector Ahmedabad', 'collector.ahmedabad@gj.gov.in'),
('Gujarat', 'Surat', 'Surat', 'District Collector Surat', 'collector.surat@gj.gov.in'),

-- Rajasthan
('Rajasthan', 'Jaipur', 'Jaipur', 'District Collector Jaipur', 'collector.jaipur@rj.gov.in'),
('Rajasthan', 'Jodhpur', 'Jodhpur', 'District Collector Jodhpur', 'collector.jodhpur@rj.gov.in'),

-- Uttar Pradesh
('Uttar Pradesh', 'Lucknow', 'Lucknow', 'District Magistrate Lucknow', 'dm.lucknow@up.gov.in'),
('Uttar Pradesh', 'Kanpur Nagar', 'Kanpur', 'District Magistrate Kanpur', 'dm.kanpur@up.gov.in'),
('Uttar Pradesh', 'Varanasi', 'Varanasi', 'District Magistrate Varanasi', 'dm.varanasi@up.gov.in'),

-- Telangana
('Telangana', 'Hyderabad', 'Hyderabad', 'District Collector Hyderabad', 'collector.hyderabad@telangana.gov.in'),

-- Kerala
('Kerala', 'Thiruvananthapuram', 'Trivandrum', 'District Collector Trivandrum', 'collector.tvm@kerala.gov.in'),
('Kerala', 'Ernakulam', 'Kochi', 'District Collector Ernakulam', 'collector.ernakulam@kerala.gov.in')
ON CONFLICT DO NOTHING;

-- 11. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
CREATE INDEX IF NOT EXISTS idx_reports_state ON reports(state);
CREATE INDEX IF NOT EXISTS idx_reports_district ON reports(district);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_india_locations_state ON india_locations(state);
CREATE INDEX IF NOT EXISTS idx_india_locations_district ON india_locations(district);

-- 12. Create admin user profile for your account
-- Replace 'nivasb023@gmail.com' with your actual email if different
INSERT INTO profiles (id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'nivasb023@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Success message
SELECT 'Database setup complete! You can now login as admin.' as message;
