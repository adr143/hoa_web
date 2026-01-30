import { useContext } from 'react';
import { EmployerContext } from '@/context/EmployerContext';

export const useEmployer = () => {
  const context = useContext(EmployerContext);
  if (!context) throw new Error('useEmployer must be used within an EmployerProvider');
  return context;
};
