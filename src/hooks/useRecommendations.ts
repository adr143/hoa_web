import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Worker } from '@/types/worker';
import { Job } from '@/types/job';

export interface MatchScore {
  score: number;
  reasons: string[];
  categoryMatch: boolean;
  locationMatch: boolean;
  skillsMatch: number;
  experienceMatch: boolean;
  salaryMatch: boolean;
  travelDistanceMatch: boolean;
}

export interface WorkerRecommendation {
  worker: Worker;
  matchScore: MatchScore;
}

export interface JobRecommendation {
  job: Job;
  matchScore: MatchScore;
}

/**
 * Helper function to estimate distance between two locations (simplified)
 * In a production app, use a geocoding API like Google Maps Distance Matrix API
 */
function estimateDistance(location1: string, location2: string): number {
  // Simple heuristic: if locations share common words, they're closer
  const loc1Words = location1.toLowerCase().split(/[\s,]+/);
  const loc2Words = location2.toLowerCase().split(/[\s,]+/);

  // Check for common location identifiers
  const commonWords = loc1Words.filter(word => loc2Words.includes(word));

  // If they share city/state names, estimate closer distance
  if (commonWords.length >= 2) {
    return 10; // Assume 10km if same city/area
  } else if (commonWords.length === 1) {
    return 30; // Assume 30km if same state/region
  } else {
    return 100; // Assume 100km+ if completely different
  }
}

export function useRecommendations() {
  const [loading, setLoading] = useState(false);

  /**
   * Calculate match score between a worker and a job
   */
  const calculateMatchScore = useCallback((
    worker: Worker,
    job: Job
  ): MatchScore => {
    let score = 0;
    const reasons: string[] = [];
    let categoryMatch = false;
    let locationMatch = false;
    let skillsMatch = 0;
    let experienceMatch = false;
    let salaryMatch = false;
    let travelDistanceMatch = false;

    // 1. Category Match (30 points)
    if (worker.category && Array.isArray(worker.category)) {
      if (worker.category.includes(job.category)) {
        score += 30;
        categoryMatch = true;
        reasons.push(`Specializes in ${job.category}`);
      }
    }

    // 2. Location & Travel Distance Match (25 points)
    if (worker.location && job.location) {
      const workerLoc = worker.location.toLowerCase();
      const jobLoc = job.location.toLowerCase();

      // Exact match
      if (workerLoc === jobLoc) {
        score += 25;
        locationMatch = true;
        travelDistanceMatch = true;
        reasons.push('Same location');
      }
      // Partial match (same city/area)
      else if (workerLoc.includes(jobLoc) || jobLoc.includes(workerLoc)) {
        score += 20;
        locationMatch = true;
        travelDistanceMatch = true;
        reasons.push('Nearby location');
      }
      // Check if worker's travel distance preference allows this job
      else if (worker.travel_distance && worker.travel_distance > 0) {
        // Estimate distance based on location strings (simplified approach)
        // In a real app, you'd use a geocoding API to calculate actual distance
        const estimatedDistance = estimateDistance(workerLoc, jobLoc);

        if (estimatedDistance <= worker.travel_distance) {
          score += 15;
          locationMatch = true;
          travelDistanceMatch = true;
          reasons.push(`Within ${worker.travel_distance}km travel range`);
        } else if (estimatedDistance <= worker.travel_distance * 1.2) {
          // Slightly outside range but close
          score += 8;
          locationMatch = true;
          reasons.push(`Near travel range (${worker.travel_distance}km)`);
        }
      }
    }

    // 3. Skills Match (20 points)
    if (worker.skills && worker.skills.length > 0 && job.requirements && job.requirements.length > 0) {
      const workerSkills = worker.skills.map(s => s.toLowerCase());
      const jobRequirements = job.requirements.map(r => r.toLowerCase());

      let matchedSkills = 0;
      const matchedSkillNames: string[] = [];

      jobRequirements.forEach(req => {
        workerSkills.forEach(skill => {
          if (req.includes(skill) || skill.includes(req)) {
            matchedSkills++;
            matchedSkillNames.push(skill);
          }
        });
      });

      if (matchedSkills > 0) {
        const skillScore = Math.min(20, (matchedSkills / jobRequirements.length) * 20);
        score += skillScore;
        skillsMatch = matchedSkills;
        reasons.push(`${matchedSkills} matching skill${matchedSkills > 1 ? 's' : ''}`);
      }
    }

    // 4. Experience Match (15 points)
    if (worker.experience && worker.experience.length > 0) {
      score += 15;
      experienceMatch = true;
      reasons.push(`${worker.experience.length}+ years experience`);
    } else if (worker.work_history && worker.work_history.length > 0) {
      score += 10;
      experienceMatch = true;
      reasons.push('Has work history');
    }

    // 5. Salary/Rate Match (10 points)
    if (worker.hourly_rate && job.min_salary && job.max_salary) {
      try {
        const workerRate = parseFloat(worker.hourly_rate.replace(/[^0-9.]/g, ''));
        const minSalary = parseFloat(job.min_salary.replace(/[^0-9.]/g, ''));
        const maxSalary = parseFloat(job.max_salary.replace(/[^0-9.]/g, ''));

        if (job.salary_type === 'hourly') {
          if (workerRate >= minSalary && workerRate <= maxSalary) {
            score += 10;
            salaryMatch = true;
            reasons.push('Rate within budget');
          } else if (workerRate <= maxSalary * 1.2) {
            score += 5;
            salaryMatch = true;
            reasons.push('Rate close to budget');
          }
        }
      } catch (e) {
        // Skip if parsing fails
      }
    }

    return {
      score: Math.round(score),
      reasons,
      categoryMatch,
      locationMatch,
      skillsMatch,
      experienceMatch,
      salaryMatch,
      travelDistanceMatch
    };
  }, []);

  /**
   * Get recommended workers for a specific job
   */
  const getRecommendedWorkersForJob = useCallback(async (
    jobId: string,
    limit = 10
  ): Promise<WorkerRecommendation[]> => {
    setLoading(true);
    try {
      // Fetch the job
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        console.error('Job not found:', jobError);
        return [];
      }

      // Fetch all workers
      const { data: workers, error: workersError } = await supabase
        .from('workers')
        .select('*');

      if (workersError || !workers) {
        console.error('Error fetching workers:', workersError);
        return [];
      }

      // Calculate match scores for each worker
      const recommendations: WorkerRecommendation[] = workers
        .map(worker => ({
          worker,
          matchScore: calculateMatchScore(worker, job)
        }))
        .filter(rec => rec.matchScore.score > 20) // Only include decent matches
        .sort((a, b) => b.matchScore.score - a.matchScore.score)
        .slice(0, limit);

      return recommendations;
    } catch (error) {
      console.error('Error getting worker recommendations:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [calculateMatchScore]);

  /**
   * Get recommended jobs for a specific worker
   */
  const getRecommendedJobsForWorker = useCallback(async (
    workerId: string,
    limit = 10
  ): Promise<JobRecommendation[]> => {
    setLoading(true);
    try {
      // Fetch the worker
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('id', workerId)
        .single();

      if (workerError || !worker) {
        console.error('Worker not found:', workerError);
        return [];
      }

      // Fetch all active jobs with employer info
      const { data: jobs, error: jobsError } = await supabase
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

      if (jobsError || !jobs) {
        console.error('Error fetching jobs:', jobsError);
        return [];
      }

      // Calculate match scores for each job
      const recommendations: JobRecommendation[] = jobs
        .map(job => ({
          job,
          matchScore: calculateMatchScore(worker, job)
        }))
        .filter(rec => rec.matchScore.score > 20) // Only include decent matches
        .sort((a, b) => b.matchScore.score - a.matchScore.score)
        .slice(0, limit);

      return recommendations;
    } catch (error) {
      console.error('Error getting job recommendations:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [calculateMatchScore]);

  /**
   * Get top workers across all categories
   */
  const getTopWorkers = useCallback(async (
    category?: string,
    limit = 10
  ): Promise<Worker[]> => {
    setLoading(true);
    try {
      let query = supabase
        .from('workers')
        .select('*')
        .order('rating', { ascending: false });

      if (category) {
        query = query.contains('category', [category]);
      }

      const { data: workers, error } = await query.limit(limit);

      if (error) {
        console.error('Error fetching top workers:', error);
        return [];
      }

      return workers || [];
    } catch (error) {
      console.error('Error getting top workers:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    calculateMatchScore,
    getRecommendedWorkersForJob,
    getRecommendedJobsForWorker,
    getTopWorkers
  };
}

