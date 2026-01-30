import { createContext } from 'react';
import { JobApplication } from '@/types';

export interface JobApplicationContextType {
  fetchApplications: (workerId?: string, jobId?: string) => Promise<JobApplication[]>;
  fetchApplication: (id: string) => Promise<JobApplication | null>;
  applyForJob: (application: Partial<JobApplication>) => Promise<JobApplication | null>;
  updateApplication: (id: string, data: Partial<JobApplication>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  applications: JobApplication[];
  loading: boolean;
}

export const JobApplicationContext = createContext<JobApplicationContextType | null>(null);
