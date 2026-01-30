'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { JobApplicationContext } from '@/context/JobApplicationContext';
import { JobApplication } from '@/types';

interface JobApplicationProviderProps {
  children: ReactNode;
  workerId?: string; // Optional worker id to fetch
  jobId?: string; // Optional job id to fetch
}

export const JobApplicationProvider = ({ children, workerId, jobId }: JobApplicationProviderProps) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  /** 🔍 Fetch single application by ID */
  const fetchApplication = async (id: string): Promise<JobApplication | null> => {
    const { data, error } = await supabase.from('job_applications').select(`
      *,
      worker:workers(
        id,
        profile_image,
        profile:profiles!inner(
          id,
          name,
          profile_image
        )
      )
    `).eq('id', id).single();
    if (error) {
      console.error('Error fetching application:', error.message);
      return null;
    }
    return data as JobApplication;
  };

  /** 📋 Fetch all or filtered job applications */
  const fetchApplications = async (
    workerId?: string,
    jobId?: string
  ): Promise<JobApplication[]> => {
    setLoading(true);
    let query = supabase.from('job_applications').select(`
      *,
      worker:workers(
        id,
        profile_image,
        profile:profiles!inner(
          id,
          name,
          profile_image
        )
      ),
      job:jobs(
        id,
        title,
        category,
        location,
        description,
        employer:employers(
          id,
          profile:profiles!inner(
            id,
            name,
            profile_image
          )
        )
      )
    `).order('applied_at', { ascending: false });

    if (workerId) query = query.eq('worker_id', workerId);
    if (jobId) query = query.eq('job_id', jobId);

    const { data, error } = await query;
    setLoading(false);

    if (error) {
      console.error('Error fetching applications:', error.message);
      return [];
    }

    setApplications(data as JobApplication[]);
    return data as JobApplication[];
  };

  useEffect(() => {
    if (workerId) {
      fetchApplications(workerId);
    }

    if (jobId) {
      fetchApplications(undefined, jobId);
    }
  }, [workerId, jobId]);

  /** 🆕 Submit a new job application */
  const applyForJob = async (application: Partial<JobApplication>): Promise<JobApplication | null> => {
    const { data, error } = await supabase.from('job_applications').insert([application]).select().single();
    if (error) {
      console.error('Error applying for job:', error.message);
      return null;
    }
    setApplications(prev => [data as JobApplication, ...prev]);
    return data as JobApplication;
  };

  /** ✏️ Update existing application */
  const updateApplication = async (id: string, data: Partial<JobApplication>): Promise<void> => {
    const { error } = await supabase.from('job_applications').update(data).eq('id', id);
    if (error) {
      console.error('Error updating application:', error.message);
      return;
    }
    setApplications(prev => prev.map(app => (app.id === id ? { ...app, ...data } : app)));
  };

  /** 🗑️ Delete application */
  const deleteApplication = async (id: string): Promise<void> => {
    const { error } = await supabase.from('job_applications').delete().eq('id', id);
    if (error) {
      console.error('Error deleting application:', error.message);
      return;
    }
    setApplications(prev => prev.filter(app => app.id !== id));
  };

  // Optionally fetch all applications on mount
  useEffect(() => {
    fetchApplications();
  }, []);

  return React.createElement(
    JobApplicationContext.Provider,
    {
      value: {
        fetchApplication,
        fetchApplications,
        applyForJob,
        updateApplication,
        deleteApplication,
        applications,
        loading,
      },
    },
    children
  );
};
