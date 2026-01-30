import { createContext } from 'react';
import { EmployerData } from '@/types';

export interface EmployerContextType {
  employerData: EmployerData | null;
  loading: boolean;
  fetchEmployer: (id?: string) => Promise<void>;
  handleProfileImageUpdate: (file: File) => Promise<void>;
  handleCoverImageUpdate: (file: File) => Promise<void>;
  handleCreatePost: (post: { content: string; images: File[]; date: string }) => Promise<void>;
  handleAddComment: (postId: string, content: string) => Promise<void>;
  updateEmployerInfo: (updates: {
    company_name?: string;
    company_description?: string;
    website?: string;
    employees?: string;
    company_location?: string;
    email?: string;
    phone?: string;
  }) => Promise<void>;
  submitVerificationRequest: (documents: File[], notes?: string) => Promise<{ success: boolean; message: string }>;
  getVerificationStatus: () => Promise<any>;
  uploadVerificationDocuments: (documents: File[]) => Promise<string[]>;
  checkJobLimit: (employerId: string) => Promise<{ allowed: boolean; message?: string }>;
}
export const EmployerContext = createContext<EmployerContextType | null>(null);
