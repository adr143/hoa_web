import { createContext } from 'react';
import { Worker } from '@/types';

export interface WorkerContextValue {
  workerData: Worker | null;
  loading: boolean;
  error: string | null;
  fetchWorker: (workerId: string) => Promise<void>;
  fetchWorkers: (
    category?: string | null,
    location?: string,
    distanceKm?: number,
    minRating?: number,
    subcategory?: string,
    skills?: string[],
    minHourlyRate?: number,
    maxHourlyRate?: number,
    page?: number,
    pageSize?: number
  ) => Promise<{ workers: Worker[], totalCount: number }>;
  handleProfileImageUpdate: (file: File) => Promise<void>;
  handleCoverImageUpdate: (file: File) => Promise<void>;
  handleVideoReelUpload: (file: File) => Promise<void>;
  updateWorkerInfo: (updates: {
    name?: string;
    password?: string;
    title?: string;
    about?: string;
    location?: string;
    skills?: string[];
    hourly_rate?: string;
    availability?: string;
    email?: string;
    subcategory?: string;
    travel_distance?: number;
    languages?: string[];
    phone?: string;
  }) => Promise<void>;
  updateWorkerCategories: (categories: string[]) => Promise<void>;
}

export const WorkerContext = createContext<WorkerContextValue | undefined>(undefined);
