# Verification System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Run Database Scripts (REQUIRED)

1. **Open Supabase Dashboard** → SQL Editor

2. **Copy and paste `supabase_verification_system.sql`** → Click "Run"
   - This creates all tables, columns, functions, and triggers
   - Takes ~30 seconds to complete

3. **Copy and paste `supabase_verification_rls.sql`** → Click "Run"
   - This sets up security policies
   - Takes ~10 seconds to complete

4. **Verify installation:**
   ```sql
   -- Should return 4 tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'employer_verification_requests',
     'worker_verification_requests',
     'worker_video_reels',
     'verification_audit_log'
   );
   ```

### Step 2: Test the System

1. **Set yourself as admin** (if not already):
   ```sql
   UPDATE profiles 
   SET is_admin = true 
   WHERE email = 'your-email@example.com';
   ```

2. **Navigate to `/verification` in your app**
   - You should see the verification center
   - Select a tier to upgrade
   - Upload required documents

3. **Navigate to `/admin/dashboard`**
   - Go to "Verifications" tab (you'll need to implement this)
   - Review pending verification requests
   - Approve or reject requests

---

## 📋 What Was Created

### Database Tables

1. **`employer_verification_requests`**
   - Tracks employer tier upgrade requests
   - Stores uploaded documents (ID, address proof, business docs)
   - Status: pending, approved, rejected, under_review

2. **`worker_verification_requests`**
   - Tracks worker tier upgrade requests
   - Stores uploaded documents (ID, face, clearances, certificates)
   - Includes face match score and liveness check
   - Tracks re-verification for Premium tier

3. **`worker_video_reels`**
   - Stores Premium worker video reels
   - Moderation status and notes
   - One active video per worker

4. **`verification_audit_log`**
   - Immutable audit trail
   - Tracks all verification actions
   - Who approved/rejected and when

### Database Functions

1. **`get_employer_verification_status(employer_uuid)`**
   - Returns current tier, verification level, pending requests

2. **`get_worker_verification_status(worker_uuid)`**
   - Returns current tier, verification badges, re-verification status

3. **`approve_employer_verification(request_uuid, admin_uuid, notes)`**
   - Approves employer verification
   - Updates tier and verification level
   - Sends notification to employer
   - Logs action in audit trail

4. **`approve_worker_verification(request_uuid, admin_uuid, notes)`**
   - Approves worker verification
   - Updates tier and verification level
   - Sets re-verification date for Premium tier
   - Updates verifications table (identity, background, skills badges)
   - Sends notification to worker
   - Logs action in audit trail

5. **`reject_verification(request_uuid, type, admin_uuid, reason)`**
   - Rejects any verification request
   - Sends notification with rejection reason
   - Logs action in audit trail

### Automatic Triggers

1. **Auto-update `updated_at` timestamps**
   - Automatically updates when records change

2. **Auto-send notifications**
   - Sends notification when verification is approved
   - Sends notification when verification is rejected
   - Includes rejection reason in notification

---

## 🎨 Tier System Overview

### Employer Tiers

| Tier | Verification | Features |
|------|-------------|----------|
| **Basic** (Free) | Government ID | 2 job listings, limited access |
| **Verified** (Paid) | ID + Address (optional) | 10 listings, messaging, AI matching, badge |
| **Enterprise** (Custom) | Company docs + Permit | Unlimited listings, multi-user, analytics |

### Worker Tiers

| Tier | Verification | Features |
|------|-------------|----------|
| **Basic** (Free) | Government ID | 3 job categories, limited visibility |
| **Verified** (Paid) | ID + Face + Clearances | Verified badge, enhanced visibility, ratings |
| **Premium** (Paid) | All Verified + Video + Liveness | Top Worker badge, featured, analytics, re-verify every 6 months |

---

## 📁 Files Created

### SQL Scripts (Run these first!)
- ✅ `supabase_verification_system.sql` - Database schema (665 lines)
- ✅ `supabase_verification_rls.sql` - Security policies (265 lines)

### TypeScript Types
- ✅ `src/types/verification.ts` - All verification types and interfaces (300 lines)

### Frontend Components
- ✅ `src/app/verification/page.tsx` - Verification center (placeholder)
- ⏳ `src/components/verification/EmployerVerificationFlow.tsx` - **TODO: Create this**
- ⏳ `src/components/verification/WorkerVerificationFlow.tsx` - **TODO: Create this**

### Documentation
- ✅ `VERIFICATION_SYSTEM_IMPLEMENTATION_GUIDE.md` - Complete implementation guide
- ✅ `VERIFICATION_QUICK_START.md` - This file

---

## ⚠️ Important Notes

### Document Storage

All verification documents are stored in Supabase Storage:
- **Bucket name:** `verification-documents`
- **Folder structure:** `{account_type}/{user_id}/{document_type}/{filename}`
- **Examples:**
  - `employer/abc123/id_document/passport.jpg`
  - `worker/xyz789/face/face_image.png`
  - `worker/xyz789/nbi_clearance/nbi.pdf`
  - `worker/xyz789/video_reel/intro.mp4`

### Security

- ✅ RLS policies ensure users can only access their own documents
- ✅ Admins can access all documents for review
- ✅ Audit log is immutable (no updates or deletes)
- ✅ All verification actions are logged

### Notifications

- ✅ Automatic notifications sent on approval/rejection
- ✅ Notifications include tier information
- ✅ Rejection notifications include reason
- ✅ Notifications link to `/verification` page

---

## 🔧 Next Steps

### 1. Run SQL Scripts (5 minutes)
```
✅ Run supabase_verification_system.sql
✅ Run supabase_verification_rls.sql
✅ Verify tables created
```

### 2. Create Frontend Components (2-3 hours)
```
⏳ Create EmployerVerificationFlow component
⏳ Create WorkerVerificationFlow component
⏳ Implement document upload
⏳ Implement face capture (for workers)
⏳ Implement video upload (for Premium workers)
```

### 3. Update Admin Dashboard (1-2 hours)
```
⏳ Replace "Users" tab with "Verifications" tab
⏳ Fetch pending verification requests
⏳ Display document previews
⏳ Implement approve/reject actions
⏳ Show verification history
```

### 4. Test Everything (1 hour)
```
⏳ Test employer Basic tier verification
⏳ Test employer Verified tier verification
⏳ Test employer Enterprise tier verification
⏳ Test worker Basic tier verification
⏳ Test worker Verified tier verification
⏳ Test worker Premium tier verification
⏳ Test admin approval/rejection
⏳ Test notifications
⏳ Test tier updates
```

---

## 💡 Tips

1. **Start with Basic tier** - Test the simplest flow first (just ID upload)
2. **Use test documents** - Create fake IDs/clearances for testing
3. **Check Supabase logs** - Monitor for errors during testing
4. **Test RLS policies** - Make sure users can't see other users' documents
5. **Test notifications** - Verify users receive approval/rejection notifications

---

## 🆘 Troubleshooting

### "Table does not exist" error
- Make sure you ran `supabase_verification_system.sql` first
- Check Supabase SQL Editor for any errors

### "Permission denied" error
- Make sure you ran `supabase_verification_rls.sql`
- Check if user is logged in
- Verify RLS policies are enabled

### "Function does not exist" error
- Make sure you ran `supabase_verification_system.sql`
- Check if functions were created successfully

### Documents not uploading
- Check if `verification-documents` bucket exists
- Verify storage policies are set up correctly
- Check file size limits (max 50MB for videos)

---

## ✅ Success Criteria

You'll know the system is working when:

1. ✅ Users can select a tier to upgrade to
2. ✅ Users can upload required documents
3. ✅ Verification requests appear in admin dashboard
4. ✅ Admins can approve/reject requests
5. ✅ Users receive notifications on approval/rejection
6. ✅ User tier is updated in database
7. ✅ Verified badge appears on user profile
8. ✅ All actions are logged in audit trail

---

## 🎉 You're Ready!

The database foundation is complete. Now you just need to:
1. Run the SQL scripts
2. Build the frontend components
3. Update the admin dashboard
4. Test everything

**Good luck! 🚀**

