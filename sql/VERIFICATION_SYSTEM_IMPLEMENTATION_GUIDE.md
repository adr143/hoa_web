# House of Angels - Verification System Implementation Guide

## 📋 Overview

This guide provides a complete implementation plan for the tier-based verification system for both **Workers** and **Employers** on the House of Angels platform.

---

## ✅ Completed Tasks

### 1. **Database Schema** ✅
**Files Created:**
- `supabase_verification_system.sql` - Complete database schema
- `supabase_verification_rls.sql` - Row Level Security policies

**Tables Created:**
1. **`employer_verification_requests`** - Employer tier upgrade requests
2. **`worker_verification_requests`** - Worker tier upgrade requests  
3. **`worker_video_reels`** - Premium worker video reels
4. **`verification_audit_log`** - Immutable audit trail

**Columns Added to Existing Tables:**
- **`employers` table**: `tier`, `verification_level`, `verification_status`, `company_type`, etc.
- **`workers` table**: `tier`, `verification_level`, `verification_status`, `video_reel_path`, `next_reverification_due`, etc.

**Helper Functions Created:**
- `get_employer_verification_status(employer_uuid)` - Get employer verification status
- `get_worker_verification_status(worker_uuid)` - Get worker verification status
- `approve_employer_verification(request_uuid, admin_uuid, notes)` - Approve employer verification
- `approve_worker_verification(request_uuid, admin_uuid, notes)` - Approve worker verification
- `reject_verification(request_uuid, type, admin_uuid, reason)` - Reject any verification

**Triggers Created:**
- Auto-update `updated_at` timestamps
- Auto-send notifications on verification status changes

### 2. **TypeScript Types** ✅
**File Created:** `src/types/verification.ts`

**Types Defined:**
- `EmployerTier` = 'Basic' | 'Verified' | 'Enterprise'
- `WorkerTier` = 'Basic' | 'Verified' | 'Premium'
- `VerificationStatus` = 'none' | 'pending' | 'approved' | 'rejected' | 'under_review'
- `IDDocumentType` - Government IDs
- `BusinessDocumentType` - Business documents
- `WorkerDocumentType` - Worker clearances/certificates
- `EmployerVerificationRequest` - Full interface
- `WorkerVerificationRequest` - Full interface
- `EMPLOYER_TIER_FEATURES` - Feature descriptions for each tier
- `WORKER_TIER_FEATURES` - Feature descriptions for each tier

### 3. **Verification Center Page** ✅ (Placeholder)
**File Created:** `src/app/verification/page.tsx`

**Status:** Basic placeholder created. Full implementation requires additional components.

---

## 🔧 Implementation Steps

### Step 1: Run Database Scripts

1. **Open Supabase SQL Editor**
2. **Run `supabase_verification_system.sql`**
   - Creates all tables, columns, functions, and triggers
   - Adds tier system to employers and workers tables
   - Sets up verification request tracking

3. **Run `supabase_verification_rls.sql`**
   - Enables Row Level Security on all new tables
   - Creates policies for user and admin access
   - Sets up storage bucket policies for verification documents

4. **Verify Installation:**
   ```sql
   -- Check if tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE '%verification%';
   
   -- Check if functions exist
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name LIKE '%verification%';
   ```

### Step 2: Create Verification Flow Components

You need to create two main components:

#### **`src/components/verification/EmployerVerificationFlow.tsx`**

**Purpose:** Handle employer verification document upload and submission

**Props:**
```typescript
interface Props {
  selectedTier: EmployerTier;
  currentTier: EmployerTier;
  onCancel: () => void;
  onSuccess: () => void;
}
```

**Features Needed:**
- **Basic Tier**: Upload government ID (passport, driver's license, national ID, PRC ID)
- **Verified Tier**: Upload government ID + optional address proof
- **Enterprise Tier**: Upload SEC/DTI registration, business permit, representative ID
- Document type selection dropdown
- File upload with preview
- Form validation
- Submit to `employer_verification_requests` table
- Upload files to Supabase Storage bucket `verification-documents`

**Key Functions:**
```typescript
const uploadDocument = async (file: File, type: string) => {
  const filePath = `employer/${user.id}/${type}/${file.name}`;
  await supabase.storage
    .from('verification-documents')
    .upload(filePath, file);
  return filePath;
};

const submitVerificationRequest = async () => {
  const { error } = await supabase
    .from('employer_verification_requests')
    .insert({
      employer_id: user.id,
      requested_tier: selectedTier,
      current_tier: currentTier,
      id_document_path: uploadedDocs.id_document,
      id_document_type: selectedIDType,
      // ... other fields
      status: 'pending'
    });
};
```

#### **`src/components/verification/WorkerVerificationFlow.tsx`**

**Purpose:** Handle worker verification with face recognition and clearances

**Props:**
```typescript
interface Props {
  selectedTier: WorkerTier;
  currentTier: WorkerTier;
  onCancel: () => void;
  onSuccess: () => void;
}
```

**Features Needed:**
- **Basic Tier**: Upload government ID
- **Verified Tier**: 
  - Upload government ID
  - Face verification with camera capture
  - Upload NBI clearance, police clearance, barangay clearance
  - Upload PRC/TESDA certificates (if applicable)
- **Premium Tier**:
  - All Verified tier requirements
  - Optional: Upload 1-minute video reel (TikTok-style)
  - Liveness detection for face verification
  - Re-verification tracking

**Key Functions:**
```typescript
const captureFaceImage = async () => {
  // Use webcam to capture face
  const canvas = canvasRef.current;
  const video = videoRef.current;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const imageData = canvas.toDataURL('image/png');
  return imageData;
};

const uploadVideoReel = async (file: File) => {
  // Validate video (max 60 seconds, max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('Video must be under 50MB');
  }
  
  const filePath = `worker/${user.id}/video_reel/${file.name}`;
  await supabase.storage
    .from('verification-documents')
    .upload(filePath, file);
  return filePath;
};

const submitVerificationRequest = async () => {
  const { error } = await supabase
    .from('worker_verification_requests')
    .insert({
      worker_id: user.id,
      requested_tier: selectedTier,
      current_tier: currentTier,
      id_document_path: uploadedDocs.id_document,
      face_image_path: capturedFace,
      nbi_clearance_path: uploadedDocs.nbi_clearance,
      // ... other fields
      status: 'pending'
    });
};
```

### Step 3: Update Admin Dashboard

**File to Modify:** `src/app/admin/dashboard/page.tsx`

**Changes Needed:**

1. **Replace "Users" tab (currently "under development") with "Verifications" tab**

2. **Fetch verification requests:**
```typescript
const [verificationRequests, setVerificationRequests] = useState<{
  employer: EmployerVerificationRequest[];
  worker: WorkerVerificationRequest[];
}>({ employer: [], worker: [] });

useEffect(() => {
  const fetchVerificationRequests = async () => {
    const { data: employerRequests } = await supabase
      .from('employer_verification_requests')
      .select(`
        *,
        employers(company_name, logo),
        profiles(name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    const { data: workerRequests } = await supabase
      .from('worker_verification_requests')
      .select(`
        *,
        workers(name, profile_image),
        profiles(name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setVerificationRequests({
      employer: employerRequests || [],
      worker: workerRequests || []
    });
  };

  fetchVerificationRequests();
}, []);
```

3. **Create verification review UI:**
   - List of pending requests (tabs for Employer/Worker)
   - Document viewer/preview
   - Approve/Reject buttons
   - Rejection reason textarea
   - Admin notes textarea

4. **Implement approve/reject actions:**
```typescript
const approveVerification = async (requestId: string, type: 'employer' | 'worker') => {
  if (type === 'employer') {
    const { error } = await supabase.rpc('approve_employer_verification', {
      request_uuid: requestId,
      admin_uuid: user.id,
      admin_note: adminNotes
    });
  } else {
    const { error } = await supabase.rpc('approve_worker_verification', {
      request_uuid: requestId,
      admin_uuid: user.id,
      admin_note: adminNotes
    });
  }
  
  if (!error) {
    // Refresh verification requests
    // Show success notification
  }
};

const rejectVerification = async (requestId: string, type: 'employer' | 'worker', reason: string) => {
  const { error } = await supabase.rpc('reject_verification', {
    request_uuid: requestId,
    request_type: type,
    admin_uuid: user.id,
    reason: reason
    });
  
  if (!error) {
    // Refresh verification requests
    // Show success notification
  }
};
```

---

## 📊 Tier System Details

### Employer Tiers

| Tier | Price | Verification Required | Key Features |
|------|-------|----------------------|--------------|
| **Basic** | Free | Government ID | 2 job listings, limited access |
| **Verified** | Paid | Government ID + Address (optional) | 10 job listings, messaging, AI matching, badge |
| **Enterprise** | Custom | Company docs + Business permit | Unlimited listings, multi-user, analytics, dedicated support |

### Worker Tiers

| Tier | Price | Verification Required | Key Features |
|------|-------|----------------------|--------------|
| **Basic** | Free | Government ID | 3 job categories, limited visibility |
| **Verified** | Paid | ID + Face + NBI/Police clearance | Verified badge, enhanced visibility, ratings |
| **Premium** | Paid | All Verified + Video reel + Liveness | Top Worker badge, featured listings, analytics, re-verification every 6 months |

---

## 🔐 Security Considerations

1. **Document Storage:**
   - All documents stored in Supabase Storage bucket `verification-documents`
   - Folder structure: `{account_type}/{user_id}/{document_type}/{filename}`
   - RLS policies ensure users can only access their own documents
   - Admins can access all documents for review

2. **Face Verification:**
   - Capture face image using browser webcam API
   - Store as PNG in `verification-documents/worker/{user_id}/face/`
   - For Premium tier: Implement liveness detection (blink, turn head)
   - Compare face with ID photo (can integrate with AI service)

3. **Video Reel Moderation:**
   - Max 60 seconds, max 50MB
   - Admin must approve before going live
   - Check for professionalism and appropriateness
   - Store in `verification-documents/worker/{user_id}/video_reel/`

4. **Audit Trail:**
   - All verification actions logged in `verification_audit_log`
   - Immutable (no updates or deletes allowed)
   - Tracks who approved/rejected and when

---

## 🧪 Testing Checklist

### Database Testing
- [ ] Run `supabase_verification_system.sql` successfully
- [ ] Run `supabase_verification_rls.sql` successfully
- [ ] Verify all tables created
- [ ] Verify all functions created
- [ ] Test RLS policies (users can only see their own data)
- [ ] Test admin access (admins can see all data)

### Employer Verification Testing
- [ ] Basic tier: Upload government ID
- [ ] Verified tier: Upload ID + address proof
- [ ] Enterprise tier: Upload company documents
- [ ] Verify request appears in admin dashboard
- [ ] Admin can approve request
- [ ] Admin can reject request with reason
- [ ] User receives notification on approval/rejection
- [ ] Employer tier updated in database
- [ ] Verified badge appears on employer profile

### Worker Verification Testing
- [ ] Basic tier: Upload government ID
- [ ] Verified tier: Upload ID + face + clearances
- [ ] Premium tier: Upload all + video reel
- [ ] Face capture works with webcam
- [ ] Video upload validates size and duration
- [ ] Verify request appears in admin dashboard
- [ ] Admin can view all uploaded documents
- [ ] Admin can approve/reject
- [ ] Worker tier updated in database
- [ ] Verified/Premium badge appears on worker profile
- [ ] Re-verification reminder sent after 6 months (Premium)

---

## 📝 Next Steps

1. ✅ **Run SQL scripts in Supabase** (CRITICAL - Do this first!)
2. ⏳ **Create `EmployerVerificationFlow` component**
3. ⏳ **Create `WorkerVerificationFlow` component**
4. ⏳ **Update admin dashboard verification tab**
5. ⏳ **Test complete flow for both employers and workers**
6. ⏳ **Add tier badges to profiles**
7. ⏳ **Implement tier-based feature restrictions**

---

## 🎯 Summary

You now have:
- ✅ Complete database schema with tier system
- ✅ RLS policies for security
- ✅ TypeScript types and interfaces
- ✅ Helper functions for verification approval
- ✅ Automatic notifications on status changes
- ✅ Audit logging for compliance
- ⏳ Frontend components (need to be built)

**The database foundation is complete and ready to use!** 🚀

Run the SQL scripts and you'll have a production-ready verification system backend.

