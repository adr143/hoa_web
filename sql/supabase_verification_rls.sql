-- ============================================================================
-- HOUSE OF ANGELS - VERIFICATION SYSTEM RLS POLICIES
-- ============================================================================
-- Row Level Security policies for the new verification system
-- Run this AFTER running supabase_verification_system.sql
-- ============================================================================

-- ============================================================================
-- 1. EMPLOYER_VERIFICATION_REQUESTS TABLE
-- ============================================================================

ALTER TABLE employer_verification_requests ENABLE ROW LEVEL SECURITY;

-- Employers can view their own verification requests
CREATE POLICY "employer_verification_select_own" ON employer_verification_requests
  FOR SELECT
  USING (
    auth.uid() = employer_id
  );

-- Employers can insert their own verification requests
CREATE POLICY "employer_verification_insert_own" ON employer_verification_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = employer_id
  );

-- Employers can update their own pending requests (resubmit documents)
CREATE POLICY "employer_verification_update_own" ON employer_verification_requests
  FOR UPDATE
  USING (
    auth.uid() = employer_id AND
    status IN ('pending', 'rejected')
  );

-- Admins can view all verification requests (using auth.jwt() to avoid recursion)
CREATE POLICY "employer_verification_select_admin" ON employer_verification_requests
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Admins can update verification requests (approve/reject)
CREATE POLICY "employer_verification_update_admin" ON employer_verification_requests
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================================
-- 2. WORKER_VERIFICATION_REQUESTS TABLE
-- ============================================================================

ALTER TABLE worker_verification_requests ENABLE ROW LEVEL SECURITY;

-- Workers can view their own verification requests
CREATE POLICY "worker_verification_select_own" ON worker_verification_requests
  FOR SELECT
  USING (
    auth.uid() = worker_id
  );

-- Workers can insert their own verification requests
CREATE POLICY "worker_verification_insert_own" ON worker_verification_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = worker_id
  );

-- Workers can update their own pending requests
CREATE POLICY "worker_verification_update_own" ON worker_verification_requests
  FOR UPDATE
  USING (
    auth.uid() = worker_id AND
    status IN ('pending', 'rejected')
  );

-- Admins can view all worker verification requests
CREATE POLICY "worker_verification_select_admin" ON worker_verification_requests
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Admins can update worker verification requests
CREATE POLICY "worker_verification_update_admin" ON worker_verification_requests
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================================
-- 3. VERIFICATION_AUDIT_LOG TABLE
-- ============================================================================

ALTER TABLE verification_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view audit logs for their own verification requests
CREATE POLICY "verification_audit_select_own" ON verification_audit_log
  FOR SELECT
  USING (
    -- For employer verifications
    (verification_type = 'employer' AND EXISTS (
      SELECT 1 FROM employer_verification_requests
      WHERE id = verification_audit_log.verification_request_id
      AND employer_id = auth.uid()
    ))
    OR
    -- For worker verifications
    (verification_type = 'worker' AND EXISTS (
      SELECT 1 FROM worker_verification_requests
      WHERE id = verification_audit_log.verification_request_id
      AND worker_id = auth.uid()
    ))
  );

-- Admins can view all audit logs
CREATE POLICY "verification_audit_select_admin" ON verification_audit_log
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- System can insert audit logs (via functions)
CREATE POLICY "verification_audit_insert_system" ON verification_audit_log
  FOR INSERT
  WITH CHECK (true);

-- No updates or deletes allowed (immutable audit log)

-- ============================================================================
-- 4. UPDATE EXISTING VERIFICATION TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "verification_select_own" ON verification;
DROP POLICY IF EXISTS "verification_insert_own" ON verification;
DROP POLICY IF EXISTS "verification_update_own" ON verification;
DROP POLICY IF EXISTS "verification_admin_select" ON verification;
DROP POLICY IF EXISTS "verification_admin_update" ON verification;

-- Users can view their own verification records
CREATE POLICY "verification_select_own" ON verification
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verification records
CREATE POLICY "verification_insert_own" ON verification
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending verification records
CREATE POLICY "verification_update_own" ON verification
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all verification records
CREATE POLICY "verification_admin_select" ON verification
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Admins can update verification status
CREATE POLICY "verification_admin_update" ON verification
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- ============================================================================
-- 5. STORAGE BUCKET POLICIES
-- ============================================================================

-- Create storage bucket for verification documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own verification documents
CREATE POLICY "verification_documents_upload_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own verification documents
CREATE POLICY "verification_documents_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all verification documents
CREATE POLICY "verification_documents_select_admin"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' AND (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  )
);

-- Users can update their own verification documents
CREATE POLICY "verification_documents_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own verification documents
CREATE POLICY "verification_documents_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- 6. GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ============================================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_employer_verification_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_worker_verification_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_employer_verification(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_verification(UUID, TEXT, UUID, TEXT) TO authenticated;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- 
-- RLS Policies Created:
-- 
-- employer_verification_requests:
-- ✅ Employers can view/insert/update their own requests
-- ✅ Admins can view/update all requests
--
-- worker_verification_requests:
-- ✅ Workers can view/insert/update their own requests
-- ✅ Admins can view/update all requests
--
-- verification_audit_log:
-- ✅ Users can view their own audit logs
-- ✅ Admins can view all audit logs
-- ✅ System can insert logs (immutable)
--
-- verification (updated):
-- ✅ Users can view/insert/update their own records
-- ✅ Admins can view/update all records
--
-- Storage Policies:
-- ✅ Users can upload/view/update/delete their own documents
-- ✅ Admins can view all documents
--
-- Security Features:
-- ✅ Users can only access their own verification data
-- ✅ Admins have full access for review and approval
-- ✅ Audit logs are immutable
-- ✅ Storage is properly secured with folder-based access
-- ============================================================================

