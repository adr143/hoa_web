import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CheckIcon, XIcon, ClockIcon, UserIcon, FileTextIcon, PaperclipIcon, CalendarIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { JobApplication } from '@/types';

type JobApplicantsProps = {
  jobId: string;
  applicants: JobApplication[];
  onStatusChange: (applicantId: string, status: 'accepted' | 'rejected') => void;
};

export function JobApplicants({
  applicants,
  onStatusChange
}: JobApplicantsProps) {
  const [viewingApplicant, setViewingApplicant] = useState<string | null>(null);
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleViewProfile = (applicantId: string) => {
    if (!isLoggedIn) {
      router.push(`/signin?from=${encodeURIComponent(pathname)}`);
      return;
    }
    router.push(`/worker/${applicantId}`);
  };

  const currentApplicant = applicants.find(app => app.id === viewingApplicant);

  // Status configuration
  const statusConfig = {
    'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: ClockIcon },
    'reviewed': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Reviewed', icon: ClockIcon },
    'accepted': { bg: 'bg-green-100', text: 'text-green-800', label: 'Hired', icon: CheckIcon },
    'rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Declined', icon: XIcon }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-teal-500 to-teal-600 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Job Applicants
            </h2>
            <p className="text-teal-50 text-sm mt-1">
              {applicants.length} {applicants.length === 1 ? 'application' : 'applications'} received
            </p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full px-4 py-2">
            <span className="text-white font-bold text-lg">{applicants.length}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {applicants.length === 0 ? (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <UserIcon size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg mb-2">No applicants yet</p>
          <p className="text-gray-400 text-sm">Applications will appear here once workers apply for this position</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {applicants.map(applicant => {
            const status = applicant.status || 'pending';
            const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
            const StatusIcon = config.icon;

            return (
              <div key={applicant.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                      {applicant.worker?.profile_image ? (
                        <img
                          src={applicant.worker.profile_image}
                          alt={applicant.worker?.profile?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xl font-bold">
                          {applicant.worker?.profile?.name?.charAt(0) || 'A'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {applicant.worker?.profile?.name || 'Anonymous'}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon size={14} />
                            Applied {new Date(applicant.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          {applicant.attachments && applicant.attachments.length > 0 && (
                            <span className="flex items-center gap-1">
                              <PaperclipIcon size={14} />
                              {applicant.attachments.length} {applicant.attachments.length === 1 ? 'file' : 'files'}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`${config.bg} ${config.text} px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap`}>
                        <StatusIcon size={14} />
                        {config.label}
                      </span>
                    </div>

                    {/* Cover Letter Preview */}
                    {applicant.cover_letter && (
                      <p className="text-gray-600 text-sm mt-3 line-clamp-2 bg-gray-50 p-3 rounded-lg">
                        {applicant.cover_letter}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setViewingApplicant(applicant.id)}
                        className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1.5 transition-colors"
                      >
                        <FileTextIcon size={16} />
                        View Full Application
                      </button>
                      <button
                        onClick={() => handleViewProfile(applicant.worker_id ?? '')}
                        className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1.5 transition-colors"
                      >
                        <UserIcon size={16} />
                        View Profile
                      </button>

                      {status === 'pending' && (
                        <div className="ml-auto flex gap-2">
                          <button
                            onClick={() => onStatusChange(applicant.id, 'accepted')}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <CheckIcon size={16} />
                            Hire
                          </button>
                          <button
                            onClick={() => onStatusChange(applicant.id, 'rejected')}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <XIcon size={16} />
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Applicant Details Modal */}
      {viewingApplicant && currentApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingApplicant(null)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center">
                    {currentApplicant.worker?.profile_image ? (
                      <img
                        src={currentApplicant.worker.profile_image}
                        alt={currentApplicant.worker?.profile?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-2xl font-bold">
                        {currentApplicant.worker?.profile?.name?.charAt(0) || 'A'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      {currentApplicant.worker?.profile?.name || 'Anonymous'}
                    </h2>
                    <p className="text-teal-50 flex items-center gap-1.5">
                      <CalendarIcon size={16} />
                      Applied on {new Date(currentApplicant.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingApplicant(null)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XIcon size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Status Badge */}
              {currentApplicant.status && currentApplicant.status !== 'pending' && (
                <div className="mb-6">
                  {(() => {
                    const status = currentApplicant.status;
                    const config = statusConfig[status as keyof typeof statusConfig];
                    if (!config) return null;
                    const StatusIcon = config.icon;
                    return (
                      <div className={`${config.bg} ${config.text} px-4 py-3 rounded-lg flex items-center gap-2 font-semibold`}>
                        <StatusIcon size={20} />
                        Application Status: {config.label}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Cover Letter */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <FileTextIcon size={18} />
                  Cover Letter
                </h4>
                <div className="bg-gray-50 border border-gray-200 p-5 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {currentApplicant.cover_letter || 'No cover letter provided.'}
                  </p>
                </div>
              </div>

              {/* Attachments */}
              {currentApplicant.attachments && currentApplicant.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <PaperclipIcon size={18} />
                    Attachments
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 p-5 rounded-lg">
                    <div className="space-y-2">
                      {currentApplicant.attachments.map((attachment, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-gray-700">
                          <PaperclipIcon size={16} className="text-gray-400" />
                          <span className="text-sm">{attachment}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 justify-end border-t border-gray-200 pt-6">
                <button
                  onClick={() => handleViewProfile(currentApplicant.worker_id ?? '')}
                  className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <UserIcon size={18} />
                  View Worker Profile
                </button>

                {currentApplicant.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        onStatusChange(currentApplicant.id, 'rejected');
                        setViewingApplicant(null);
                      }}
                      className="px-5 py-2.5 border-2 border-red-500 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <XIcon size={18} />
                      Decline Application
                    </button>
                    <button
                      onClick={() => {
                        onStatusChange(currentApplicant.id, 'accepted');
                        setViewingApplicant(null);
                      }}
                      className="px-5 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <CheckIcon size={18} />
                      Hire Applicant
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}