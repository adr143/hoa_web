# House of Angels - Database Setup Instructions

## 🚀 Quick Setup Guide

Follow these steps to set up your database with admin functionality and security policies.

---

## Step 1: Run Admin Tables Script ✅

### What it does:
- Creates 6 new admin tables
- Adds indexes for performance
- Sets up triggers and functions
- Includes basic RLS policies

### How to run:

1. Open **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase_admin_tables.sql`
5. Paste into the editor
6. Click **Run** (or press `Ctrl+Enter`)

### Expected output:
```
Success. No rows returned
```

### Verify tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'admin_messages',
  'system_announcements',
  'admin_actions_log',
  'content_moderation',
  'user_suspensions',
  'platform_statistics'
);
```

**Expected result:** 6 rows returned

---

## Step 2: Run RLS Policies Script ✅

### What it does:
- Enables Row Level Security on all 23 tables
- Creates comprehensive security policies
- Adds helper functions for permission checks
- Ensures data privacy and security

### How to run:

1. Open **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase_rls_policies.sql`
5. Paste into the editor
6. Click **Run** (or press `Ctrl+Enter`)

### Expected output:
```
Success. No rows returned
```

### Verify RLS is enabled:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
```

**Expected result:** 23 rows returned (all tables have RLS enabled)

### Verify policies were created:
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Expected result:** Multiple policies per table

---

## Step 3: Set Up Admin User ✅

### Create your first admin:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

### Or use user ID:

```sql
-- Replace 'user-uuid-here' with your actual user ID
UPDATE profiles 
SET is_admin = true 
WHERE id = 'user-uuid-here';
```

### Verify admin status:

```sql
SELECT id, name, email, account_type, is_admin
FROM profiles
WHERE is_admin = true;
```

---

## Step 4: Test Admin Dashboard ✅

### Access the dashboard:

1. Sign in with your admin account
2. Navigate to: `http://localhost:3000/admin/dashboard`
3. You should see the admin dashboard with 6 tabs

### Test each feature:

#### Overview Tab
- ✅ View platform statistics
- ✅ See total users, employers, workers
- ✅ See total jobs and posts

#### Messaging Tab
- ✅ Search for users
- ✅ Select recipients
- ✅ Send test message
- ✅ Verify user receives notification

#### Announcements Tab
- ✅ Create test announcement
- ✅ Set type and audience
- ✅ Toggle active status

#### Jobs Tab
- ✅ View all job posts
- ✅ Toggle job status (active/inactive)
- ✅ Delete test job

#### Posts Tab
- ✅ View all employer posts
- ✅ Delete inappropriate content

#### Users Tab (Verification)
- ✅ View verification requests
- ✅ Approve/reject requests
- ✅ Send notifications to users

---

## Step 5: Verify Security ✅

### Test as regular user:

```sql
-- Set session as regular user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'regular-user-uuid';

-- These should work:
SELECT * FROM profiles WHERE id = 'regular-user-uuid';
SELECT * FROM jobs WHERE status = 'active';
SELECT * FROM notifications WHERE recipient_id = 'regular-user-uuid';

-- These should fail or return empty:
SELECT * FROM admin_actions_log; -- Should return empty
SELECT * FROM profiles WHERE id != 'regular-user-uuid'; -- Should work (public data)
UPDATE profiles SET is_admin = true WHERE id = 'regular-user-uuid'; -- Should fail
```

### Test as admin user:

```sql
-- Set session as admin user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'admin-user-uuid';

-- These should all work:
SELECT * FROM admin_messages;
SELECT * FROM admin_actions_log;
SELECT * FROM user_suspensions;
SELECT * FROM profiles;
UPDATE jobs SET status = 'inactive' WHERE id = 'any-job-id';
DELETE FROM posts WHERE id = 'any-post-id';
```

### Reset session:

```sql
RESET ROLE;
```

---

## 🔍 Troubleshooting

### Issue: "permission denied for table X"

**Solution:** Make sure RLS policies are created:
```sql
-- Check if policies exist for the table
SELECT policyname FROM pg_policies 
WHERE tablename = 'table_name';
```

If no policies exist, re-run `supabase_rls_policies.sql`

---

### Issue: "Admin dashboard shows 'Access Denied'"

**Solution:** Verify admin status:
```sql
SELECT id, name, is_admin FROM profiles WHERE id = auth.uid();
```

If `is_admin` is false, run:
```sql
UPDATE profiles SET is_admin = true WHERE id = 'your-user-id';
```

---

### Issue: "Cannot insert into admin_messages"

**Solution:** Check if you're authenticated and admin:
```sql
-- Check current user
SELECT auth.uid();

-- Check if current user is admin
SELECT is_admin FROM profiles WHERE id = auth.uid();
```

---

### Issue: "RLS policy prevents access"

**Solution:** Check which policies are blocking:
```sql
-- View all policies for a table
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'table_name';
```

---

## 📊 Database Statistics

### View table sizes:

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### View row counts:

```sql
SELECT 
  schemaname,
  tablename,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

### View index usage:

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## 🔐 Security Checklist

Before going to production, verify:

- [ ] RLS is enabled on all tables
- [ ] All tables have appropriate policies
- [ ] Admin users are properly set
- [ ] Test user cannot access admin data
- [ ] Admin user can access all data
- [ ] Audit logs are immutable
- [ ] Sensitive data is encrypted
- [ ] API keys are in environment variables
- [ ] Database backups are configured

---

## 📝 Maintenance Tasks

### Daily:
- Monitor admin_actions_log for suspicious activity
- Check platform_statistics for anomalies

### Weekly:
- Review content_moderation reports
- Check user_suspensions for expired bans
- Review system_announcements for outdated content

### Monthly:
- Audit admin users (remove inactive admins)
- Clean up old notifications
- Archive old admin_messages
- Review and optimize database indexes

---

## 🆘 Support

### Common Commands:

**View all tables:**
```sql
\dt
```

**Describe table structure:**
```sql
\d table_name
```

**View all policies:**
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

**View all functions:**
```sql
\df
```

**View all triggers:**
```sql
SELECT * FROM pg_trigger;
```

---

## ✅ Setup Complete!

Once you've completed all steps:

1. ✅ Admin tables created
2. ✅ RLS policies enabled
3. ✅ Admin user configured
4. ✅ Dashboard tested
5. ✅ Security verified

**Your House of Angels platform is now secure and ready for production!** 🎉

---

## 📚 Additional Resources

- **Database Schema:** See `DATABASE_ALIGNMENT_VERIFICATION.md`
- **Admin Features:** See `ADMIN_SYSTEM_README.md`
- **Implementation Details:** See `ADMIN_IMPLEMENTATION_SUMMARY.md`
- **Supabase Docs:** https://supabase.com/docs
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security

