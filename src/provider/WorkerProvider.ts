"use client";

import React, { ReactNode, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { WorkerContext, WorkerContextValue } from '@/context/WorkerContext';
import { useAuth } from '@/hooks/useAuth';
import { Worker} from '@/types';
interface WorkerProviderProps {
  children: ReactNode;
  id?: string; // Optional employer id to fetch
}

export const WorkerProvider = ({ children, id }: WorkerProviderProps) => {
  const { user, isLoggedIn, changeName } = useAuth();
  const [workerData, setWorkerData] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorker = useCallback(async (workerId?: string | null) => {
  const idToFetch = workerId || id || user?.id;

  if (!idToFetch) {
    setError('No worker ID provided');
    setWorkerData(null);
    return;
  }

  setLoading(true);
  try {
    const { data: workerData, error: workerError } = await supabase
      .from('workers')
      .select(`*,
        profile: profiles (id, name, account_type)`)
      .eq('id', idToFetch)
      .maybeSingle();

    if (workerError) throw workerError;
    if (!workerData) {
    setWorkerData(null);
    setError('Worker profile not found');
    return;
    }
    

    if (workerError || !workerData) throw workerError || new Error('Worker not found');
      const [educationRes, certificationsRes, workHistoryRes, portfolioRes, verificationsRes, proposalsRes, experienceRes, reviewRes] = await Promise.all([
        supabase.from('education').select('*').eq('worker_id', workerData.id),
        supabase.from('certifications').select('*').eq('worker_id', workerData.id),
        supabase.from('work_history').select('*').eq('worker_id', workerData.id),
        supabase.from('portfolio').select('*').eq('worker_id', workerData.id),
        supabase.from('verifications').select('*').eq('worker_id', workerData.id).single(),
        supabase.from('active_proposals').select(`
          *,
          employer:employers(
            logo,
            profile:profiles(name, profile_image)
          )
        `).eq('worker_id', workerData.id),
        supabase.from('experience').select('*').eq('worker_id', workerData.id),
        supabase.from('review').select('*').eq('worker_id', workerData.id)
      ]);

      const fullWorker: Worker = {
        ...workerData,
        education: educationRes.data || [],
        certifications: certificationsRes.data || [],
        work_history: workHistoryRes.data || [],
        portfolio: portfolioRes.data || [],
        verifications: verificationsRes.data || { identity: false, background: false, skills: false },
        active_proposals: proposalsRes.data || [],
        experience: experienceRes.data || [],
        reviews: reviewRes.data || []
      };

      setWorkerData(fullWorker);
    } catch (err: any) {
      console.error(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  /**
   * Helper function to estimate distance between two locations (simplified)
   * In production, use a geocoding API like Google Maps Distance Matrix API
   */
  const estimateDistance = (location1: string, location2: string): number => {
    const loc1Words = location1.toLowerCase().split(/[\s,]+/);
    const loc2Words = location2.toLowerCase().split(/[\s,]+/);
    const commonWords = loc1Words.filter(word => loc2Words.includes(word));

    if (commonWords.length >= 2) return 10; // Same city/area
    if (commonWords.length === 1) return 30; // Same state/region
    return 100; // Different regions
  };

  const fetchWorkers = async (
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
  ): Promise<{ workers: Worker[], totalCount: number }> => {
    try {

      // Build count query for total
      let countQuery = supabase
        .from('workers')
        .select('*', { count: 'exact', head: true });

      // Build data query
      let query = supabase
        .from('workers')
        .select(`
          *,
          profile:profiles(id, name, account_type),
          reviews:review(*)
        `);

      // Category filter
      if (category) {
        query = query.contains('category', [category]);
        countQuery = countQuery.contains('category', [category]);
      }

      // Subcategory filter
      if (subcategory) {
        query = query.eq('subcategory', subcategory);
        countQuery = countQuery.eq('subcategory', subcategory);
      }

      // Pagination
      const currentPage = page || 1;
      const itemsPerPage = pageSize || 20;
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      // Execute both queries
      const [{ data: workersData, error: workersError }, { count }] = await Promise.all([
        query,
        countQuery
      ]);

      if (workersError) throw workersError;

      let filteredWorkers = workersData || [];

      // Client-side location + distance filtering
      if (location && distanceKm) {
        filteredWorkers = filteredWorkers.filter((worker: Worker) => {
          if (!worker.location) return false;
          const distance = estimateDistance(location, worker.location);
          return distance <= distanceKm;
        });
      } else if (location) {
        // Simple location match without distance
        filteredWorkers = filteredWorkers.filter((worker: Worker) =>
          worker.location?.toLowerCase().includes(location.toLowerCase())
        );
      }

      // Client-side rating filter
      if (minRating !== undefined) {
        filteredWorkers = filteredWorkers.filter((worker: Worker) =>
          worker.rating >= minRating
        );
      }

      // Client-side skills filter
      if (skills && skills.length > 0) {
        filteredWorkers = filteredWorkers.filter((worker: Worker) => {
          if (!worker.skills || worker.skills.length === 0) return false;

          const workerSkills = worker.skills.map(s => s.toLowerCase());
          return skills.some(skill =>
            workerSkills.some(ws =>
              ws.includes(skill.toLowerCase()) || skill.toLowerCase().includes(ws)
            )
          );
        });
      }

      // Client-side hourly rate filter
      if (minHourlyRate !== undefined || maxHourlyRate !== undefined) {
        filteredWorkers = filteredWorkers.filter((worker: Worker) => {
          if (!worker.hourly_rate) return true;

          try {
            const rate = parseFloat(worker.hourly_rate.replace(/[^0-9.]/g, ''));

            if (minHourlyRate !== undefined && rate < minHourlyRate) return false;
            if (maxHourlyRate !== undefined && rate > maxHourlyRate) return false;

            return true;
          } catch (e) {
            return true;
          }
        });
      }

      // Fetch reviews for each worker
      const workersWithReviews = await Promise.all(filteredWorkers.map(async (worker: Worker) => {
        const [reviewRes] = await Promise.all([
          supabase.from('review').select('*').eq('worker_id', worker.id)
        ]);

        return {
          ...worker,
          reviews: reviewRes.data || []
        };
      }));

      return {
        workers: workersWithReviews,
        totalCount: count || workersWithReviews.length
      };
    } catch (err: any) {
      console.error('Error fetching workers:', err);
      return { workers: [], totalCount: 0 };
    }
  };

  useEffect(() => {
    if (user?.account_type === 'jobseeker') {
        fetchWorker(id);
    }
    }, [id, fetchWorker, isLoggedIn, user?.account_type]);

  // Upload utility
  const uploadImageToBucket = async (bucket: string, file: File) => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleVideoReelUpload = async (file: File) => {
    if (!workerData) throw new Error('No worker data loaded');
    try {
      const url = await uploadImageToBucket('worker_reel', file);
      const { error } = await supabase.from('workers').update({ video_reel_path: url, video_reel_status: 'pending' }).eq('id', workerData.id);
      if (error) throw error;
      setWorkerData(prev => prev ? { ...prev, video_reel_path: url, video_reel_status: 'pending' } as Worker : null);
    } catch (err) {
      console.error('Failed to upload video reel:', err);
      throw err;
    }
  };

  const handleProfileImageUpdate = async (file: File) => {
    if (!workerData) return;
    try {
      const url = await uploadImageToBucket('profile_images', file);
      const { error: workerError } = await supabase.from('workers').update({ profile_image: url }).eq('id', workerData.id);
      if (!workerError) setWorkerData({ ...workerData, profile_image: url });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCoverImageUpdate = async (file: File) => {
    if (!workerData) return;
    try {
      const url = await uploadImageToBucket('cover_images', file);
      const { error: workerError } = await supabase.from('workers').update({ cover_image: url }).eq('id', workerData.id);
      if (!workerError) setWorkerData({ ...workerData, cover_image: url });
    } catch (err) {
      console.error(err);
    }
  };

  const updateWorkerInfo = async (updates: {
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
  }) => {
    if (!workerData) throw new Error("No worker data loaded");
    
    try {
      // 1️⃣ Update name and/or password in auth
      if (updates.name) {
        await changeName(updates.name);
      }

      // 2️⃣ Update worker table
      const { error: workerError } = await supabase
        .from("workers")
        .update({
          title: updates.title ?? workerData.title,
          about: updates.about ?? workerData.about,
          location: updates.location ?? workerData.location,
          skills: updates.skills ?? workerData.skills,
          hourly_rate: updates.hourly_rate ?? workerData.hourly_rate,
          availability: updates.availability ?? workerData.availability,
          email: updates.email ?? workerData.email,
          subcategory: updates.subcategory ?? workerData.subcategory,
          travel_distance: updates.travel_distance ?? workerData.travel_distance,
          languages: updates.languages ?? workerData.languages
        })
        .eq("id", workerData.id);

      if (workerError) throw workerError;

      // 3️⃣ Update local state
      setWorkerData(prev => prev ? { ...prev, ...updates } as Worker : null);
    } catch (err) {
      console.error("Failed to update worker info:", err);
      throw err;
    }
  };

  const updateWorkerCategories = async (categories: string[]) => {
    if (!workerData) throw new Error("No worker data loaded");
    
    try {
      const { error } = await supabase
        .from("workers")
        .update({ category: categories })
        .eq("id", workerData.id);

      if (error) throw error;

      setWorkerData(prev => prev ? { ...prev, category: categories } : null);
    } catch (err) {
      console.error("Failed to update categories:", err);
      throw err;
    }
  };

  const value: WorkerContextValue = {
    workerData,
    loading,
    error,
    fetchWorker,
    fetchWorkers,
    handleCoverImageUpdate,
    handleProfileImageUpdate,
    handleVideoReelUpload,
    updateWorkerInfo,
    updateWorkerCategories,
  };

  return React.createElement(WorkerContext.Provider, { value }, children);
};
