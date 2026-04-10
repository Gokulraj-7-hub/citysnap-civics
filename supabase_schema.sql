-- Enable PostGIS for location features (optional but recommended)
create extension if not exists postgis;

-- Create profiles table (links to auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  role text check (role in ('user', 'admin')) default 'user',
  created_at timestamptz default now()
);

-- Create reports table
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users, -- Nullable for anonymous or system reports
  title text default 'Civic Issue Report',
  ai_description text,
  user_notes text,
  latitude numeric,
  longitude numeric,
  address text,
  image_url text,
  status text check (status in ('pending', 'in-progress', 'resolved')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.reports enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone." 
  on profiles for select using ( true );

create policy "Users can insert their own profile." 
  on profiles for insert with check ( auth.uid() = id );

create policy "Users can update own profile." 
  on profiles for update using ( auth.uid() = id );

-- Policies for Reports
create policy "Reports are viewable by everyone." 
  on reports for select using ( true );

create policy "Authenticated users can create reports." 
  on reports for insert with check ( auth.role() = 'authenticated' );

create policy "Users can update their own reports." 
  on reports for update using ( auth.uid() = user_id );

-- Admin policies (assuming 'admin' role in profiles or app_metadata)
-- Note: Simplified for now.
