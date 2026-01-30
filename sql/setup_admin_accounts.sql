-- ============================================================================
-- ADMIN ACCOUNT SETUP SCRIPT
-- ============================================================================
-- This script sets up admin accounts for House of Angels platform
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE TEST ADMIN ACCOUNT
-- ============================================================================
-- This creates a test admin account for development/testing
-- Email: admin@houseofangels.ph
-- Password: Admin@123456 (CHANGE THIS IN PRODUCTION!)
-- ============================================================================

-- Note: You need to create the auth user first through Supabase Dashboard or API
-- Then run this script to set the admin flag

-- Example: After creating the user in Supabase Auth, get their UUID and run:
-- UPDATE profiles SET is_admin = true WHERE id = 'USER_UUID_HERE';

-- ============================================================================
-- STEP 2: FUNCTION TO PROMOTE USER TO ADMIN
-- ============================================================================
-- This function allows you to promote any existing user to admin status
-- ============================================================================

CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = user_email;

  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Update profile to set is_admin = true
  UPDATE profiles
  SET is_admin = true,
      account_type = 'admin',
      updated_at = NOW()
  WHERE id = user_uuid;

  -- Update auth user metadata to include is_admin flag
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('is_admin', true)
  WHERE id = user_uuid;

  RETURN true;
END;
$$;

-- ============================================================================
-- STEP 3: FUNCTION TO REVOKE ADMIN ACCESS
-- ============================================================================
-- This function removes admin privileges from a user
-- ============================================================================

CREATE OR REPLACE FUNCTION revoke_admin_access(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = user_email;

  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Update profile to set is_admin = false
  UPDATE profiles
  SET is_admin = false,
      updated_at = NOW()
  WHERE id = user_uuid;

  -- Update auth user metadata to remove is_admin flag
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('is_admin', false)
  WHERE id = user_uuid;

  RETURN true;
END;
$$;

-- ============================================================================
-- STEP 4: FUNCTION TO LIST ALL ADMINS
-- ============================================================================
-- This function returns all users with admin privileges
-- ============================================================================

CREATE OR REPLACE FUNCTION list_all_admins()
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    au.email,
    p.created_at,
    au.last_sign_in_at
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE p.is_admin = true
  ORDER BY p.created_at DESC;
END;
$$;

-- ============================================================================
-- STEP 5: CREATE ADMIN ACTIVITY LOG TABLE
-- ============================================================================
-- Track all admin actions for security and audit purposes
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'job', 'verification', etc.
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);

-- ============================================================================
-- STEP 6: FUNCTION TO LOG ADMIN ACTIONS
-- ============================================================================
-- Call this function whenever an admin performs an action
-- ============================================================================

CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO admin_activity_log (
    admin_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    p_admin_id,
    p_action,
    p_target_type,
    p_target_id,
    p_details
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- ============================================================================
-- STEP 7: RLS POLICIES FOR ADMIN ACTIVITY LOG
-- ============================================================================

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin activity logs
CREATE POLICY "admin_activity_log_select_admin" ON admin_activity_log
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Only admins can insert admin activity logs
CREATE POLICY "admin_activity_log_insert_admin" ON admin_activity_log
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Example 1: Promote a user to admin
-- SELECT promote_user_to_admin('admin@houseofangels.ph');

-- Example 2: Revoke admin access
-- SELECT revoke_admin_access('former-admin@houseofangels.ph');

-- Example 3: List all admins
-- SELECT * FROM list_all_admins();

-- Example 4: Log an admin action
-- SELECT log_admin_action(
--   'admin-uuid-here',
--   'approved_verification',
--   'verification',
--   'verification-request-uuid',
--   '{"tier": "Verified", "notes": "All documents verified"}'::jsonb
-- );

-- Example 5: View recent admin activity
-- SELECT 
--   aal.*,
--   p.name as admin_name,
--   p.email as admin_email
-- FROM admin_activity_log aal
-- JOIN profiles p ON aal.admin_id = p.id
-- ORDER BY aal.created_at DESC
-- LIMIT 50;

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 1. Always create admin users through Supabase Auth first
-- 2. Then use promote_user_to_admin() to grant admin privileges
-- 3. Never share admin credentials
-- 4. Change default passwords immediately
-- 5. Regularly review admin activity logs
-- 6. Use strong passwords for admin accounts
-- 7. Enable 2FA for admin accounts (configure in Supabase Auth settings)
-- ============================================================================

-- ============================================================================
-- SECURITY BEST PRACTICES
-- ============================================================================
-- 1. Limit the number of admin accounts (principle of least privilege)
-- 2. Use unique email addresses for each admin
-- 3. Regularly audit admin activity logs
-- 4. Revoke admin access when no longer needed
-- 5. Use environment-specific admin accounts (dev, staging, production)
-- 6. Never commit admin credentials to version control
-- 7. Rotate admin passwords regularly
-- ============================================================================

