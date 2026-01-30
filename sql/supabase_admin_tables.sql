-- =====================================================
-- HOUSE OF ANGELS - ADMIN SYSTEM DATABASE TABLES
-- Run this script in Supabase SQL Editor
-- =====================================================

-- 1. Admin Messages Table
-- Stores messages sent by admins to users
CREATE TABLE IF NOT EXISTS admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'general' CHECK (message_type IN ('general', 'warning', 'announcement', 'system', 'verification', 'violation')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. System Announcements Table
-- For platform-wide announcements
CREATE TABLE IF NOT EXISTS system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type VARCHAR(50) DEFAULT 'info' CHECK (announcement_type IN ('info', 'warning', 'maintenance', 'feature', 'policy')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'employers', 'workers', 'verified_only')),
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Admin Actions Log Table
-- Tracks all admin actions for audit purposes
CREATE TABLE IF NOT EXISTS admin_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('user', 'job', 'post', 'worker', 'employer', 'application', 'review', 'system')),
  target_id UUID,
  description TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. Content Moderation Table
-- For flagged/reported content
CREATE TABLE IF NOT EXISTS content_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('job', 'post', 'comment', 'review', 'profile', 'message')),
  content_id UUID NOT NULL,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'removed', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 5. User Suspensions Table
-- Track user suspensions and bans
CREATE TABLE IF NOT EXISTS user_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  suspended_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  suspension_type VARCHAR(50) DEFAULT 'temporary' CHECK (suspension_type IN ('warning', 'temporary', 'permanent')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lifted_at TIMESTAMP WITH TIME ZONE,
  lifted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 6. Platform Statistics Table
-- Store daily/weekly/monthly platform statistics
CREATE TABLE IF NOT EXISTS platform_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  total_employers INTEGER DEFAULT 0,
  new_employers INTEGER DEFAULT 0,
  total_workers INTEGER DEFAULT 0,
  new_workers INTEGER DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  new_jobs INTEGER DEFAULT 0,
  total_applications INTEGER DEFAULT 0,
  new_applications INTEGER DEFAULT 0,
  active_jobs INTEGER DEFAULT 0,
  filled_jobs INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  new_posts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Admin Messages Indexes
CREATE INDEX IF NOT EXISTS idx_admin_messages_recipient ON admin_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_sender ON admin_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_read ON admin_messages(read);
CREATE INDEX IF NOT EXISTS idx_admin_messages_created ON admin_messages(created_at DESC);

-- System Announcements Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_active ON system_announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON system_announcements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON system_announcements(target_audience);

-- Admin Actions Log Indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions_log(created_at DESC);

-- Content Moderation Indexes
CREATE INDEX IF NOT EXISTS idx_moderation_status ON content_moderation(status);
CREATE INDEX IF NOT EXISTS idx_moderation_content ON content_moderation(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_created ON content_moderation(created_at DESC);

-- User Suspensions Indexes
CREATE INDEX IF NOT EXISTS idx_suspensions_user ON user_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_suspensions_active ON user_suspensions(is_active);
CREATE INDEX IF NOT EXISTS idx_suspensions_dates ON user_suspensions(start_date, end_date);

-- Platform Statistics Indexes
CREATE INDEX IF NOT EXISTS idx_statistics_date ON platform_statistics(stat_date DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_statistics ENABLE ROW LEVEL SECURITY;

-- Admin Messages Policies
CREATE POLICY "Admins can view all messages" ON admin_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

CREATE POLICY "Admins can send messages" ON admin_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

CREATE POLICY "Users can view their own messages" ON admin_messages
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own messages" ON admin_messages
  FOR UPDATE USING (recipient_id = auth.uid());

-- System Announcements Policies
CREATE POLICY "Everyone can view active announcements" ON system_announcements
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage announcements" ON system_announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

-- Admin Actions Log Policies
CREATE POLICY "Admins can view action logs" ON admin_actions_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

CREATE POLICY "Admins can create action logs" ON admin_actions_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

-- Content Moderation Policies
CREATE POLICY "Users can report content" ON content_moderation
  FOR INSERT WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Admins can manage moderation" ON content_moderation
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

-- User Suspensions Policies
CREATE POLICY "Admins can manage suspensions" ON user_suspensions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

CREATE POLICY "Users can view their own suspensions" ON user_suspensions
  FOR SELECT USING (user_id = auth.uid());

-- Platform Statistics Policies
CREATE POLICY "Admins can view statistics" ON platform_statistics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

CREATE POLICY "Admins can manage statistics" ON platform_statistics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for system_announcements
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON system_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log admin actions automatically
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO admin_actions_log (admin_id, action_type, target_type, target_id, description, old_value, new_value)
    VALUES (
      auth.uid(),
      TG_TABLE_NAME || '_update',
      TG_TABLE_NAME,
      NEW.id,
      'Updated ' || TG_TABLE_NAME,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO admin_actions_log (admin_id, action_type, target_type, target_id, description, old_value)
    VALUES (
      auth.uid(),
      TG_TABLE_NAME || '_delete',
      TG_TABLE_NAME,
      OLD.id,
      'Deleted ' || TG_TABLE_NAME,
      to_jsonb(OLD)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON admin_messages TO authenticated;
GRANT SELECT ON system_announcements TO authenticated;
GRANT SELECT, INSERT ON content_moderation TO authenticated;
GRANT SELECT ON user_suspensions TO authenticated;

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- Insert initial platform statistics for today
INSERT INTO platform_statistics (stat_date)
VALUES (CURRENT_DATE)
ON CONFLICT (stat_date) DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Admin system tables created successfully!';
  RAISE NOTICE 'Tables created: admin_messages, system_announcements, admin_actions_log, content_moderation, user_suspensions, platform_statistics';
  RAISE NOTICE 'All indexes, RLS policies, and triggers have been set up.';
END $$;

