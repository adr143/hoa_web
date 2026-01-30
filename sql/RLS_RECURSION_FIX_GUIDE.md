# 🔧 RLS Infinite Recursion Fix Guide

## ⚠️ The Problem

You're seeing this error:
```
Error fetching jobs: "infinite recursion detected in policy for relation \"profiles\""
```

This happens when RLS (Row Level Security) policies create a circular dependency by querying tables that have their own RLS policies.

---

## 🎯 The Solution

**Use `auth.jwt()` instead of querying the `profiles` table in RLS policies.**

### ❌ Bad (Causes Recursion)
```sql
CREATE POLICY "admin_policy" ON some_table
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

### ✅ Good (No Recursion)
```sql
CREATE POLICY "admin_policy" ON some_table
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );
```

---

## 🚀 Quick Fix (5 minutes)

### Step 1: Run the Fix Script

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste **`fix_all_rls_recursion.sql`** (this fixes EVERYTHING)
3. Click **"Run"**

This will:
- ✅ Fix the `profiles` table policy (root cause)
- ✅ Fix all verification table policies
- ✅ Drop all problematic RLS policies
- ✅ Recreate them without recursion
- ✅ Verify the policies were created successfully

### Step 2: Set Admin User Metadata (CRITICAL!)

For admin users to work with the new policies, you **MUST** set their metadata:

**Option A: Sync all admin users from profiles table (RECOMMENDED)**
```sql
-- Automatically set is_admin in metadata for all users who have is_admin = true in profiles
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE id IN (
  SELECT id FROM profiles WHERE is_admin = true
);
```

**Option B: Set for a specific user**
```sql
-- Set is_admin in user metadata for a specific email
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'your-admin@example.com';
```

**Option C: Using Supabase Dashboard**
1. Go to **Authentication** → **Users**
2. Click on the admin user
3. Scroll to **User Metadata**
4. Add: `"is_admin": true`
5. Click **Save**

### Step 3: Verify the Fix

Refresh your app and check if the error is gone. You should now be able to fetch jobs without the recursion error.

---

## 📋 What Was Changed

### Files Updated

1. **`supabase_verification_rls.sql`** - Updated all admin policies
2. **`fix_rls_recursion.sql`** - New script to fix existing installations

### Policies Fixed

All policies that were checking `profiles` table have been updated:

| Table | Policy | Change |
|-------|--------|--------|
| `employer_verification_requests` | Admin select/update | Now uses `auth.jwt()` |
| `worker_verification_requests` | Admin select/update | Now uses `auth.jwt()` |
| `verification_audit_log` | Admin select | Now uses `auth.jwt()` |
| `verification` | Admin select/update | Now uses `auth.jwt()` |
| `storage.objects` | Admin select | Now uses `auth.jwt()` |

---

## 🔍 Understanding the Fix

### Why Did This Happen?

1. **RLS policies on verification tables** checked the `profiles` table to verify admin status
2. **RLS policies on profiles table** might check other tables (jobs, workers, etc.)
3. **Circular dependency** created infinite recursion

### How Does `auth.jwt()` Fix It?

- `auth.jwt()` reads data directly from the JWT token
- No database queries = no RLS policies triggered
- No circular dependencies = no recursion

### What's in the JWT Token?

The JWT token contains:
```json
{
  "role": "authenticated",
  "user_metadata": {
    "is_admin": true,
    "name": "Admin User"
  }
}
```

We check:
- `auth.jwt() ->> 'role'` for the role field
- `auth.jwt() -> 'user_metadata' ->> 'is_admin'` for the is_admin flag

---

## 🧪 Testing the Fix

### Test 1: Regular User Access
```sql
-- Login as a regular user
-- Try to fetch jobs
SELECT * FROM jobs LIMIT 10;
-- Should work without errors
```

### Test 2: Admin Access
```sql
-- Login as an admin user
-- Try to view verification requests
SELECT * FROM employer_verification_requests;
-- Should work if user has is_admin = true in metadata
```

### Test 3: Verification Requests
```sql
-- Login as an employer
-- Try to create a verification request
INSERT INTO employer_verification_requests (
  employer_id, requested_tier, current_tier, status
) VALUES (
  auth.uid(), 'Verified', 'Basic', 'pending'
);
-- Should work without errors
```

---

## 🛠️ Troubleshooting

### Issue: "Admin can't access verification requests"

**Solution:** Make sure admin user has `is_admin = true` in their metadata:

```sql
-- Check current metadata
SELECT raw_user_meta_data FROM auth.users WHERE email = 'admin@example.com';

-- Set is_admin flag
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'admin@example.com';
```

### Issue: "Still getting recursion error"

**Solution:** Make sure you ran the fix script and refreshed your app:

1. Run `fix_rls_recursion.sql` in Supabase SQL Editor
2. Clear browser cache
3. Refresh the app
4. Check browser console for errors

### Issue: "Policies not found"

**Solution:** Verify policies were created:

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN (
  'employer_verification_requests',
  'worker_verification_requests',
  'verification_audit_log',
  'verification'
)
ORDER BY tablename, policyname;
```

---

## 📝 Best Practices for RLS Policies

### ✅ DO:
- Use `auth.jwt()` to check user roles
- Use `auth.uid()` to check user identity
- Keep policies simple and avoid complex queries
- Test policies with different user roles

### ❌ DON'T:
- Query other tables in RLS policies (causes recursion)
- Use complex subqueries (slow performance)
- Forget to enable RLS on new tables
- Mix authentication logic with business logic

---

## 🎉 Summary

**What was fixed:**
- ✅ Removed all queries to `profiles` table in RLS policies
- ✅ Now using `auth.jwt()` to check admin status directly from JWT token
- ✅ Simplified insert policies to only check `auth.uid()`
- ✅ Created fix script for existing installations

**What you need to do:**
1. ✅ Run `fix_rls_recursion.sql` in Supabase SQL Editor
2. ✅ Set `is_admin = true` in admin user metadata
3. ✅ Refresh your app and test

**Result:**
- ✅ No more infinite recursion errors
- ✅ Jobs and workers fetch correctly
- ✅ Admin verification system works
- ✅ All RLS policies function properly

---

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [JWT Token Structure](https://jwt.io/)

---

**🚀 You're all set! The recursion issue is fixed.**

