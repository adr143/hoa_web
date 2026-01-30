# 🔐 Admin Account Setup Guide

## Overview

This guide explains how to set up and manage admin accounts for the House of Angels platform. Admin accounts have separate login and full access to the admin dashboard.

---

## 🎯 Key Features

### **Separate Login Systems**
- ✅ **User Login** (`/signin`) - For employers and workers only
- ✅ **Admin Login** (`/admin/login`) - Hidden portal for administrators only
- ✅ Automatic redirection based on account type
- ✅ Security warnings and access logging
- ✅ Admin login URL is not publicly advertised (secret/hidden)
- ✅ Admin accounts created via invitation or promotion only

### **Admin Account Management**
- ✅ Promote existing users to admin
- ✅ Revoke admin access
- ✅ List all admins
- ✅ Admin activity logging
- ✅ Tied to `auth.users` table

---

## 🚀 Quick Start: Create Your First Admin Account

### **Method 1: Using Supabase Dashboard (Recommended)**

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **Authentication** → **Users**

2. **Create New User**
   - Click **"Add user"**
   - Enter email: `admin@houseofangels.ph`
   - Enter password: `Admin@123456` (change this!)
   - Click **"Create user"**
   - Copy the user's UUID

3. **Run SQL Script**
   - Go to **SQL Editor**
   - Run the following:
   ```sql
   -- First, run the setup script
   -- (Copy and paste the entire setup_admin_accounts.sql file)
   
   -- Then promote the user to admin
   SELECT promote_user_to_admin('admin@houseofangels.ph');
   ```

4. **Verify Admin Account**
   ```sql
   SELECT * FROM list_all_admins();
   ```

5. **Test Login**
   - Go to `/admin/login`
   - Sign in with the admin credentials
   - You should be redirected to `/admin/dashboard`

---

### **Method 2: Using Supabase API**

```javascript
// 1. Create auth user
const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin@houseofangels.ph',
  password: 'Admin@123456',
  email_confirm: true
});

// 2. Get the user ID
const userId = data.user.id;

// 3. Create profile
await supabase.from('profiles').insert({
  id: userId,
  name: 'Admin User',
  account_type: 'admin',
  is_admin: true
});

// 4. Update auth metadata
await supabase.auth.admin.updateUserById(userId, {
  user_metadata: { is_admin: true }
});
```

---

## 📋 How to Add More Admin Accounts

### **Option 1: Promote Existing User**

If you have an existing user who needs admin access:

```sql
-- Promote user by email
SELECT promote_user_to_admin('user@example.com');

-- Verify
SELECT * FROM list_all_admins();
```

### **Option 2: Create New Admin User**

1. **Create user in Supabase Auth** (via Dashboard or API)
2. **Run promotion function:**
   ```sql
   SELECT promote_user_to_admin('newadmin@houseofangels.ph');
   ```

---

## 🔧 Admin Management Functions

### **1. Promote User to Admin**

```sql
SELECT promote_user_to_admin('user@example.com');
```

**What it does:**
- Sets `is_admin = true` in profiles table
- Sets `account_type = 'admin'` in profiles table
- Adds `is_admin: true` to auth user metadata
- Updates `updated_at` timestamp

---

### **2. Revoke Admin Access**

```sql
SELECT revoke_admin_access('admin@example.com');
```

**What it does:**
- Sets `is_admin = false` in profiles table
- Removes admin flag from auth user metadata
- User can no longer access admin portal

---

### **3. List All Admins**

```sql
SELECT * FROM list_all_admins();
```

**Returns:**
- Admin ID
- Name
- Email
- Account creation date
- Last sign-in date

---

### **4. Log Admin Actions**

```sql
SELECT log_admin_action(
  'admin-uuid',                    -- Admin's user ID
  'approved_verification',         -- Action performed
  'verification',                  -- Target type
  'verification-request-uuid',     -- Target ID
  '{"tier": "Verified"}'::jsonb   -- Additional details
);
```

**Use this to track:**
- Verification approvals/rejections
- User suspensions
- Content moderation actions
- System configuration changes

---

### **5. View Admin Activity**

```sql
SELECT 
  aal.*,
  p.name as admin_name,
  au.email as admin_email
FROM admin_activity_log aal
JOIN profiles p ON aal.admin_id = p.id
JOIN auth.users au ON p.id = au.id
ORDER BY aal.created_at DESC
LIMIT 50;
```

---

## 🔒 Security Features

### **1. Separate Login Pages**

**User Login** (`/signin`):
- Only for employers and workers
- Redirects admins to `/admin/login`
- Shows message: "If you are an admin, please use the admin login page"

**Admin Login** (`/admin/login`):
- Only for administrators
- Dark theme with red accents
- Security warning displayed
- All login attempts logged

### **2. Access Control**

- Admin dashboard checks `user.is_admin` flag
- Non-admins are redirected to home page
- RLS policies use `auth.jwt()` to check admin status
- No database queries in RLS policies (prevents recursion)

### **3. Activity Logging**

All admin actions are logged in `admin_activity_log` table:
- Who performed the action
- What action was performed
- When it was performed
- Target of the action
- Additional details (JSON)

---

## 🎨 UI/UX Differences

### **User Login Page**
- Teal color scheme
- "Sign In to House of Angels" heading
- Account type selection (Employer/Worker)
- No mention of admin login (kept secret)

### **Admin Login Page**
- Dark background with red accents
- Shield icon badge
- "Admin Portal" heading
- "Authorized Personnel Only" warning
- Security notice
- No link to user login (hidden portal)
- URL must be accessed directly: `/admin/login`

---

## 📊 Database Schema

### **profiles Table**
```sql
- id: UUID (references auth.users)
- name: TEXT
- email: TEXT
- account_type: TEXT ('employer', 'jobseeker', 'admin')
- is_admin: BOOLEAN (default: false)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### **auth.users Table**
```sql
- id: UUID
- email: TEXT
- raw_user_meta_data: JSONB
  - is_admin: BOOLEAN
```

### **admin_activity_log Table**
```sql
- id: UUID
- admin_id: UUID (references profiles)
- action: TEXT
- target_type: TEXT
- target_id: UUID
- details: JSONB
- ip_address: TEXT
- user_agent: TEXT
- created_at: TIMESTAMPTZ
```

---

## ✅ Testing Checklist

- [ ] Run `setup_admin_accounts.sql` in Supabase
- [ ] Create test admin account
- [ ] Promote user to admin using function
- [ ] Test admin login at `/admin/login`
- [ ] Verify redirect to `/admin/dashboard`
- [ ] Test user login at `/signin`
- [ ] Verify admin cannot login at `/signin`
- [ ] Test revoke admin access
- [ ] View admin activity logs
- [ ] Test RLS policies

---

## 🚨 Important Security Notes

### **DO:**
✅ Use strong, unique passwords for admin accounts
✅ Enable 2FA for admin accounts (in Supabase Auth settings)
✅ Regularly review admin activity logs
✅ Limit the number of admin accounts
✅ Revoke admin access when no longer needed
✅ Use environment-specific admin accounts (dev, staging, prod)
✅ Change default passwords immediately

### **DON'T:**
❌ Share admin credentials
❌ Use weak passwords
❌ Commit admin credentials to version control
❌ Give admin access to untrusted users
❌ Use the same password across environments
❌ Leave unused admin accounts active

---

## 🔄 Common Tasks

### **Change Admin Password**

```sql
-- In Supabase Dashboard:
-- Go to Authentication → Users
-- Find the admin user
-- Click "..." → "Reset Password"
-- Or use SQL:

UPDATE auth.users
SET encrypted_password = crypt('new-password', gen_salt('bf'))
WHERE email = 'admin@houseofangels.ph';
```

### **Check if User is Admin**

```sql
SELECT 
  p.id,
  p.name,
  p.email,
  p.is_admin,
  p.account_type,
  au.raw_user_meta_data->>'is_admin' as jwt_is_admin
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.email = 'user@example.com';
```

### **Bulk Promote Multiple Users**

```sql
-- Promote multiple users at once
DO $$
DECLARE
  admin_email TEXT;
BEGIN
  FOREACH admin_email IN ARRAY ARRAY[
    'admin1@houseofangels.ph',
    'admin2@houseofangels.ph',
    'admin3@houseofangels.ph'
  ]
  LOOP
    PERFORM promote_user_to_admin(admin_email);
    RAISE NOTICE 'Promoted: %', admin_email;
  END LOOP;
END $$;
```

---

## 📞 Support

If you encounter issues:

1. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs
   - Look for authentication errors

2. **Verify RLS Policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

3. **Check Admin Status:**
   ```sql
   SELECT * FROM list_all_admins();
   ```

4. **Contact Support:**
   - Email: support@houseofangels.ph
   - Include error messages and screenshots

---

## 🎉 Summary

**What Was Implemented:**
✅ Separate admin login page (`/admin/login`)
✅ Updated user login page (`/signin`)
✅ Admin promotion/revocation functions
✅ Admin activity logging system
✅ Security features and access control
✅ Comprehensive SQL setup script
✅ Admin management functions

**Files Created:**
- `src/app/admin/login/page.tsx` - Admin login page
- `setup_admin_accounts.sql` - SQL setup script
- `ADMIN_SETUP_GUIDE.md` - This guide

**Files Modified:**
- `src/app/signin/page.tsx` - Added admin redirect and link

**Ready for:**
- Creating admin accounts
- Testing admin login
- Managing admin access
- Production deployment

---

**Need Help?** Follow the Quick Start guide above or contact support!

