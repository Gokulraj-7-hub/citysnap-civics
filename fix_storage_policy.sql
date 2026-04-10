-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-images', 'report-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS should already be enabled on storage.objects.
-- Skipping ALTER TABLE since it requires owner permissions.

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- Allow public access to view files (SELECT)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'report-images' );

-- Allow public access to upload files (INSERT)
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'report-images' );

-- Allow public access to update files (UPDATE)
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'report-images' );

-- Allow public access to delete files (DELETE)
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'report-images' );
