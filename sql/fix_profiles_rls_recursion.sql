-- ============================================================================
-- FIX PROFILES TABLE RLS INFINITE RECURSION ISSUE
-- ============================================================================
-- This script fixes the infinite recursion error in the profiles table
-- The profiles_admin_all policy is checking the profiles table itself,
-- which causes infinite recursion.
-- ============================================================================

-- ============================================================================
-- 1. DROP THE PROBLEMATIC POLICY
-- ============================================================================

-- This policy is causing the recursion because it queries the profiles table
-- to check if the user is an admin
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

-- ============================================================================
-- 2. RECREATE ADMIN POLICY WITHOUT RECURSION
-- ============================================================================

-- Admin can do everything - using JWT token instead of querying profiles table
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  )
  WITH CHECK (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================================
-- 3. VERIFY POLICIES
-- ============================================================================

-- Check all policies on profiles table
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- 4. SET ADMIN USER METADATA (IMPORTANT!)
-- ============================================================================

-- Since we're now using JWT metadata instead of the profiles.is_admin column,
-- you need to set the is_admin flag in the user's metadata.

-- Replace 'your-admin@example.com' with your actual admin email
-- Uncomment and run this for each admin user:

-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
-- WHERE email = 'your-admin@example.com';

-- To check current metadata:
-- SELECT email, raw_user_meta_data FROM auth.users WHERE email = 'your-admin@example.com';

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- 
-- What was fixed:
-- ✅ Removed the recursive query in profiles_admin_all policy
-- ✅ Now using auth.jwt() to check admin status from JWT token
-- ✅ This prevents the profiles table from querying itself
-- 
-- IMPORTANT: You must set is_admin in user metadata for admin users!
-- 
-- The profiles.is_admin column can still be used for display purposes,
-- but RLS policies now check the JWT token instead.
-- ============================================================================

