-- Allow public (anonymous/admin) users to update reports (e.g. status changes)
-- In production, restricts to admin/owner, but for now allow public to facilitate admin dashboard testing
DROP POLICY IF EXISTS "Public can update reports" ON reports;

CREATE POLICY "Public can update reports"
ON reports FOR UPDATE
USING ( true )
WITH CHECK ( true );
