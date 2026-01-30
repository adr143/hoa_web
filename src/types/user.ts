export interface User {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
  account_type: 'employer' | 'jobseeker' | 'admin';
  is_admin?: boolean;
}

export type VerificationType = 'id' | 'credentials' | 'address' | 'employer' | 'worker';

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: VerificationType;
  dateSubmitted: string;
  files: string[];
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  requested_tier?: string;
  current_tier?: string;
}