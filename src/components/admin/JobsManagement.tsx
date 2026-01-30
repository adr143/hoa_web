'use client';

import React from 'react';
import { TrashIcon, EyeIcon, EyeOffIcon, BriefcaseIcon } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  status: string;
  employer?: {
    company_name?: string;
    logo?: string;
  };
  location?: string;
  created_at?: string;
  employment_type?: string;
}

interface JobsManagementProps {
  jobs: Job[];
  onDeleteJob: (jobId: string) => void;
  onToggleStatus: (jobId: string, currentStatus: string) => void;
}

export function JobsManagement({ jobs, onDeleteJob, onToggleStatus }: JobsManagementProps) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Job Posts Management</h2>
        <div className="text-sm text-gray-600">
          Total: {jobs.length} | Active: {jobs.filter(j => j.status === 'active').length}
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <BriefcaseIcon size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No jobs found</p>
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {job.employer?.logo && (
                          <img
                            src={job.employer.logo}
                            alt=""
                            className="w-8 h-8 rounded-full mr-2"
                          />
                        )}
                        <span className="text-sm text-gray-900">
                          {job.employer?.company_name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{job.location || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {job.employment_type || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          job.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button
                        onClick={() => onToggleStatus(job.id, job.status)}
                        className="text-blue-600 hover:text-blue-900"
                        title={job.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {job.status === 'active' ? (
                          <EyeOffIcon size={18} />
                        ) : (
                          <EyeIcon size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => onDeleteJob(job.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

