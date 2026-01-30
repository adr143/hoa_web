import { useContext } from 'react';
import { JobApplicationContext } from '@/context/JobApplicationContext';

export const useJobApplications = () => {
  const context = useContext(JobApplicationContext);
  if (!context) throw new Error('useJobApplications must be used within a JobApplicationProvider');
  return context;
};
