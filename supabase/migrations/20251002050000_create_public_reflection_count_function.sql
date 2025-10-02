-- Create a public function to get reflection count for marketing pages
CREATE OR REPLACE FUNCTION get_public_reflection_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*) FROM reflection_sessions;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION get_public_reflection_count() TO anon;
GRANT EXECUTE ON FUNCTION get_public_reflection_count() TO authenticated;
