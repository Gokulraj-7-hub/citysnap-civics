-- Allow public (anonymous) users to insert reports
DROP POLICY IF EXISTS "Authenticated users can create reports." ON reports;
DROP POLICY IF EXISTS "Public can create reports" ON reports;

CREATE POLICY "Public can create reports"
ON reports FOR INSERT
WITH CHECK ( true );

-- Ensure public can read reports (usually already true, but reinforcing)
DROP POLICY IF EXISTS "Reports are viewable by everyone." ON reports;
CREATE POLICY "Reports are viewable by everyone."
ON reports FOR SELECT
USING ( true );
