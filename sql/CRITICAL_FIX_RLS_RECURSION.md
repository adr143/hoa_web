# 🚨 CRITICAL FIX: RLS Infinite Recursion

## ⚠️ THE PROBLEM

You're experiencing this error:
```
Error fetching jobs: "infinite recursion detected in policy for relation \"profiles\""
```

### Root Cause Identified ✅

The **`profiles` table** has a policy that queries itself:

```sql
-- ❌ THIS CAUSES INFINITE RECURSION
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles  -- ⚠️ Querying profiles from within profiles policy!
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

When any other table's policy checks the `profiles` table, it triggers this recursive policy, causing infinite recursion.

---

## ✅ THE SOLUTION

**Use `auth.jwt()` to check admin status directly from the JWT token instead of querying the database.**

This breaks the circular dependency because JWT token checks don't trigger any RLS policies.

---

## 🚀 QUICK FIX (5 MINUTES)

### **Step 1: Run the Complete Fix Script**

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste **`fix_all_rls_recursion.sql`**
3. Click **"Run"**

This script will:
- ✅ Fix the `profiles` table policy (root cause)
- ✅ Fix all verification table policies
- ✅ Remove all circular dependencies
- ✅ Verify the fix worked

### **Step 2: Sync Admin User Metadata** ⚠️ CRITICAL

Run this query to sync all admin users:

```sql
-- Sync is_admin from profiles table to user metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE id IN (
  SELECT id FROM profiles WHERE is_admin = true
);
```

### **Step 3: Verify the Fix**

```sql
-- Check if any policies still have recursion
SELECT tablename, policyname, 
  CASE 
    WHEN qual LIKE '%profiles%' AND tablename != 'profiles' THEN '⚠️ RECURSIVE'
    ELSE '✅ OK'
  END as status
FROM pg_policies
WHERE qual LIKE '%profiles%'
ORDER BY tablename, policyname;
```

### **Step 4: Refresh Your App**

1. Clear browser cache
2. Refresh the page
3. Test fetching jobs/workers
4. Error should be gone! ✅

---

## 📋 WHAT WAS FIXED

### 1. **Profiles Table Policy** (Root Cause)

**Before (Recursive):**
```sql
CREATE POLICY "profiles_admin_all" ON profiles
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

**After (No Recursion):**
```sql
CREATE POLICY "profiles_admin_all" ON profiles
  USING (
    (auth.jwt() ->> 'role')::text = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );
```

### 2. **All Verification Table Policies**

Fixed policies on:
- `employer_verification_requests`
- `worker_verification_requests`
- `verification_audit_log`
- `verification` table
- `storage.objects` (verification documents)

All now use `auth.jwt()` instead of querying `profiles`.

---

## 🔍 UNDERSTANDING THE FIX

### Why Did This Happen?

```
User fetches jobs
  ↓
Jobs query triggers RLS policy
  ↓
RLS policy checks profiles table
  ↓
Profiles table has RLS policy
  ↓
Profiles RLS policy checks profiles table (RECURSION!)
  ↓
Infinite loop → Error
```

### How Does auth.jwt() Fix It?

```
User fetches jobs
  ↓
Jobs query triggers RLS policy
  ↓
RLS policy checks auth.jwt() (JWT token)
  ↓
No database query = No RLS triggered
  ↓
No recursion → Success! ✅
```

### What's in the JWT Token?

```json
{
  "role": "authenticated",
  "user_metadata": {
    "is_admin": true,
    "name": "Admin User",
    "email": "admin@example.com"
  }
}
```

We check:
- `auth.jwt() ->> 'role'` → Gets the role field
- `auth.jwt() -> 'user_metadata' ->> 'is_admin'` → Gets the is_admin flag

---

## 🧪 TESTING THE FIX

### Test 1: Fetch Jobs (Regular User)
```typescript
// Should work without errors
const { data: jobs, error } = await supabase
  .from('jobs')
  .select('*')
  .limit(10);

console.log(error); // Should be null
console.log(jobs); // Should show jobs
```

### Test 2: Fetch Profiles (Regular User)
```typescript
// Should work without errors
const { data: profiles, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(10);

console.log(error); // Should be null
```

### Test 3: Admin Access (Admin User)
```typescript
// Should work if user has is_admin in metadata
const { data: requests, error } = await supabase
  .from('employer_verification_requests')
  .select('*');

console.log(error); // Should be null for admins
```

---

## 🛠️ TROUBLESHOOTING

### Issue: "Still getting recursion error"

**Solution:**
1. Make sure you ran `fix_all_rls_recursion.sql`
2. Clear browser cache completely
3. Refresh the app
4. Check browser console for the exact error

### Issue: "Admin can't access verification requests"

**Solution:** Admin user needs `is_admin` in their metadata:

```sql
-- Check if admin has metadata set
SELECT email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'your-admin@example.com';

-- If is_admin is not in metadata, set it:
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'your-admin@example.com';
```

### Issue: "Policies not found after running script"

**Solution:** Verify policies were created:

```sql
-- Check profiles policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Check verification policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename LIKE '%verification%';
```

### Issue: "Some users can't access their own data"

**Solution:** Make sure basic user policies still exist:

```sql
-- These should exist for regular users
SELECT policyname FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname IN ('profiles_select_all', 'profiles_update_own', 'profiles_insert_own');
```

---

## 📝 IMPORTANT NOTES

### 1. **profiles.is_admin Column**
- ✅ Can still be used for display purposes
- ✅ Can still be updated by admins
- ❌ Should NOT be used in RLS policies (causes recursion)

### 2. **User Metadata is_admin**
- ✅ Used by RLS policies (no recursion)
- ✅ Checked from JWT token (fast)
- ⚠️ Must be synced with profiles.is_admin

### 3. **Syncing is_admin**

When you set a user as admin in the profiles table, also update their metadata:

```sql
-- Set admin in profiles
UPDATE profiles SET is_admin = true WHERE email = 'user@example.com';

-- Sync to user metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'user@example.com';
```

Or create a trigger to auto-sync (optional):

```sql
CREATE OR REPLACE FUNCTION sync_admin_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin != OLD.is_admin THEN
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('is_admin', NEW.is_admin)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_admin_metadata
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_admin_to_metadata();
```

---

## 📊 FILES CREATED

| File | Purpose |
|------|---------|
| `fix_all_rls_recursion.sql` | **Main fix script - RUN THIS!** |
| `fix_profiles_rls_recursion.sql` | Fixes only profiles table |
| `fix_rls_recursion.sql` | Fixes only verification tables |
| `RLS_RECURSION_FIX_GUIDE.md` | Complete troubleshooting guide |
| `CRITICAL_FIX_RLS_RECURSION.md` | This file - quick reference |

---

## ✅ CHECKLIST

- [ ] Run `fix_all_rls_recursion.sql` in Supabase SQL Editor
- [ ] Sync admin users metadata (run the UPDATE query)
- [ ] Verify policies were created (run verification queries)
- [ ] Clear browser cache
- [ ] Refresh your app
- [ ] Test fetching jobs (should work)
- [ ] Test fetching profiles (should work)
- [ ] Test admin access (should work for admins)
- [ ] Check browser console (no errors)

---

## 🎉 SUMMARY

**The Problem:**
- ❌ `profiles` table policy was querying itself
- ❌ Created infinite recursion
- ❌ Broke all queries that check user permissions

**The Fix:**
- ✅ Use `auth.jwt()` instead of querying `profiles`
- ✅ No database queries = no recursion
- ✅ Faster performance (JWT check vs database query)

**What You Need to Do:**
1. ✅ Run `fix_all_rls_recursion.sql`
2. ✅ Sync admin user metadata
3. ✅ Refresh your app

**Result:**
- ✅ No more recursion errors
- ✅ Jobs fetch correctly
- ✅ Profiles fetch correctly
- ✅ Admin access works
- ✅ All RLS policies function properly

---

**🚀 Run the fix script now and the error will be gone!**

