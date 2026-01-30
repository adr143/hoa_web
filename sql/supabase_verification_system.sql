-- ============================================================================
-- HOUSE OF ANGELS - VERIFICATION SYSTEM UPDATE
-- ============================================================================
-- This script updates the verification system to support the new policy
-- for both workers and employers with tier-based verification
-- ============================================================================

-- ============================================================================
-- 1. UPDATE VERIFICATION TABLE
-- ============================================================================

-- Drop existing verification table if needed and recreate with proper structure
-- Note: If you have existing data, backup first!

-- Add new columns to verification table
ALTER TABLE verification 
ADD COLUMN IF NOT EXISTS account_type TEXT CHECK (account_type IN ('employer', 'worker'));

ALTER TABLE verification
ADD COLUMN IF NOT EXISTS document_type TEXT;

ALTER TABLE verification
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE verification
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);

-- Update type column to support new verification types
-- For employers: 'id', 'sec_dti', 'business_permit', 'representative_id', 'address_proof'
-- For workers: 'id', 'face', 'credentials', 'address', 'background_check', 'skills_assessment'

COMMENT ON COLUMN verification.type IS 'Verification type: id, face, credentials, address, sec_dti, business_permit, representative_id, background_check, skills_assessment';
COMMENT ON COLUMN verification.account_type IS 'Account type: employer or worker';
COMMENT ON COLUMN verification.document_type IS 'Specific document type: passport, drivers_license, national_id, prc_id, sec_registration, dti_registration, business_permit, etc';

-- ============================================================================
-- 2. UPDATE EMPLOYERS TABLE FOR TIER SYSTEM
-- ============================================================================

-- Ensure tier column exists and has proper constraints
ALTER TABLE employers
ALTER COLUMN tier SET DEFAULT 'Basic';

-- Add verification level column
ALTER TABLE employers
ADD COLUMN IF NOT EXISTS verification_level TEXT CHECK (verification_level IN ('Basic', 'Verified', 'Enterprise')) DEFAULT 'Basic';

-- Add verification request status
ALTER TABLE employers
ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN ('none', 'pending', 'approved', 'rejected')) DEFAULT 'none';

-- Add verification requested date
ALTER TABLE employers
ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMPTZ;

-- Add verification approved date
ALTER TABLE employers
ADD COLUMN IF NOT EXISTS verification_approved_at TIMESTAMPTZ;

-- Add company type for enterprise verification
ALTER TABLE employers
ADD COLUMN IF NOT EXISTS company_type TEXT CHECK (company_type IN ('individual', 'company', 'agency', 'institution'));

-- Add registration documents
ALTER TABLE employers
ADD COLUMN IF NOT EXISTS sec_registration TEXT;

ALTER TABLE employers
ADD COLUMN IF NOT EXISTS dti_registration TEXT;

ALTER TABLE employers
ADD COLUMN IF NOT EXISTS business_permit TEXT;

-- ============================================================================
-- 3. UPDATE WORKERS TABLE FOR TIER SYSTEM
-- ============================================================================

-- Add tier column for workers
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('Basic', 'Verified', 'Premium')) DEFAULT 'Basic';

-- Add verification level column
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS verification_level TEXT CHECK (verification_level IN ('Basic', 'Verified', 'Premium')) DEFAULT 'Basic';

-- Add verification request status
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN ('none', 'pending', 'approved', 'rejected')) DEFAULT 'none';

-- Add verification requested date
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMPTZ;

-- Add verification approved date
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS verification_approved_at TIMESTAMPTZ;

-- Add last re-verification date (for Premium tier)
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS last_reverification_at TIMESTAMPTZ;

-- Add next re-verification due date (for Premium tier)
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS next_reverification_due TIMESTAMPTZ;

-- Add video reel path (for Premium tier)
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS video_reel_path TEXT;

-- Add video reel status
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS video_reel_status TEXT CHECK (video_reel_status IN ('none', 'pending', 'approved', 'rejected')) DEFAULT 'none';

-- ============================================================================
-- 4. CREATE EMPLOYER VERIFICATION REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS employer_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  requested_tier TEXT NOT NULL CHECK (requested_tier IN ('Basic', 'Verified', 'Enterprise')),
  current_tier TEXT NOT NULL DEFAULT 'Basic',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),

  -- Documents submitted
  id_document_path TEXT,
  id_document_type TEXT, -- passport, drivers_license, national_id, prc_id

  -- For Verified tier
  address_proof_path TEXT,

  -- For Enterprise tier
  sec_registration_path TEXT,
  dti_registration_path TEXT,
  business_permit_path TEXT,
  representative_id_path TEXT,

  -- Additional info
  company_type TEXT CHECK (company_type IN ('individual', 'company', 'agency', 'institution')),
  notes TEXT,

  -- Admin review
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_employer_verification_employer_id ON employer_verification_requests(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_verification_status ON employer_verification_requests(status);

-- ============================================================================
-- 5. CREATE WORKER VERIFICATION REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS worker_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  requested_tier TEXT NOT NULL CHECK (requested_tier IN ('Basic', 'Verified', 'Premium')),
  current_tier TEXT NOT NULL DEFAULT 'Basic',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),

  -- Basic tier documents
  id_document_path TEXT,
  id_document_type TEXT, -- passport, drivers_license, national_id, prc_id, voters_id

  -- Face verification (for Verified and Premium tiers)
  face_image_path TEXT,
  face_match_score NUMERIC, -- AI confidence score (0-100)
  liveness_check_passed BOOLEAN DEFAULT FALSE, -- For Premium tier

  -- Verified tier documents
  nbi_clearance_path TEXT,
  police_clearance_path TEXT,
  barangay_clearance_path TEXT,
  prc_certificate_path TEXT,
  tesda_certificate_path TEXT,

  -- Premium tier additional verification
  is_reverification BOOLEAN DEFAULT FALSE,
  previous_verification_id UUID REFERENCES worker_verification_requests(id),

  -- Video reel (Premium tier)
  video_reel_path TEXT,
  video_reel_status TEXT CHECK (video_reel_status IN ('none', 'pending', 'approved', 'rejected')) DEFAULT 'none',
  video_reel_rejection_reason TEXT,

  -- Manual verification tracking
  nbi_verified BOOLEAN DEFAULT FALSE,
  police_verified BOOLEAN DEFAULT FALSE,
  prc_verified BOOLEAN DEFAULT FALSE,
  tesda_verified BOOLEAN DEFAULT FALSE,

  -- Additional info
  notes TEXT,

  -- Admin review
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_worker_verification_worker_id ON worker_verification_requests(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_verification_tier ON worker_verification_requests(requested_tier);
CREATE INDEX IF NOT EXISTS idx_worker_verification_status ON worker_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_worker_verification_reverification ON worker_verification_requests(is_reverification);

-- ============================================================================
-- 6. CREATE VERIFICATION AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS verification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_request_id UUID NOT NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('employer', 'worker')),
  action TEXT NOT NULL CHECK (action IN ('submitted', 'under_review', 'approved', 'rejected', 'resubmitted', 'reverification_required')),
  performed_by UUID REFERENCES profiles(id),
  previous_status TEXT,
  new_status TEXT,
  previous_tier TEXT,
  new_tier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_audit_request_id ON verification_audit_log(verification_request_id);
CREATE INDEX IF NOT EXISTS idx_verification_audit_type ON verification_audit_log(verification_type);

-- ============================================================================
-- 7. CREATE WORKER VIDEO REELS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS worker_video_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  video_path TEXT NOT NULL,
  thumbnail_path TEXT,
  duration_seconds INTEGER,
  file_size_mb NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),

  -- Moderation
  moderated_by UUID REFERENCES profiles(id),
  moderated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  moderation_notes TEXT,

  -- Flags
  is_professional BOOLEAN DEFAULT TRUE,
  is_appropriate BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Only one active video per worker
  CONSTRAINT unique_active_video_per_worker UNIQUE (worker_id)
);

CREATE INDEX IF NOT EXISTS idx_video_reels_worker_id ON worker_video_reels(worker_id);
CREATE INDEX IF NOT EXISTS idx_video_reels_status ON worker_video_reels(status);

-- ============================================================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get employer verification status
CREATE OR REPLACE FUNCTION get_employer_verification_status(employer_uuid UUID)
RETURNS TABLE (
  tier TEXT,
  verification_level TEXT,
  has_pending_request BOOLEAN,
  can_upgrade BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.tier,
    e.verification_level,
    EXISTS (
      SELECT 1 FROM employer_verification_requests
      WHERE employer_id = employer_uuid AND status = 'pending'
    ) as has_pending_request,
    CASE
      WHEN e.verification_level = 'Basic' THEN TRUE
      WHEN e.verification_level = 'Verified' THEN TRUE
      ELSE FALSE
    END as can_upgrade
  FROM employers e
  WHERE e.id = employer_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get worker verification status
CREATE OR REPLACE FUNCTION get_worker_verification_status(worker_uuid UUID)
RETURNS TABLE (
  tier TEXT,
  verification_level TEXT,
  identity_verified BOOLEAN,
  background_verified BOOLEAN,
  skills_verified BOOLEAN,
  has_pending_request BOOLEAN,
  can_upgrade BOOLEAN,
  needs_reverification BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.tier,
    w.verification_level,
    COALESCE(v.identity, FALSE) as identity_verified,
    COALESCE(v.background, FALSE) as background_verified,
    COALESCE(v.skills, FALSE) as skills_verified,
    EXISTS (
      SELECT 1 FROM worker_verification_requests
      WHERE worker_id = worker_uuid AND status = 'pending'
    ) as has_pending_request,
    CASE
      WHEN w.verification_level = 'Basic' THEN TRUE
      WHEN w.verification_level = 'Verified' THEN TRUE
      ELSE FALSE
    END as can_upgrade,
    CASE
      WHEN w.verification_level = 'Premium' AND
           (w.next_reverification_due IS NULL OR w.next_reverification_due < NOW())
      THEN TRUE
      ELSE FALSE
    END as needs_reverification
  FROM workers w
  LEFT JOIN verifications v ON v.worker_id = w.id
  WHERE w.id = worker_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve employer verification
CREATE OR REPLACE FUNCTION approve_employer_verification(
  request_uuid UUID,
  admin_uuid UUID,
  admin_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_employer_id UUID;
  v_requested_tier TEXT;
  v_current_tier TEXT;
BEGIN
  -- Get request details
  SELECT employer_id, requested_tier, current_tier
  INTO v_employer_id, v_requested_tier, v_current_tier
  FROM employer_verification_requests
  WHERE id = request_uuid AND status = 'pending';

  IF v_employer_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Update request status
  UPDATE employer_verification_requests
  SET
    status = 'approved',
    reviewed_by = admin_uuid,
    reviewed_at = NOW(),
    admin_notes = admin_note,
    updated_at = NOW()
  WHERE id = request_uuid;

  -- Update employer tier and verification level
  UPDATE employers
  SET
    tier = v_requested_tier,
    verification_level = v_requested_tier,
    verification_status = 'approved',
    verification_approved_at = NOW(),
    verified = TRUE
  WHERE id = v_employer_id;

  -- Log the action
  INSERT INTO verification_audit_log (
    verification_request_id,
    verification_type,
    action,
    performed_by,
    previous_status,
    new_status,
    previous_tier,
    new_tier,
    notes
  ) VALUES (
    request_uuid,
    'employer',
    'approved',
    admin_uuid,
    'pending',
    'approved',
    v_current_tier,
    v_requested_tier,
    admin_note
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve worker verification
CREATE OR REPLACE FUNCTION approve_worker_verification(
  request_uuid UUID,
  admin_uuid UUID,
  admin_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_worker_id UUID;
  v_requested_tier TEXT;
  v_current_tier TEXT;
  v_is_reverification BOOLEAN;
BEGIN
  -- Get request details
  SELECT worker_id, requested_tier, current_tier, is_reverification
  INTO v_worker_id, v_requested_tier, v_current_tier, v_is_reverification
  FROM worker_verification_requests
  WHERE id = request_uuid AND status = 'pending';

  IF v_worker_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Update request status
  UPDATE worker_verification_requests
  SET
    status = 'approved',
    reviewed_by = admin_uuid,
    reviewed_at = NOW(),
    admin_notes = admin_note,
    updated_at = NOW()
  WHERE id = request_uuid;

  -- Update worker tier and verification level
  UPDATE workers
  SET
    tier = v_requested_tier,
    verification_level = v_requested_tier,
    verification_status = 'approved',
    verification_approved_at = NOW(),
    last_reverification_at = CASE WHEN v_is_reverification THEN NOW() ELSE last_reverification_at END,
    next_reverification_due = CASE
      WHEN v_requested_tier = 'Premium' THEN NOW() + INTERVAL '6 months'
      ELSE NULL
    END
  WHERE id = v_worker_id;

  -- Update verifications table based on tier
  IF v_requested_tier = 'Verified' OR v_requested_tier = 'Premium' THEN
    INSERT INTO verifications (worker_id, identity, background, skills)
    VALUES (v_worker_id, TRUE, TRUE, v_requested_tier = 'Premium')
    ON CONFLICT (worker_id)
    DO UPDATE SET
      identity = TRUE,
      background = TRUE,
      skills = CASE WHEN v_requested_tier = 'Premium' THEN TRUE ELSE verifications.skills END;
  END IF;

  -- Log the action
  INSERT INTO verification_audit_log (
    verification_request_id,
    verification_type,
    action,
    performed_by,
    previous_status,
    new_status,
    previous_tier,
    new_tier,
    notes
  ) VALUES (
    request_uuid,
    'worker',
    'approved',
    admin_uuid,
    'pending',
    'approved',
    v_current_tier,
    v_requested_tier,
    admin_note
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject verification
CREATE OR REPLACE FUNCTION reject_verification(
  request_uuid UUID,
  request_type TEXT, -- 'employer' or 'worker'
  admin_uuid UUID,
  reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  IF request_type = 'employer' THEN
    UPDATE employer_verification_requests
    SET 
      status = 'rejected',
      reviewed_by = admin_uuid,
      reviewed_at = NOW(),
      rejection_reason = reason,
      updated_at = NOW()
    WHERE id = request_uuid;
  ELSIF request_type = 'worker' THEN
    UPDATE worker_verification_requests
    SET 
      status = 'rejected',
      reviewed_by = admin_uuid,
      reviewed_at = NOW(),
      rejection_reason = reason,
      updated_at = NOW()
    WHERE id = request_uuid;
  ELSE
    RETURN FALSE;
  END IF;
  
  -- Log the action
  INSERT INTO verification_audit_log (
    verification_request_id,
    verification_type,
    action,
    performed_by,
    previous_status,
    new_status,
    notes
  ) VALUES (
    request_uuid,
    request_type,
    'rejected',
    admin_uuid,
    'pending',
    'rejected',
    reason
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. UPDATE TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employer_verification_requests_updated_at
  BEFORE UPDATE ON employer_verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_verification_requests_updated_at
  BEFORE UPDATE ON worker_verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_video_reels_updated_at
  BEFORE UPDATE ON worker_video_reels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. CREATE NOTIFICATION TRIGGERS
-- ============================================================================

-- Function to send notification when verification is approved/rejected
CREATE OR REPLACE FUNCTION notify_verification_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_account_type TEXT;
  v_tier TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Determine user ID and account type
  IF TG_TABLE_NAME = 'employer_verification_requests' THEN
    v_user_id := NEW.employer_id;
    v_account_type := 'employer';
    v_tier := NEW.requested_tier;
  ELSIF TG_TABLE_NAME = 'worker_verification_requests' THEN
    v_user_id := NEW.worker_id;
    v_account_type := 'worker';
    v_tier := NEW.requested_tier;
  ELSE
    RETURN NEW;
  END IF;

  -- Only send notification on status change to approved or rejected
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    v_notification_title := 'Verification Approved! 🎉';
    v_notification_message := 'Congratulations! Your ' || v_tier || ' tier verification has been approved. You now have access to all ' || v_tier || ' tier features.';

    INSERT INTO notifications (
      recipient_id,
      type,
      title,
      message,
      link,
      related_id
    ) VALUES (
      v_user_id,
      'verification',
      v_notification_title,
      v_notification_message,
      '/verification',
      NEW.id
    );
  ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    v_notification_title := 'Verification Rejected';
    v_notification_message := 'Your ' || v_tier || ' tier verification request has been rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'Please review your documents and try again.');

    INSERT INTO notifications (
      recipient_id,
      type,
      title,
      message,
      link,
      related_id
    ) VALUES (
      v_user_id,
      'verification',
      v_notification_title,
      v_notification_message,
      '/verification',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER employer_verification_status_notification
  AFTER UPDATE ON employer_verification_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_verification_status_change();

CREATE TRIGGER worker_verification_status_notification
  AFTER UPDATE ON worker_verification_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_verification_status_change();

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- 
-- Tables Created/Updated:
-- 1. verification - Updated with new columns for account_type and document_type
-- 2. employers - Added tier system columns and verification status
-- 3. employer_verification_requests - New table for employer tier upgrade requests
-- 4. worker_verification_requests - New table for worker verification requests
-- 5. verification_audit_log - Audit trail for all verification actions
--
-- Functions Created:
-- 1. get_employer_verification_status() - Check employer verification status
-- 2. get_worker_verification_status() - Check worker verification status
-- 3. approve_employer_verification() - Approve employer tier upgrade
-- 4. reject_verification() - Reject any verification request
--
-- Next Steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Update RLS policies for new tables (see supabase_verification_rls.sql)
-- 3. Update frontend verification center
-- 4. Update admin dashboard verification tab
-- ============================================================================

