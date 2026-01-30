import React from 'react';
import Link from 'next/link';
import { 
  MapPinIcon, 
  CalendarIcon, 
  BriefcaseIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  SparklesIcon,
  DollarSignIcon,
  BuildingIcon
} from 'lucide-react';
import { JobRecommendation } from '@/hooks/useRecommendations';

interface JobRecommendationCardProps {
  recommendation: JobRecommendation;
  showMatchScore?: boolean;
}

export function JobRecommendationCard({ 
  recommendation, 
  showMatchScore = true 
}: JobRecommendationCardProps) {
  const { job, matchScore } = recommendation;

  // Determine match level
  const getMatchLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent Match', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' };
    if (score >= 60) return { label: 'Great Match', color: 'bg-teal-500', textColor: 'text-teal-700', bgColor: 'bg-teal-50' };
    if (score >= 40) return { label: 'Good Match', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' };
    return { label: 'Potential Match', color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50' };
  };

  const matchLevel = getMatchLevel(matchScore.score);

  // Format category for URL
  const categorySlug = job.category.toLowerCase().replace(/\s+/g, '-');

  return (
    <Link href={`/jobs/${categorySlug}/${job.id}`}>
      <div className="bg-white rounded-lg border border-gray-200 hover:border-teal-400 hover:shadow-lg transition-all duration-200 overflow-hidden group">
        {/* Match Score Banner */}
        {showMatchScore && (
          <div className={`${matchLevel.bgColor} px-4 py-2 flex items-center justify-between border-b border-gray-200`}>
            <div className="flex items-center gap-2">
              <SparklesIcon size={16} className={matchLevel.textColor} />
              <span className={`text-sm font-semibold ${matchLevel.textColor}`}>
                {matchLevel.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <TrendingUpIcon size={14} className={matchLevel.textColor} />
                <span className={`text-lg font-bold ${matchLevel.textColor}`}>
                  {matchScore.score}%
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="p-5">
          {/* Job Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                {job.employer?.logo ? (
                  <img 
                    src={job.employer.logo} 
                    alt={job.employer.company_name || 'Company'} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <BuildingIcon size={24} className="text-white" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-teal-600 transition-colors">
                {job.title}
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                {job.employer?.company_name || job.employer?.profile?.name || 'Company'}
              </p>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon size={14} />
                    {job.location}
                  </span>
                )}
                {job.employment_type && (
                  <span className="flex items-center gap-1">
                    <BriefcaseIcon size={14} />
                    {job.employment_type}
                  </span>
                )}
                {job.posted_date && (
                  <span className="flex items-center gap-1">
                    <CalendarIcon size={14} />
                    {new Date(job.posted_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {job.description}
            </p>
          )}

          {/* Salary Range */}
          {job.min_salary && job.max_salary && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              <DollarSignIcon size={16} className="text-teal-600" />
              <span className="font-semibold text-gray-900">
                ₱{job.min_salary} - ₱{job.max_salary}
              </span>
              <span className="text-gray-500">/ {job.salary_type}</span>
            </div>
          )}

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {job.tags.slice(0, 4).map((tag, idx) => (
                <span 
                  key={idx} 
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {job.tags.length > 4 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  +{job.tags.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Match Reasons */}
          {showMatchScore && matchScore.reasons.length > 0 && (
            <div className="border-t border-gray-200 pt-3 mt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Why this match?</p>
              <div className="space-y-1">
                {matchScore.reasons.slice(0, 3).map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircleIcon size={14} className="text-teal-500 flex-shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hover Action */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 group-hover:bg-teal-50 transition-colors">
          <span className="text-sm font-medium text-teal-600 group-hover:text-teal-700">
            View Job Details →
          </span>
        </div>
      </div>
    </Link>
  );
}

