-- ============================================================================
-- FIX RLS INFINITE RECURSION ISSUE
-- ============================================================================
-- This script fixes the infinite recursion error in RLS policies
-- Run this if you're getting "infinite recursion detected in policy" errors
-- ============================================================================

-- The issue: RLS policies that check the profiles table can cause infinite
-- recursion if the profiles table has its own RLS policies that reference
-- other tables.
--
-- The solution: Use auth.jwt() to check user roles directly from the JWT
-- token instead of querying the profiles table.

-- ============================================================================
-- 1. DROP PROBLEMATIC POLICIES
-- ============================================================================

-- Drop all policies that might be causing recursion
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

-- ============================================================================
-- 2. RECREATE POLICIES WITHOUT RECURSION
-- ============================================================================

-- Employer verification requests - Admin policies
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

-- Employer verification requests - User insert policy (simplified)
CREATE POLICY "employer_verification_insert_own" ON employer_verification_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = employer_id
  );

-- Worker verification requests - Admin policies
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

-- Worker verification requests - User insert policy (simplified)
CREATE POLICY "worker_verification_insert_own" ON worker_verification_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = worker_id
  );

-- Verification audit log - Admin policy
CREATE POLICY "verification_audit_select_admin" ON verification_audit_log
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Verification table - Admin policies
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

-- Storage - Admin policy
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
-- 3. VERIFY POLICIES
-- ============================================================================

-- Check if policies were created successfully
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN (
  'employer_verification_requests',
  'worker_verification_requests',
  'verification_audit_log',
  'verification'
)
ORDER BY tablename, policyname;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- 
-- What was fixed:
-- ✅ Removed all queries to profiles table in RLS policies
-- ✅ Now using auth.jwt() to check admin status directly from JWT token
-- ✅ Simplified insert policies to only check auth.uid()
-- 
-- This prevents infinite recursion by avoiding any database queries in
-- RLS policies that could trigger other RLS policies.
-- 
-- Note: Make sure your admin users have either:
-- - role = 'admin' in their JWT token, OR
-- - is_admin = true in their user_metadata
-- 
-- You can set this in Supabase Auth settings or by updating the user's
-- metadata directly.
-- ============================================================================

