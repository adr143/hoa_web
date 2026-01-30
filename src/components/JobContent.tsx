"use client";
import React from "react";

interface JobContentProps {
  job: any;
}

export const JobContent: React.FC<JobContentProps> = ({ job }) => {
  return (
    <>
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Job Description</h2>
        <p className="text-gray-600 mb-4">{job.description}</p>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Responsibilities</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          {job.responsibilities.map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Requirements</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          {job.requirements.map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </>
  );
};
