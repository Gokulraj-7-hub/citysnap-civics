-- Phase 1: Database Schema Updates for CivicEye Redesign

-- 1. Add new columns to reports table
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS collector_name text,
ADD COLUMN IF NOT EXISTS collector_email text;

-- 2. Make user_id nullable for anonymous reports
ALTER TABLE public.reports 
ALTER COLUMN user_id DROP NOT NULL;

-- 3. Update RLS policy to allow anonymous inserts
DROP POLICY IF EXISTS "Authenticated users can create reports." ON reports;
CREATE POLICY "Anyone can create reports." 
  ON reports FOR INSERT WITH CHECK (true);

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

-- 5. Add sample location data for major Indian cities
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

-- 6. Enable RLS on india_locations
ALTER TABLE public.india_locations ENABLE ROW LEVEL SECURITY;

-- 7. Allow public read access to locations
CREATE POLICY "Public can view locations" 
  ON india_locations FOR SELECT USING (true);

-- 8. Create index for faster location queries
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
CREATE INDEX IF NOT EXISTS idx_reports_state ON reports(state);
CREATE INDEX IF NOT EXISTS idx_reports_district ON reports(district);
CREATE INDEX IF NOT EXISTS idx_india_locations_state ON india_locations(state);
CREATE INDEX IF NOT EXISTS idx_india_locations_district ON india_locations(district);
