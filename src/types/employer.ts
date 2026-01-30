export type Tier_Type = |
  'Free'|
  'Paid Plan'|
  'Enterprise';

export interface Comment {
  id: string;
  post_id: string;
  author_id: string | null; // because author can be null if deleted
  content: string;
  date: string;
}

export interface CommentAuthor {
  id: string;
  name: string;
  profile_image?: string;
  account_type: 'employer' | 'jobseeker' | 'admin';
  is_admin?: boolean;
}

export interface Post {
  id: string;
  content: string;
  images: string[];
  date: string;
  likes: number;
  comments: Comment[];
}

export interface JobPost {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  tags: string[];
  posted_date: string;
  applications: number;
  status: 'Active' | 'Filled' | 'Closed' | string;
}

export interface EmployerData {
  id: string;
  name: string;
  logo: string;
  cover_image: string;
  location: string;
  description: string;
  website: string;
  phone: string;
  email: string;
  member_since: string;
  tier: Tier_Type;
  verified: boolean;
  employees: string;
  specialties: string[];
  company_name: string;
  company_description: string;
  company_location: string;
  posts: Post[];
  jobs: JobPost[];
  profile?: {
    id: string;
    name: string;
    account_type: string;
  };
}
