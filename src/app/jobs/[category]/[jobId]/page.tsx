"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { JobApplicants } from "@/components/JobApplicants";
import { ApplyModal } from "@/components/ApplyModal";
import { CloseJobModal } from "@/components//CloseJobModal";
import { JobHeader } from "@/components//JobHeader";
import { JobContent } from "@/components//JobContent";
import { EmployerCard } from "@/components//EmployerCard";
import { JobDetailsCard } from "@/components//JobDetailsCard";
import { useJobs } from "@/hooks/useJobs";
import { useJobApplications } from "@/hooks/useJobApplication";
import { useNotifications } from "@/hooks/useNotifications";
import { JobApplication } from "@/types";
import { Job } from "@/types";

// Icons
import { HomeIcon, ChevronRightIcon } from "lucide-react";

export default function JobDetail() {
  const params = useParams();
  const { jobId } = params;
  const { fetchJob } = useJobs();
  const { fetchApplications, applyForJob } = useJobApplications();
  const { sendNotification } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();

  const [job, setJob] = useState<Job | undefined>(undefined);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [employer, setEmployer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [confirmCloseJobOpen, setConfirmCloseJobOpen] = useState(false);

  // Fetch job + employer from Supabase
  useEffect(() => {
    if (!jobId || typeof jobId !== 'string') return;
    const job = fetchJob(jobId);
    job.then((job) => {
      setJob(job || undefined);
      setEmployer(job?.employer || null);
      if (isLoggedIn && user && user.id === job?.employer?.id) {
        setIsOwner(true);
      }
      setLoading(false);
    });
  }, [jobId, isLoggedIn, user, fetchJob]);

  useEffect(() => {
    if (isOwner && job?.id) {
      fetchApplications(undefined, job.id).then((apps) => {
        setApplications(apps);
      });
    }
  }, [isOwner, job, fetchApplications, user]);

  const handleApply = async (data: any, files?: FileList) => {
    if (!isLoggedIn) {
      router.push(`/signin?from=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!job?.id) return;

    try {
      if (files && files.length > 0) {
        for (const file of Array.from(files)) {
          await supabase.storage
            .from("applications")
            .upload(`job_${job.id}/worker_${user!.id}/${file.name}`, file);
        }
      }

      await applyForJob({
        job_id: job.id,
        worker_id: user!.id,
        attachments: files ? Array.from(files).map((file) => file.name) : [],
        cover_letter: data.cover_letter,
        status: "pending",
      });
      
      setApplyModalOpen(false);
      alert("Application submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit application.");
    }
  };

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
        .from("job_applications")
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

  const handleCloseJob = async () => {
    setJob((prevJob: any) => ({ ...prevJob, status: "Closed" }));
    setConfirmCloseJobOpen(false);

    await supabase.from("jobs").update({ status: "Closed" }).eq("id", job?.id);
  };

  if (loading) return <LoadingSkeleton />;

  if (!job)
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Job Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The job post you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push("/jobs")}
              className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      </div>
    );

  const breadcrumbItems = [
    { label: "Jobs", path: "/jobs" },
    {
      label: job.category,
      path: `/jobs/${job.category.toLowerCase().replace(/\s+/g, "-")}`,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} current={job.title} />

        <JobHeader
          job={job}
          isOwner={isOwner}
          applyModalOpen={applyModalOpen}
          setApplyModalOpen={setApplyModalOpen}
          confirmCloseJobOpen={confirmCloseJobOpen}
          setConfirmCloseJobOpen={setConfirmCloseJobOpen}
        />

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <JobContent job={job} />
          </div>
          <div className="space-y-6">
            <EmployerCard employer={employer} employerId={job.employer?.id ?? ''} />
            <JobDetailsCard job={job} />
          </div>
        </div>

        {isOwner && job.id && (
          <div className="mt-8">
            <JobApplicants
              jobId={job.id}
              applicants={applications}
              onStatusChange={handleApplicantStatusChange}
            />
          </div>
        )}

        {!isOwner && job.status === "active" && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setApplyModalOpen(true)}
              className="bg-teal-500 text-white px-8 py-3 rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm"
            >
              Apply for this Job
            </button>
          </div>
        )}

        {applyModalOpen && (
          <ApplyModal
            job={job}
            handleApply={handleApply}
            setApplyModalOpen={setApplyModalOpen}
          />
        )}

        {confirmCloseJobOpen && (
          <CloseJobModal
            setConfirmCloseJobOpen={setConfirmCloseJobOpen}
            handleCloseJob={handleCloseJob}
          />
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Breadcrumb({
  items,
  current,
}: {
  items: { label: string; path: string }[];
  current: string;
}) {
  return (
    <nav
      className="flex items-center text-sm text-gray-500 mb-6"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center flex-wrap">
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center hover:text-teal-600 transition-colors"
          >
            <HomeIcon className="mr-1 w-4 h-4" />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRightIcon className="mx-2 w-4 h-4" />
            <Link
              href={item.path}
              className="hover:text-teal-600 transition-colors capitalize"
            >
              {item.label}
            </Link>
          </li>
        ))}
        <li className="flex items-center">
          <ChevronRightIcon className="mx-2 w-4 h-4" />
          <span className="text-gray-700 font-medium truncate max-w-[200px]">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  );
}
