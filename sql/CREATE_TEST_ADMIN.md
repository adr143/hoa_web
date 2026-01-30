# 🚀 Quick Start: Create Test Admin Account

## ⚠️ Important Security Note

The admin login page (`/admin/login`) is a **hidden portal** that is not publicly advertised or linked from the user interface. Admin accounts can only be created via:
- Direct invitation by existing admins
- SQL promotion of existing users
- Manual setup in Supabase

**Do not share the admin login URL publicly.**

---

## Step-by-Step Instructions

### **Step 1: Run SQL Setup Script**

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire `setup_admin_accounts.sql` file
4. Click **"Run"**

---

### **Step 2: Create Admin User in Supabase Auth**

1. Go to **Authentication** → **Users**
2. Click **"Add user"**
3. Fill in:
   - **Email:** `admin@houseofangels.ph`
   - **Password:** `Admin@123456`
   - **Auto Confirm User:** ✅ (check this box)
4. Click **"Create user"**
5. **Copy the user's UUID** (you'll need this)

---

### **Step 3: Promote User to Admin**

Go back to **SQL Editor** and run:

```sql
-- Promote the user to admin
SELECT promote_user_to_admin('admin@houseofangels.ph');
```

---

### **Step 4: Verify Admin Account**

```sql
-- Check if admin was created successfully
SELECT * FROM list_all_admins();
```

You should see:
- ID: (the UUID you copied)
- Name: (empty or default)
- Email: admin@houseofangels.ph
- Created at: (timestamp)

---

### **Step 5: Update Admin Profile Name (Optional)**

```sql
-- Set a name for the admin
UPDATE profiles
SET name = 'System Administrator'
WHERE email = 'admin@houseofangels.ph';
```

---

### **Step 6: Test Admin Login**

1. Open your app
2. Go to `/admin/login`
3. Sign in with:
   - **Email:** `admin@houseofangels.ph`
   - **Password:** `Admin@123456`
4. You should be redirected to `/admin/dashboard`

---

## ✅ Success Checklist

- [ ] SQL setup script executed successfully
- [ ] Admin user created in Supabase Auth
- [ ] User promoted to admin using function
- [ ] Admin appears in `list_all_admins()` query
- [ ] Can login at `/admin/login`
- [ ] Redirected to `/admin/dashboard` after login
- [ ] Cannot login at `/signin` (user login page)

---

## 🔧 Troubleshooting

### **Problem: "User with email not found"**

**Solution:** Make sure you created the user in Supabase Auth first (Step 2)

---

### **Problem: "Invalid email or password"**

**Solution:** 
1. Check if you're using the correct credentials
2. Verify the user was created in Supabase Auth
3. Check if email confirmation is required

---

### **Problem: "This account does not have admin privileges"**

**Solution:** Run the promotion function again:
```sql
SELECT promote_user_to_admin('admin@houseofangels.ph');
```

---

### **Problem: Can't access admin dashboard**

**Solution:** Check if `is_admin` flag is set:
```sql
SELECT id, name, email, is_admin, account_type
FROM profiles
WHERE email = 'admin@houseofangels.ph';
```

Should show:
- `is_admin: true`
- `account_type: 'admin'`

If not, run:
```sql
UPDATE profiles
SET is_admin = true, account_type = 'admin'
WHERE email = 'admin@houseofangels.ph';
```

---

## 🔐 Security Reminder

**⚠️ IMPORTANT: Change the default password immediately!**

After first login:
1. Go to Supabase Dashboard → Authentication → Users
2. Find the admin user
3. Click "..." → "Reset Password"
4. Set a strong, unique password

**Recommended password requirements:**
- At least 12 characters
- Mix of uppercase and lowercase
- Numbers and special characters
- Not used anywhere else

---

## 📝 Quick Reference

### **Test Admin Credentials**
```
Email: admin@houseofangels.ph
Password: Admin@123456
Login URL: /admin/login
```

### **Useful SQL Queries**

**List all admins:**
```sql
SELECT * FROM list_all_admins();
```

**Check admin status:**
```sql
SELECT id, name, email, is_admin, account_type
FROM profiles
WHERE email = 'admin@houseofangels.ph';
```

**View recent admin activity:**
```sql
SELECT * FROM admin_activity_log
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 Next Steps

After creating your test admin:

1. **Change the password** (see Security Reminder above)
2. **Create additional admins** if needed:
   ```sql
   SELECT promote_user_to_admin('another-admin@example.com');
   ```
3. **Test admin features:**
   - View dashboard
   - Manage users
   - Approve verifications
   - View analytics
4. **Set up production admin accounts** with strong passwords

---

## 📚 Additional Resources

- **Full Guide:** See `ADMIN_SETUP_GUIDE.md`
- **SQL Script:** See `setup_admin_accounts.sql`
- **Admin Login Page:** `/admin/login`
- **User Login Page:** `/signin`

---

**That's it! Your test admin account is ready to use.** 🎉

