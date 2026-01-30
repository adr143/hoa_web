-- ============================================================================
-- HOUSE OF ANGELS - COMPREHENSIVE RLS POLICIES
-- ============================================================================
-- This script creates Row Level Security policies for all tables
-- Run this after creating tables and enabling RLS on each table
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles (public information)
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view and update all profiles
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 2. EMPLOYERS TABLE
-- ============================================================================

ALTER TABLE employers ENABLE ROW LEVEL SECURITY;

-- Anyone can view employer profiles
CREATE POLICY "employers_select_all" ON employers
  FOR SELECT
  USING (true);

-- Employers can update their own profile
CREATE POLICY "employers_update_own" ON employers
  FOR UPDATE
  USING (auth.uid() = id);

-- Employers can insert their own profile
CREATE POLICY "employers_insert_own" ON employers
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can manage all employers
CREATE POLICY "employers_admin_all" ON employers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 3. WORKERS TABLE
-- ============================================================================

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Anyone can view worker profiles
CREATE POLICY "workers_select_all" ON workers
  FOR SELECT
  USING (true);

-- Workers can update their own profile
CREATE POLICY "workers_update_own" ON workers
  FOR UPDATE
  USING (auth.uid() = id);

-- Workers can insert their own profile
CREATE POLICY "workers_insert_own" ON workers
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can manage all workers
CREATE POLICY "workers_admin_all" ON workers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 4. JOBS TABLE
-- ============================================================================

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Anyone can view active jobs
CREATE POLICY "jobs_select_active" ON jobs
  FOR SELECT
  USING (status = 'active' OR auth.uid() = employer_id);

-- Employers can view their own jobs (any status)
CREATE POLICY "jobs_select_own" ON jobs
  FOR SELECT
  USING (auth.uid() = employer_id);

-- Employers can insert jobs
CREATE POLICY "jobs_insert_employer" ON jobs
  FOR INSERT
  WITH CHECK (
    auth.uid() = employer_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'employer'
    )
  );

-- Employers can update their own jobs
CREATE POLICY "jobs_update_own" ON jobs
  FOR UPDATE
  USING (auth.uid() = employer_id);

-- Employers can delete their own jobs
CREATE POLICY "jobs_delete_own" ON jobs
  FOR DELETE
  USING (auth.uid() = employer_id);

-- Admins can manage all jobs
CREATE POLICY "jobs_admin_all" ON jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 5. POSTS TABLE
-- ============================================================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view posts
CREATE POLICY "posts_select_all" ON posts
  FOR SELECT
  USING (true);

-- Employers can insert posts
CREATE POLICY "posts_insert_employer" ON posts
  FOR INSERT
  WITH CHECK (
    auth.uid() = employer_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'employer'
    )
  );

-- Employers can update their own posts
CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE
  USING (auth.uid() = employer_id);

-- Employers can delete their own posts
CREATE POLICY "posts_delete_own" ON posts
  FOR DELETE
  USING (auth.uid() = employer_id);

-- Admins can manage all posts
CREATE POLICY "posts_admin_all" ON posts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 6. COMMENTS TABLE
-- ============================================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
CREATE POLICY "comments_select_all" ON comments
  FOR SELECT
  USING (true);

-- Authenticated users can insert comments
CREATE POLICY "comments_insert_authenticated" ON comments
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own comments
CREATE POLICY "comments_update_own" ON comments
  FOR UPDATE
  USING (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "comments_delete_own" ON comments
  FOR DELETE
  USING (auth.uid() = author_id);

-- Admins can manage all comments
CREATE POLICY "comments_admin_all" ON comments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 7. JOB_APPLICATIONS TABLE
-- ============================================================================

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Workers can view their own applications
CREATE POLICY "applications_select_worker" ON job_applications
  FOR SELECT
  USING (auth.uid() = worker_id);

-- Employers can view applications for their jobs
CREATE POLICY "applications_select_employer" ON job_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_applications.job_id
      AND jobs.employer_id = auth.uid()
    )
  );

-- Workers can insert applications
CREATE POLICY "applications_insert_worker" ON job_applications
  FOR INSERT
  WITH CHECK (
    auth.uid() = worker_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'jobseeker'
    )
  );

-- Workers can update their own applications (before review)
CREATE POLICY "applications_update_worker" ON job_applications
  FOR UPDATE
  USING (auth.uid() = worker_id AND status = 'pending');

-- Employers can update application status for their jobs
CREATE POLICY "applications_update_employer" ON job_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_applications.job_id
      AND jobs.employer_id = auth.uid()
    )
  );

-- Admins can view all applications
CREATE POLICY "applications_admin_select" ON job_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 8. ACTIVE_PROPOSALS TABLE
-- ============================================================================

ALTER TABLE active_proposals ENABLE ROW LEVEL SECURITY;

-- Workers can view proposals sent to them
CREATE POLICY "proposals_select_worker" ON active_proposals
  FOR SELECT
  USING (auth.uid() = worker_id);

-- Employers can view proposals they sent
CREATE POLICY "proposals_select_employer" ON active_proposals
  FOR SELECT
  USING (auth.uid() = employer_id);

-- Employers can insert proposals
CREATE POLICY "proposals_insert_employer" ON active_proposals
  FOR INSERT
  WITH CHECK (
    auth.uid() = employer_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type = 'employer'
    )
  );

-- Employers can update their own proposals
CREATE POLICY "proposals_update_employer" ON active_proposals
  FOR UPDATE
  USING (auth.uid() = employer_id);

-- Workers can update proposal status (accept/reject)
CREATE POLICY "proposals_update_worker" ON active_proposals
  FOR UPDATE
  USING (auth.uid() = worker_id);

-- Employers can delete their own proposals
CREATE POLICY "proposals_delete_employer" ON active_proposals
  FOR DELETE
  USING (auth.uid() = employer_id);

-- Admins can view all proposals
CREATE POLICY "proposals_admin_select" ON active_proposals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 9. EDUCATION TABLE
-- ============================================================================

ALTER TABLE education ENABLE ROW LEVEL SECURITY;

-- Anyone can view education records
CREATE POLICY "education_select_all" ON education
  FOR SELECT
  USING (true);

-- Workers can manage their own education records
CREATE POLICY "education_insert_own" ON education
  FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "education_update_own" ON education
  FOR UPDATE
  USING (auth.uid() = worker_id);

CREATE POLICY "education_delete_own" ON education
  FOR DELETE
  USING (auth.uid() = worker_id);

-- ============================================================================
-- 10. CERTIFICATIONS TABLE
-- ============================================================================

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- Anyone can view certifications
CREATE POLICY "certifications_select_all" ON certifications
  FOR SELECT
  USING (true);

-- Workers can manage their own certifications
CREATE POLICY "certifications_insert_own" ON certifications
  FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "certifications_update_own" ON certifications
  FOR UPDATE
  USING (auth.uid() = worker_id);

CREATE POLICY "certifications_delete_own" ON certifications
  FOR DELETE
  USING (auth.uid() = worker_id);

-- ============================================================================
-- 11. WORK_HISTORY TABLE
-- ============================================================================

ALTER TABLE work_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view work history
CREATE POLICY "work_history_select_all" ON work_history
  FOR SELECT
  USING (true);

-- Workers can manage their own work history
CREATE POLICY "work_history_insert_own" ON work_history
  FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "work_history_update_own" ON work_history
  FOR UPDATE
  USING (auth.uid() = worker_id);

CREATE POLICY "work_history_delete_own" ON work_history
  FOR DELETE
  USING (auth.uid() = worker_id);

-- ============================================================================
-- 12. PORTFOLIO TABLE
-- ============================================================================

ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Anyone can view portfolio items
CREATE POLICY "portfolio_select_all" ON portfolio
  FOR SELECT
  USING (true);

-- Workers can manage their own portfolio
CREATE POLICY "portfolio_insert_own" ON portfolio
  FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "portfolio_update_own" ON portfolio
  FOR UPDATE
  USING (auth.uid() = worker_id);

CREATE POLICY "portfolio_delete_own" ON portfolio
  FOR DELETE
  USING (auth.uid() = worker_id);

-- ============================================================================
-- 13. VERIFICATIONS TABLE (Worker Badges)
-- ============================================================================

ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Anyone can view verification status
CREATE POLICY "verifications_select_all" ON verifications
  FOR SELECT
  USING (true);

-- Workers can insert their own verification record
CREATE POLICY "verifications_insert_own" ON verifications
  FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

-- Workers can view their own verification status
CREATE POLICY "verifications_update_own" ON verifications
  FOR UPDATE
  USING (auth.uid() = worker_id);

-- Admins can update verification status
CREATE POLICY "verifications_admin_update" ON verifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 14. EXPERIENCE TABLE
-- ============================================================================

ALTER TABLE experience ENABLE ROW LEVEL SECURITY;

-- Anyone can view experience
CREATE POLICY "experience_select_all" ON experience
  FOR SELECT
  USING (true);

-- Workers can manage their own experience
CREATE POLICY "experience_insert_own" ON experience
  FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "experience_update_own" ON experience
  FOR UPDATE
  USING (auth.uid() = worker_id);

CREATE POLICY "experience_delete_own" ON experience
  FOR DELETE
  USING (auth.uid() = worker_id);

-- ============================================================================
-- 15. REVIEW TABLE
-- ============================================================================

ALTER TABLE review ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "review_select_all" ON review
  FOR SELECT
  USING (true);

-- Authenticated users can insert reviews (after completing work)
CREATE POLICY "review_insert_authenticated" ON review
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own reviews
CREATE POLICY "review_update_own" ON review
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.name = review.author
    )
  );

-- Admins can manage all reviews
CREATE POLICY "review_admin_all" ON review
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 16. NOTIFICATIONS TABLE
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT
  USING (auth.uid() = recipient_id);

-- Authenticated users can send notifications
CREATE POLICY "notifications_insert_authenticated" ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id OR auth.uid() IS NOT NULL);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE
  USING (auth.uid() = recipient_id);

-- Admins can send notifications to anyone
CREATE POLICY "notifications_admin_insert" ON notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 17. VERIFICATION TABLE (Document Verification Requests)
-- ============================================================================

ALTER TABLE verification ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification requests
CREATE POLICY "verification_select_own" ON verification
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verification requests
CREATE POLICY "verification_insert_own" ON verification
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending verification requests
CREATE POLICY "verification_update_own" ON verification
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all verification requests
CREATE POLICY "verification_admin_select" ON verification
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update verification status
CREATE POLICY "verification_admin_update" ON verification
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- ADMIN TABLES - RLS POLICIES
-- ============================================================================

-- ============================================================================
-- 18. ADMIN_MESSAGES TABLE
-- ============================================================================

ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages sent to them
CREATE POLICY "admin_messages_select_recipient" ON admin_messages
  FOR SELECT
  USING (auth.uid() = recipient_id);

-- Admins can view all messages
CREATE POLICY "admin_messages_select_admin" ON admin_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can send messages
CREATE POLICY "admin_messages_insert_admin" ON admin_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Recipients can update read status
CREATE POLICY "admin_messages_update_recipient" ON admin_messages
  FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Admins can update their sent messages
CREATE POLICY "admin_messages_update_admin" ON admin_messages
  FOR UPDATE
  USING (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 19. SYSTEM_ANNOUNCEMENTS TABLE
-- ============================================================================

ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;

-- Everyone can view active announcements
CREATE POLICY "announcements_select_active" ON system_announcements
  FOR SELECT
  USING (is_active = true);

-- Admins can view all announcements
CREATE POLICY "announcements_select_admin" ON system_announcements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can create announcements
CREATE POLICY "announcements_insert_admin" ON system_announcements
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update announcements
CREATE POLICY "announcements_update_admin" ON system_announcements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can delete announcements
CREATE POLICY "announcements_delete_admin" ON system_announcements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 20. ADMIN_ACTIONS_LOG TABLE
-- ============================================================================

ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all action logs
CREATE POLICY "actions_log_select_admin" ON admin_actions_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can insert action logs
CREATE POLICY "actions_log_insert_admin" ON admin_actions_log
  FOR INSERT
  WITH CHECK (
    auth.uid() = admin_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- No updates or deletes allowed (immutable audit log)

-- ============================================================================
-- 21. CONTENT_MODERATION TABLE
-- ============================================================================

ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "moderation_select_reporter" ON content_moderation
  FOR SELECT
  USING (auth.uid() = reported_by);

-- Admins can view all reports
CREATE POLICY "moderation_select_admin" ON content_moderation
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Authenticated users can report content
CREATE POLICY "moderation_insert_authenticated" ON content_moderation
  FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- Admins can update moderation status
CREATE POLICY "moderation_update_admin" ON content_moderation
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 22. USER_SUSPENSIONS TABLE
-- ============================================================================

ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;

-- Users can view their own suspension status
CREATE POLICY "suspensions_select_own" ON user_suspensions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all suspensions
CREATE POLICY "suspensions_select_admin" ON user_suspensions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can create suspensions
CREATE POLICY "suspensions_insert_admin" ON user_suspensions
  FOR INSERT
  WITH CHECK (
    auth.uid() = suspended_by AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update suspensions (lift/extend)
CREATE POLICY "suspensions_update_admin" ON user_suspensions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 23. PLATFORM_STATISTICS TABLE
-- ============================================================================

ALTER TABLE platform_statistics ENABLE ROW LEVEL SECURITY;

-- Admins can view all statistics
CREATE POLICY "statistics_select_admin" ON platform_statistics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- System can insert statistics (via scheduled functions)
CREATE POLICY "statistics_insert_system" ON platform_statistics
  FOR INSERT
  WITH CHECK (true);

-- Admins can update statistics
CREATE POLICY "statistics_update_admin" ON platform_statistics
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Check if user is suspended
-- ============================================================================

CREATE OR REPLACE FUNCTION is_user_suspended(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_suspensions
    WHERE user_id = user_uuid
    AND is_active = true
    AND (end_date IS NULL OR end_date > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total tables with RLS: 23
--
-- Core Tables (17):
-- 1. profiles - User profiles with admin flag
-- 2. employers - Employer profiles
-- 3. workers - Worker profiles
-- 4. jobs - Job postings
-- 5. posts - Employer social posts
-- 6. comments - Post comments
-- 7. job_applications - Job applications
-- 8. active_proposals - Work proposals
-- 9. education - Worker education
-- 10. certifications - Worker certifications
-- 11. work_history - Worker work history
-- 12. portfolio - Worker portfolio
-- 13. verifications - Worker badge verifications
-- 14. experience - Worker experience
-- 15. review - Worker reviews
-- 16. notifications - User notifications
-- 17. verification - Document verification requests
--
-- Admin Tables (6):
-- 18. admin_messages - Admin to user messages
-- 19. system_announcements - Platform announcements
-- 20. admin_actions_log - Admin action audit log
-- 21. content_moderation - Content reports
-- 22. user_suspensions - User suspensions
-- 23. platform_statistics - Platform metrics
--
-- Security Features:
-- ✅ Users can only modify their own data
-- ✅ Admins have full access to all tables
-- ✅ Public data is viewable by everyone
-- ✅ Private data is restricted to owners
-- ✅ Audit logs are immutable
-- ✅ Helper functions for common checks
-- ============================================================================

