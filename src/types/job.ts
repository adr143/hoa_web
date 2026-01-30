export interface Job {
  id?: string;
  title: string;
  category: string;
  subcategory: string;
  location: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  employment_type: string;
  employer_id: string;
  min_salary: string;
  max_salary: string;
  salary_type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'project';
  expiration_days: number;
  tags: string[];
  status: 'active' | 'inactive';
  posted_days: number;
  posted_date?: string;
  created_at?: Date;
  employer?:{
    id?: string;
    logo?: string;
    company_name?: string;
    profile?: {
      id?: string;
      name?: string;
      profile_image?: string
    }
  }
}

export interface JobApplication {
  id: string;
  worker_id: string | null;
  created_at: string;
  job_id: string | null;
  cover_letter: string | null;
  attachments: string[];
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | null;
  applied_at: string | null;
  worker?:{
    id?: string;
    profile_image?: string;
    profile?: {
      id?: string;
      name?: string;
      profile_image?: string;
    }
  };
  job?: {
    id?: string;
    title?: string;
    category?: string;
    location?: string;
    description?: string;
    employer?: {
      id?: string;
      profile?: {
        id?: string;
        name?: string;
        profile_image?: string;
      }
    }
  }
}
