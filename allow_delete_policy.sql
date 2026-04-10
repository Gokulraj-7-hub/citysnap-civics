-- Allow public (anonymous/admin) users to delete reports
-- In production, restricts to admin role, but for now allow public to facilitate admin dashboard testing
DROP POLICY IF EXISTS "Public can delete reports" ON reports;

CREATE POLICY "Public can delete reports"
ON reports FOR DELETE
USING ( true );
