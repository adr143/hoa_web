import React from 'react';
import Link from 'next/link';
import { 
  StarIcon, 
  MapPinIcon, 
  BriefcaseIcon, 
  CheckCircleIcon,
  TrendingUpIcon,
  SparklesIcon
} from 'lucide-react';
import { WorkerRecommendation } from '@/hooks/useRecommendations';

interface WorkerRecommendationCardProps {
  recommendation: WorkerRecommendation;
  showMatchScore?: boolean;
}

export function WorkerRecommendationCard({ 
  recommendation, 
  showMatchScore = true 
}: WorkerRecommendationCardProps) {
  const { worker, matchScore } = recommendation;

  // Determine match level
  const getMatchLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent Match', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' };
    if (score >= 60) return { label: 'Great Match', color: 'bg-teal-500', textColor: 'text-teal-700', bgColor: 'bg-teal-50' };
    if (score >= 40) return { label: 'Good Match', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' };
    return { label: 'Potential Match', color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50' };
  };

  const matchLevel = getMatchLevel(matchScore.score);

  return (
    <Link href={`/worker/${worker.id}`}>
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
          {/* Worker Info */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                {worker.profile_image ? (
                  <img 
                    src={worker.profile_image} 
                    alt={worker.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-white text-xl font-bold">
                    {worker.name?.charAt(0) || 'W'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-teal-600 transition-colors">
                {worker.name}
              </h3>
              <p className="text-gray-600 text-sm mb-2">{worker.title}</p>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                {worker.rating > 0 && (
                  <span className="flex items-center gap-1">
                    <StarIcon size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-gray-700">{worker.rating.toFixed(1)}</span>
                  </span>
                )}
                {worker.location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon size={14} />
                    {worker.location}
                  </span>
                )}
                {worker.hourly_rate && (
                  <span className="flex items-center gap-1">
                    <BriefcaseIcon size={14} />
                    {worker.hourly_rate}/hr
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {worker.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {worker.description}
            </p>
          )}

          {/* Skills */}
          {worker.skills && worker.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {worker.skills.slice(0, 4).map((skill, idx) => (
                <span 
                  key={idx} 
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
              {worker.skills.length > 4 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  +{worker.skills.length - 4} more
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
            View Profile →
          </span>
        </div>
      </div>
    </Link>
  );
}

