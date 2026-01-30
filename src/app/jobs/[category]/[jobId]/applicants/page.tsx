'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, BriefcaseIcon, MapPinIcon, CalendarIcon, UsersIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useJobs } from '@/hooks/useJobs';
import { useJobApplications } from '@/hooks/useJobApplication';
import { useNotifications } from '@/hooks/useNotifications';
import { JobApplicants } from '@/components/JobApplicants';
import { Job, JobApplication } from '@/types';
import { supabase } from '@/lib/supabase';

export default function JobApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const { category, jobId } = params;
  const { isLoggedIn, user } = useAuth();
  const { fetchJob } = useJobs();
  const { fetchApplications } = useJobApplications();
  const { sendNotification } = useNotifications();

  const [job, setJob] = useState<Job | undefined>(undefined);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // Fetch job details
  useEffect(() => {
    if (!jobId || typeof jobId !== 'string') return;

    const loadJob = async () => {
      try {
        const jobData = await fetchJob(jobId);
        setJob(jobData || undefined);

        if (isLoggedIn && user && user.id === jobData?.employer?.id) {
          setIsOwner(true);
        } else {
          // Redirect if not the owner
          router.push(`/jobs/${category}/${jobId}`);
        }
      } catch (error) {
        console.error('Error loading job:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [jobId, isLoggedIn, user, fetchJob, router, category]);

  // Fetch applications
  useEffect(() => {
    if (isOwner && job?.id) {
      fetchApplications(undefined, job.id).then((apps) => {
        setApplications(apps);
      });
    }
  }, [isOwner, job, fetchApplications]);

  const handleApplicantStatusChange = async (
    applicantId: string,
    status: "accepted" | "rejected"
  ) => {
    try {
      // Find the application to get worker details
      const application = applications.find(app => app.id === applicantId);
      if (!application) {
        alert("Application not found");
        return;
      }

      // Map status to database format
      const dbStatus = status === "accepted" ? "accepted" : "rejected";

      // Update in Supabase
      const { error } = await supabase
        .from("applications")
        .update({ 
          status: dbStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", applicantId);

      if (error) throw error;

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicantId ? { ...app, status: dbStatus as any } : app
        )
      );

      // Send notification to worker
      if (application.worker_id) {
        try {
          await sendNotification(application.worker_id, {
            type: 'new_application',
            title: status === "accepted" ? 'Congratulations! You\'re Hired' : 'Application Update',
            message: status === "accepted" 
              ? `You have been hired for the position: ${job?.title}` 
              : `Your application for ${job?.title} has been declined`,
            sender_id: user?.id,
            link: `/jobs/${job?.category}/${job?.id}`,
          } as any);
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
      }

      alert(status === "accepted" ? "Applicant hired successfully!" : "Application declined");
    } catch (err) {
      console.error('Failed to update application status:', err);
      alert('Failed to update application status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applicants...</p>
        </div>
      </div>
    );
  }

  if (!job || !isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push(`/jobs/${category}/${jobId}`)}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-4 font-medium transition-colors"
          >
            <ArrowLeftIcon size={20} />
            Back to Job Details
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
                <BriefcaseIcon size={32} className="text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <span className="flex items-center gap-1.5">
                  <MapPinIcon size={18} />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarIcon size={18} />
                  Posted {job.posted_date ? new Date(job.posted_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Recently'}
                </span>
                <span className="flex items-center gap-1.5">
                  <UsersIcon size={18} />
                  {applications.length} {applications.length === 1 ? 'Applicant' : 'Applicants'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JobApplicants
          jobId={job.id || ''}
          applicants={applications}
          onStatusChange={handleApplicantStatusChange}
        />
      </div>
    </div>
  );
}

