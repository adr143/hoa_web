'use client';

import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { JobContext } from '@/context/JobContext';
import { Job } from '@/types/job';

export const JobProvider = ({ children }: { children: ReactNode }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  /** 🔍 Fetch single job */
  const fetchJob = useCallback(async (id: string): Promise<Job | null> => {
    const { data, error } = await supabase.from('jobs').select(`
            *,
            employer:employers(
            id,
            company_name,
            logo,
            profile:profiles!inner(
                id,
                name,
                profile_image
            )
            )
        `).eq('id', id).single();
    if (error) {
      console.error('Error fetching job:', error.message);
      return null;
    }
    return data as Job;
  }, []);

  /**
   * Helper function to estimate distance between two locations (simplified)
   * In production, use a geocoding API like Google Maps Distance Matrix API
   */
  const estimateDistance = useCallback((location1: string, location2: string): number => {
    const loc1Words = location1.toLowerCase().split(/[\s,]+/);
    const loc2Words = location2.toLowerCase().split(/[\s,]+/);
    const commonWords = loc1Words.filter(word => loc2Words.includes(word));

    if (commonWords.length >= 2) return 10; // Same city/area
    if (commonWords.length === 1) return 30; // Same state/region
    return 100; // Different regions
  }, []);

  /** 📋 Fetch all jobs with optional filters and pagination */
  const fetchJobs = useCallback(async (
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
    ): Promise<{ jobs: Job[], totalCount: number }> => {
    setLoading(true);

    // Build count query for total
    let countQuery = supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

    // Build data query
    let query = supabase
        .from('jobs')
        .select(`
            *,
            employer:employers(
            id,
            company_name,
            logo,
            profile:profiles!inner(
                id,
                name,
                profile_image
            )
            )
        `)
        .eq('status', 'active')
        .order('posted_date', { ascending: false });

    // Category filter
    if (category && category !== 'all') {
      query = query.eq('category', category);
      countQuery = countQuery.eq('category', category);
    }

    // Search query filter
    if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        countQuery = countQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    // Subcategory filter
    if (subcategory) {
      query = query.eq('subcategory', subcategory);
      countQuery = countQuery.eq('subcategory', subcategory);
    }

    // Employment type filter (full-time, part-time, contract, etc.)
    if (employmentType) {
      query = query.eq('employment_type', employmentType);
      countQuery = countQuery.eq('employment_type', employmentType);
    }

    // Date filter
    if (dateFilter && dateFilter !== 'all') {
        const now = new Date();
        let gte: string;
        if (dateFilter === 'today') gte = now.toISOString().split('T')[0];
        else if (dateFilter === 'week') gte = new Date(now.getTime() - 7*24*60*60*1000).toISOString();
        else gte = new Date(now.getTime() - 30*24*60*60*1000).toISOString();

        query = query.gte('posted_date', gte);
        countQuery = countQuery.gte('posted_date', gte);
    }

    // Pagination
    const currentPage = page || 1;
    const itemsPerPage = pageSize || 20;
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    // Apply pagination to data query only (not count query)
    if (range) {
      query = query.range(range[0], range[1]);
    } else {
      query = query.range(from, to);
    }

    // Execute both queries
    const [{ data, error }, { count }] = await Promise.all([
      query,
      countQuery
    ]);

    setLoading(false);

    if (error) {
        console.error('Error fetching jobs:', error.message);
        return { jobs: [], totalCount: 0 };
    }

    let filteredJobs = data as Job[];

    // Client-side filtering for location + distance
    if (location && distanceKm) {
      filteredJobs = filteredJobs.filter(job => {
        if (!job.location) return false;
        const distance = estimateDistance(location, job.location);
        return distance <= distanceKm;
      });
    } else if (location) {
      // Simple location match without distance
      filteredJobs = filteredJobs.filter(job =>
        job.location?.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Client-side salary range filter
    if (minSalary !== undefined || maxSalary !== undefined) {
      filteredJobs = filteredJobs.filter(job => {
        if (!job.min_salary || !job.max_salary) return true;

        try {
          const jobMinSalary = parseFloat(job.min_salary.replace(/[^0-9.]/g, ''));
          const jobMaxSalary = parseFloat(job.max_salary.replace(/[^0-9.]/g, ''));

          if (minSalary !== undefined && jobMaxSalary < minSalary) return false;
          if (maxSalary !== undefined && jobMinSalary > maxSalary) return false;

          return true;
        } catch (e) {
          return true;
        }
      });
    }

    // Client-side skills filter
    if (skills && skills.length > 0) {
      filteredJobs = filteredJobs.filter(job => {
        if (!job.requirements || job.requirements.length === 0) return false;

        const jobRequirements = job.requirements.map(r => r.toLowerCase());
        return skills.some(skill =>
          jobRequirements.some(req =>
            req.includes(skill.toLowerCase()) || skill.toLowerCase().includes(req)
          )
        );
      });
    }

    setJobs(filteredJobs);
    return {
      jobs: filteredJobs,
      totalCount: count || filteredJobs.length
    };
  }, []);


  /** 👷 Fetch jobs by employer */
  const fetchByEmployer = useCallback(async (employerId: string): Promise<Job[]> => {
    const { data, error } = await supabase.from('jobs').select('*').eq('employer_id', employerId);
    if (error) {
      console.error('Error fetching employer jobs:', error.message);
      return [];
    }
    return data as Job[];
  }, []);

  /** 🆕 Add new job */
  const postJob = useCallback(async (job: Partial<Job>): Promise<Job | null> => {
    const { data, error } = await supabase
      .from('jobs')
      .insert([job])
      .select()
      .single();

    if (error) {
      if (error.message.includes('Job posting limit exceeded')) {
        alert(error.message);
        return null;
      }

      console.error('Error posting job:', error.message);
      return null;
    }

    setJobs(prev => [...prev, data as Job]);
    return data as Job;
  }, []);

  /** ✏️ Update existing job */
  const updateJob = useCallback(async (id: string, job: Partial<Job>): Promise<void> => {
    const { error } = await supabase.from('jobs').update(job).eq('id', id);
    if (error) {
      console.error('Error updating job:', error.message);
      return;
    }
    setJobs(prev => prev.map(j => (j.id === id ? { ...j, ...job } : j)));
  }, []);

  /** 🗑️ Delete job */
  const deleteJob = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) {
      console.error('Error deleting job:', error.message);
      return;
    }
    setJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  // Auto fetch all jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  return React.createElement(
    JobContext.Provider,
    {
      value: {
        fetchJob,
        fetchJobs,
        fetchByEmployer,
        postJob,
        updateJob,
        deleteJob,
        jobs,
        loading,
      },
    },
    children
  );
};
