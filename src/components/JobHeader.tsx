"use client";
import React from "react";
import { MapPinIcon, ClockIcon, TagIcon, AlertCircleIcon } from "lucide-react";
import Link from "next/link";
import { useRouter} from "next/navigation";
import { Job } from "@/types";

interface JobHeaderProps {
  job: Job;
  isOwner: boolean;
  applyModalOpen: boolean;
  setApplyModalOpen: (open: boolean) => void;
  confirmCloseJobOpen: boolean;
  setConfirmCloseJobOpen: (open: boolean) => void;
}

export const JobHeader: React.FC<JobHeaderProps> = ({
  job,
  isOwner,
  setApplyModalOpen,
  setConfirmCloseJobOpen,
}) => {
  const router = useRouter();

  return (
    <>
      {job.status === "inactive" && (
        <div className="bg-red-50 p-3 flex items-center justify-center border-b border-red-100">
          <AlertCircleIcon size={18} className="text-red-500 mr-2" />
          <span className="text-red-700 font-medium">
            This job posting has been closed and is no longer accepting applications
          </span>
        </div>
      )}
      <div className={`p-6 ${job.status === "active" ? "bg-teal-50" : "bg-gray-50"} border-b border-gray-200`}>
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="mb-4 md:mb-0 md:mr-6">
            <Link href={`/employer/${job.employer?.id}`}>
              <img src={job.employer?.logo} alt={job.employer?.company_name} className="w-16 h-16 rounded-full border border-gray-200" />
            </Link>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center text-gray-600">
                <MapPinIcon size={16} className="mr-1" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <ClockIcon size={16} className="mr-1" />
                <span>{job.employment_type}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <TagIcon size={16} className="mr-1" />
                <span>{job.category}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0 md:ml-4">
            {isOwner ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => router.push(`/jobs/edit/${job.id}`)}
                  className="bg-teal-500 text-white px-4 py-2 rounded-md font-medium hover:bg-teal-600 transition-colors"
                >
                  Edit Job
                </button>
                {job.status === "active" && (
                  <button
                    onClick={() => setConfirmCloseJobOpen(true)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-600 transition-colors"
                  >
                    Close Job
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setApplyModalOpen(true)}
                className={`bg-teal-500 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-sm ${job.status === "active" ? "hover:bg-teal-600" : "opacity-50 cursor-not-allowed"}`}
                disabled={job.status !== "active"}
              >
                {job.status === "active" ? "Apply Now" : "Job Closed"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
