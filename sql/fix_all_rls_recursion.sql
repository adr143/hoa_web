-- ============================================================================
-- FIX ALL RLS INFINITE RECURSION ISSUES
-- ============================================================================
-- This script fixes ALL infinite recursion errors across the entire database
-- Run this script to fix recursion in profiles and all verification tables
-- ============================================================================

-- ============================================================================
-- PART 1: FIX PROFILES TABLE (ROOT CAUSE)
-- ============================================================================

-- The profiles_admin_all policy is the root cause - it queries profiles table
-- to check if user is admin, which causes infinite recursion

DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

-- Recreate without recursion - use JWT token instead
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
-- PART 2: FIX VERIFICATION TABLES
-- ============================================================================

-- Drop all problematic policies on verification tables
DROP POLICY IF EXISTS "employer_verification_select_admin" ON employer_verification_requests;
DROP POLICY IF EXISTS "employer_verification_update_admin" ON employer_verification_requests;
DROP POLICY IF EXISTS "employer_verification_insert_own" ON employer_verification_requests;

DROP POLICY IF EXISTS "worker_verification_select_admin" ON worker_verification_requests;
DROP POLICY IF EXISTS "worker_verification_update_admin" ON worker_verification_requests;
DROP POLICY IF EXISTS "worker_verification_insert_own" ON worker_verification_requests;

DROP POLICY IF EXISTS "verification_audit_select_admin" ON verification_audit_log;

DROP POLICY IF EXISTS "verification_admin_select" ON verification;
DROP POLICY IF EXISTS "verification_admin_update" ON verification;

DROP POLICY IF EXISTS "verification_documents_select_admin" ON storage.objects;

-- Recreate all policies without recursion

-- Employer verification requests
CREATE POLICY "employer_verification_select_admin" ON employer_verification_requests
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "employer_verification_update_admin" ON employer_verification_requests
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "employer_verification_insert_own" ON employer_verification_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = employer_id
  );

-- Worker verification requests
CREATE POLICY "worker_verification_select_admin" ON worker_verification_requests
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "worker_verification_update_admin" ON worker_verification_requests
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "worker_verification_insert_own" ON worker_verification_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = worker_id
  );

-- Verification audit log
CREATE POLICY "verification_audit_select_admin" ON verification_audit_log
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Verification table
CREATE POLICY "verification_admin_select" ON verification
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "verification_admin_update" ON verification
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Storage bucket policy
CREATE POLICY "verification_documents_select_admin"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' AND (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  )
);

-- ============================================================================
-- PART 3: CHECK FOR OTHER PROBLEMATIC POLICIES
-- ============================================================================

-- Find all policies that query the profiles table (potential recursion)
-- This query will show you any other policies that might cause issues
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE qual LIKE '%profiles%'
  AND tablename != 'profiles'
ORDER BY tablename, policyname;

-- ============================================================================
-- PART 4: SET ADMIN USER METADATA (REQUIRED!)
-- ============================================================================

-- Since we're now using JWT metadata instead of profiles.is_admin,
-- you MUST set the is_admin flag in user metadata for admin users.

-- Example: Set admin for a specific user
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
-- WHERE email = 'your-admin@example.com';

-- Or set admin for all users who have is_admin = true in profiles
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
-- WHERE id IN (
--   SELECT id FROM profiles WHERE is_admin = true
-- );

-- ============================================================================
-- PART 5: VERIFY THE FIX
-- ============================================================================

-- Check profiles policies
SELECT 'PROFILES POLICIES:' as section;
SELECT policyname, cmd, 
  CASE 
    WHEN qual LIKE '%profiles%' THEN '⚠️ STILL RECURSIVE'
    ELSE '✅ OK'
  END as status
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check verification policies
SELECT 'VERIFICATION POLICIES:' as section;
SELECT tablename, policyname, cmd,
  CASE 
    WHEN qual LIKE '%profiles%' THEN '⚠️ STILL RECURSIVE'
    ELSE '✅ OK'
  END as status
FROM pg_policies 
WHERE tablename IN (
  'employer_verification_requests',
  'worker_verification_requests',
  'verification_audit_log',
  'verification'
)
ORDER BY tablename, policyname;

-- Check admin users
SELECT 'ADMIN USERS:' as section;
SELECT 
  u.email,
  p.is_admin as profile_is_admin,
  (u.raw_user_meta_data->>'is_admin')::boolean as metadata_is_admin,
  CASE 
    WHEN (u.raw_user_meta_data->>'is_admin')::boolean = true THEN '✅ OK'
    WHEN p.is_admin = true THEN '⚠️ NEEDS METADATA UPDATE'
    ELSE '✅ NOT ADMIN'
  END as status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.is_admin = true OR (u.raw_user_meta_data->>'is_admin')::boolean = true;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- 
-- What was fixed:
-- ✅ Fixed profiles_admin_all policy (root cause of recursion)
-- ✅ Fixed all verification table policies
-- ✅ All policies now use auth.jwt() instead of querying profiles
-- ✅ No more circular dependencies
-- 
-- NEXT STEPS:
-- 1. Run this script in Supabase SQL Editor
-- 2. Set is_admin in user metadata for admin users (see PART 4)
-- 3. Refresh your app and test
-- 
-- IMPORTANT NOTES:
-- - The profiles.is_admin column can still be used for display
-- - RLS policies now check JWT token metadata instead
-- - Admin users MUST have is_admin = true in their user metadata
-- - You can sync profiles.is_admin to user metadata using the query in PART 4
-- 
-- ============================================================================

