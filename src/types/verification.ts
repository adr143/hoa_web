// ============================================================================
// VERIFICATION TYPES
// ============================================================================

// Tier types
export type EmployerTier = 'Basic' | 'Verified' | 'Enterprise';
export type WorkerTier = 'Basic' | 'Verified' | 'Premium';

// Verification status
export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'under_review';

// Document types
export type IDDocumentType = 
  | 'passport'
  | 'drivers_license'
  | 'national_id'
  | 'prc_id'
  | 'voters_id'
  | 'philsys_id';

export type BusinessDocumentType =
  | 'sec_registration'
  | 'dti_registration'
  | 'business_permit'
  | 'mayors_permit';

export type WorkerDocumentType =
  | 'nbi_clearance'
  | 'police_clearance'
  | 'barangay_clearance'
  | 'prc_certificate'
  | 'tesda_certificate';

export type CompanyType = 'individual' | 'company' | 'agency' | 'institution';

// ============================================================================
// EMPLOYER VERIFICATION
// ============================================================================

export interface EmployerVerificationRequest {
  id: string;
  employer_id: string;
  requested_tier: EmployerTier;
  current_tier: EmployerTier;
  status: VerificationStatus;
  
  // Documents
  id_document_path?: string;
  id_document_type?: IDDocumentType;
  address_proof_path?: string;
  
  // Enterprise documents
  sec_registration_path?: string;
  dti_registration_path?: string;
  business_permit_path?: string;
  representative_id_path?: string;
  
  company_type?: CompanyType;
  notes?: string;
  
  // Admin review
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// WORKER VERIFICATION
// ============================================================================

export interface WorkerVerificationRequest {
  id: string;
  worker_id: string;
  requested_tier: WorkerTier;
  current_tier: WorkerTier;
  status: VerificationStatus;
  
  // Basic tier
  id_document_path?: string;
  id_document_type?: IDDocumentType;
  
  // Face verification
  face_image_path?: string;
  face_match_score?: number;
  liveness_check_passed?: boolean;
  
  // Verified tier documents
  nbi_clearance_path?: string;
  police_clearance_path?: string;
  barangay_clearance_path?: string;
  prc_certificate_path?: string;
  tesda_certificate_path?: string;
  
  // Premium tier
  is_reverification?: boolean;
  previous_verification_id?: string;
  video_reel_path?: string;
  video_reel_status?: VerificationStatus;
  video_reel_rejection_reason?: string;
  
  // Manual verification tracking
  nbi_verified?: boolean;
  police_verified?: boolean;
  prc_verified?: boolean;
  tesda_verified?: boolean;
  
  notes?: string;
  
  // Admin review
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// VIDEO REEL
// ============================================================================

export interface WorkerVideoReel {
  id: string;
  worker_id: string;
  video_path: string;
  thumbnail_path?: string;
  duration_seconds?: number;
  file_size_mb?: number;
  status: VerificationStatus | 'flagged';
  
  // Moderation
  moderated_by?: string;
  moderated_at?: string;
  rejection_reason?: string;
  moderation_notes?: string;
  
  is_professional?: boolean;
  is_appropriate?: boolean;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// VERIFICATION AUDIT LOG
// ============================================================================

export interface VerificationAuditLog {
  id: string;
  verification_request_id: string;
  verification_type: 'employer' | 'worker';
  action: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'resubmitted' | 'reverification_required';
  performed_by?: string;
  previous_status?: string;
  new_status?: string;
  previous_tier?: string;
  new_tier?: string;
  notes?: string;
  created_at: string;
}

// ============================================================================
// VERIFICATION STATUS RESPONSES
// ============================================================================

export interface EmployerVerificationStatus {
  tier: EmployerTier;
  verification_level: EmployerTier;
  has_pending_request: boolean;
  can_upgrade: boolean;
}

export interface WorkerVerificationStatus {
  tier: WorkerTier;
  verification_level: WorkerTier;
  identity_verified: boolean;
  background_verified: boolean;
  skills_verified: boolean;
  has_pending_request: boolean;
  can_upgrade: boolean;
  needs_reverification: boolean;
}

// ============================================================================
// TIER FEATURES
// ============================================================================

export interface TierFeatures {
  name: string;
  price: {
    monthly: string,
    annually: string
  };
  features: string[];
  limitations?: string[];
  requirements: string[];
}

export const EMPLOYER_TIER_FEATURES: Record<EmployerTier, TierFeatures> = {
  Basic: {
    name: 'Basic (Free)',
    price: {
      monthly: 'Free',
      annually: 'Free'
    },
    features: [
      'Create employer/company profile',
      'Post one (1) free job listing',
      'View limited verified worker profiles',
      'Receive applications by email'
    ],
    limitations: [
      'No chat access',
      'Limited search and posting tools'
    ],
    requirements: [
      'None'
    ]
  },
  Verified: {
    name: 'Verified',
    price: {
      monthly: '₱999',
      annually: '₱9,999'
    },
    features: [
      'Purple Angel Badge for verified employer identity',
      'Post up to ten (10) job listings',
      'Direct chat with verified and premium workers',
      'Access to full worker database with smart filters',
      'Job management dashboard to track applicants',
      'Analytics summary (views, messages, and reach)',
      'SMS/email alerts for relevant worker profiles'
    ],
    requirements: [
      'Valid ID or business permit upload',
      'Contact number and address confirmation'
    ]
  },
  Enterprise: {
    name: 'Enterprise',
    price: {
      monthly: '₱14,999+',
      annually: 'Custom'
    },
    features: [
      'Custom Enterprise Dashboard with unlimited job listings',
      'Full access to verified and premium worker network',
      'Golden Angel Badge with "Trusted Partner" status',
      'Company featured in the Trusted Employer Network',
      'Advanced analytics: job performance, applicant flow, and reach',
      'Secure HR export tools and optional system integration (API)',
      'Co-branded verified profile page',
      'Priority customer and technical support'
    ],
    requirements: [
      'Valid business documents',
      'Company verification',
      'Contact sales for custom setup'
    ]
  }
};

export const WORKER_TIER_FEATURES: Record<WorkerTier, TierFeatures> = {
  Basic: {
    name: 'Basic (Free)',
    price: {
      monthly: 'Free',
      annually: 'Free'
    },
    features: [
      'Create a personal worker profile (photo, skills, and experience)',
      'Browse verified job listings',
      'Submit limited job applications monthly',
      'Access community news, updates, and learning content',
      'Eligible to upgrade anytime'
    ],
    limitations: [
      'No badge or verified status',
      'Profile visibility limited to verified employers',
      'No in-app chat until verified'
    ],
    requirements: [
      'None'
    ]
  },
  Verified: {
    name: 'Verified',
    price: {
      monthly: '₱299',
      annually: '₱2,999'
    },
    features: [
      'Purple Angel Badge (identity and background verified)',
      'Priority visibility in search results',
      'Unlimited job applications',
      'Direct chat with verified employers',
      'Verified-only job listings access',
      'Instant alerts for matched opportunities',
      'Eligible for reviews and endorsements',
      'Annual re-verification reminder'
    ],
    requirements: [
      '1 valid government ID + selfie verification',
      'NBI/Police/Barangay clearance upload',
      'Skill declaration + one reference check'
    ]
  },
  Premium: {
    name: 'Premium',
    price: {
      monthly: '₱499',
      annually: '₱4,999'
    },
    features: [
      'All Verified benefits, plus:',
      'Golden Angel Badge (highest trust level)',
      'Featured visibility in employer searches',
      'Personalized profile banner + verified video introduction',
      'Monthly profile optimization or digital resume support',
      'Access to Premium-only job listings (corporate or international)',
      'Fast-lane verification and support',
      'Access to House of Angels training, events, and media features',
      'Inclusion in "Top Angels" showcase'
    ],
    requirements: [
      'All Verified tier requirements',
      'Enhanced verification process',
      'Video introduction submission'
    ]
  }
};

// ============================================================================
// UPLOAD HELPERS
// ============================================================================

export interface UploadedDocument {
  file: File;
  type: string;
  preview?: string;
}

export interface VerificationFormData {
  tier: EmployerTier | WorkerTier;
  documents: UploadedDocument[];
  notes?: string;
}

