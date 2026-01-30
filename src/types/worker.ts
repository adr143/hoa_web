export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
}

export interface Certification {
  name: string;
  issuer: string;
  year: string;
}

export interface WorkHistory {
  title: string;
  employer: string;
  duration: string;
  description: string;
}

export interface VerificationStatus {
  identity: boolean;
  background: boolean;
  skills: boolean;
}

export interface PortfolioItem {
  title: string;
  image: string;
  description: string;
}

export interface ActiveProposal {
  id: string;
  employer_id: string;
  employer_name: string;
  title: string;
  description: string;
  rate: string;
  rate_type: 'hourly' | 'fixed';
  start_date: string;
  duration: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed';
  expires_at: string;
  employer: {
    logo: string;
    profile: {
      name: string;
    };
  };
  worker: {
    id: string;
    profile_image: string;
    title: string;
    profile: {
      name: string;
    };
  };
}

export interface Review {
  id: string;
  worker_id: string;
  employer_id?: string;
  proposal_id?: string;
  author: string;
  rating: number;
  date: string;
  content: string
}

export interface Worker {
  id: string;
  name: string;
  title: string;
  location: string;
  rating: number;
  profile_image: string;
  cover_image: string;
  description: string;
  category: string[];
  subcategory: string;
  skills: string[];
  hourly_rate: string;
  availability: string;
  experience: Experience[];
  languages: string[];
  education: Education[];
  certifications: Certification[];
  work_history: WorkHistory[];
  verifications: VerificationStatus;
  tier: string;
  portfolio: PortfolioItem[];
  active_proposals: ActiveProposal[];
  reviews: Review[];
  badges?: string[];
  member_since?: string;
  about?: string;
  response_rate?: string;
  travel_distance?: number;
  email?: string;
  video_reel_path?: string;
  video_reel_status?: string;
  profile?: {
    id: string;
    name: string;
    account_type: string;
  };
}
