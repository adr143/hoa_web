import { createContext } from 'react';
import { Job } from '@/types/job';

export interface JobContextType {
  fetchJob: (id: string) => Promise<Job | null>;
  fetchJobs: (
    category?: string,
    searchQuery?: string,
    location?: string,
    dateFilter?: 'all' | 'today' | 'week' | 'month',
    range?: [number, number],
    distanceKm?: number,
    subcategory?: string,
    employmentType?: string,
    minSalary?: number,
    maxSalary?: number,
    skills?: string[],
    page?: number,
    pageSize?: number
  ) => Promise<{ jobs: Job[], totalCount: number }>;
  fetchByEmployer: (employerId: string) => Promise<Job[]>;
  postJob: (job: Partial<Job>) => Promise<Job | null>;
  updateJob: (id: string, job: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  jobs: Job[];
  loading: boolean;
}

export const JobContext = createContext<JobContextType | null>(null);
