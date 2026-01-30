"use client";
import React from "react";
import { TagIcon, ClockIcon, CalendarIcon } from "lucide-react";
import { Job } from "@/types";

interface JobDetailsCardProps {
  job: Job;
}

export const JobDetailsCard: React.FC<JobDetailsCardProps> = ({ job }) => {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Job Details</h3>
      <div className="space-y-3 text-sm text-gray-600">
        <p className="flex items-start">
          <TagIcon size={16} className="mr-2 mt-1 flex-shrink-0" />
          <span><strong className="text-gray-700">Category: </strong>{job.category} / {job.subcategory}</span>
        </p>
        <p className="flex items-start">
          <ClockIcon size={16} className="mr-2 mt-1 flex-shrink-0" />
          <span><strong className="text-gray-700">Job Type: </strong>{job.employment_type}</span>
        </p>
        <p className="flex items-start">
          <span className="text-gray-700"><strong>Salary: </strong>Php{job.min_salary} - Php{job.max_salary}</span>
        </p>
        <p className="flex items-start">
          <CalendarIcon size={16} className="mr-2 mt-1 flex-shrink-0" />
          <span><strong>Posted: </strong>{job.posted_date ? new Date(job.posted_date).toLocaleDateString() : 'N/A'}</span>
        </p>
        <p className="flex items-start">
          <CalendarIcon size={16} className="mr-2 mt-1 flex-shrink-0" />
          <span><strong>Deadline: </strong>{job.posted_date && job.expiration_days ? new Date(new Date(job.posted_date).getTime() + job.expiration_days * 24 * 60 * 60 * 1000).toLocaleDateString() : 'N/A'}</span>
        </p>
        <div className="pt-2 flex flex-wrap gap-2">
          {job.tags.map((tag: string, index: number) => (
            <span key={index} className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
