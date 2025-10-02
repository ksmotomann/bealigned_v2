-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_admin_ids();

-- Create function to get all admin user IDs
CREATE OR REPLACE FUNCTION get_admin_ids()
RETURNS SETOF UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT id
  FROM profiles
  WHERE user_type IN ('admin', 'super_admin');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_admin_ids() TO authenticated;

COMMENT ON FUNCTION get_admin_ids() IS 'Returns all admin and super_admin user IDs. Uses SECURITY DEFINER to bypass RLS.';
