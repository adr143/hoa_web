import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { XIcon, CalendarIcon, ClockIcon, DollarSignIcon, UserIcon, CheckCircleIcon, XCircleIcon, StarIcon, MessageSquareIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ProposalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: any | null;
  role: 'worker' | 'employer';
  onAccept?: (proposal: any) => Promise<void>;
  onReject?: (proposal: any) => Promise<void>;
  onCancel?: (proposal: any) => Promise<void>;
  onStatusChange?: (proposal: any, newStatus: 'in-progress' | 'completed') => Promise<void>;
  onReviewSubmitted?: () => void;
}

export const ProposalDetailModal = ({ isOpen, onClose, proposal, role, onAccept, onReject, onCancel, onStatusChange, onReviewSubmitted }: ProposalDetailModalProps) => {
  const router = useRouter();
  const { user } = useAuth();

  // Review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);

  const status = proposal ? (proposal.status || 'pending').toLowerCase() : 'pending';

  // Check if employer has already reviewed this worker for this proposal
  useEffect(() => {
    if (!isOpen || !proposal) return;
    const checkExistingReview = async () => {
      if (role === 'employer' && user && proposal.worker_id) {
        try {
          const { data, error } = await supabase
            .from('review')
            .select('*')
            .eq('worker_id', proposal.worker_id)
            .eq('employer_id', user.id)
            .eq('proposal_id', proposal.id)
            .maybeSingle();

          if (!error && data) {
            setHasReviewed(true);
            setExistingReview(data);
          }
        } catch (err) {
          console.error('Failed to check existing review:', err);
        }
      }
    };

    checkExistingReview();
  }, [isOpen, role, user, proposal?.worker_id, proposal?.id]);

  // Submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !proposal.worker_id) {
      alert('Unable to submit review. Missing user or worker information.');
      return;
    }

    if (!reviewContent.trim()) {
      alert('Please enter a review message.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const payload = {
        worker_id: proposal.worker_id,
        employer_id: user.id,
        proposal_id: proposal.id,
        author: user.name || user.email || 'Employer',
        rating: reviewRating,
        content: reviewContent,
        date: new Date().toISOString(),
      };

      const { error } = await supabase.from('review').insert(payload);
      if (error) throw error;

      alert('Review submitted successfully! Thank you for your feedback.');
      setHasReviewed(true);
      setShowReviewForm(false);
      setReviewContent('');
      setReviewRating(5);

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!isOpen || !proposal) return null;

  const statusConfig = {
    'accepted': { bg: 'bg-green-100', text: 'text-green-800', label: 'Accepted', icon: CheckCircleIcon },
    'approved': { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved', icon: CheckCircleIcon },
    'rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Declined', icon: XCircleIcon },
    'in-progress': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress', icon: ClockIcon },
    'completed': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Completed', icon: CheckCircleIcon },
    'expired': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Expired', icon: XCircleIcon },
    'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: ClockIcon }
  };
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  const handleViewProfile = () => {
    if (role === 'worker' && proposal.employer_id) {
      router.push(`/employer/${proposal.employer_id}`);
    } else if (role === 'employer' && proposal.worker_id) {
      router.push(`/worker/${proposal.worker_id}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">{proposal.title || 'Job Proposal'}</h3>
              <div className="flex items-center gap-2 text-teal-50">
                <UserIcon size={16} />
                <span className="text-sm">
                  {role === 'worker'
                    ? `From: ${proposal.employer?.profile?.name || proposal.employer_name || 'Employer'}`
                    : `To: ${proposal.worker?.profile?.name || proposal.worker_name || 'Worker'}`
                  }
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`${config.bg} ${config.text} px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5`}>
                <StatusIcon size={16} />
                {config.label}
              </span>
              <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
                <XIcon size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h4>
            <p className="text-gray-700 leading-relaxed">{proposal.description || 'No description provided.'}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <DollarSignIcon size={18} />
                <span className="text-sm font-medium">Rate</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {proposal.rate ? `₱${proposal.rate}` : 'Negotiable'}
              </p>
              {proposal.rate_type && (
                <p className="text-sm text-gray-600 mt-1">per {proposal.rate_type}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <CalendarIcon size={18} />
                <span className="text-sm font-medium">Start Date</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {proposal.start_date ? new Date(proposal.start_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'To be determined'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <ClockIcon size={18} />
                <span className="text-sm font-medium">Duration</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {proposal.duration || 'Not specified'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <CalendarIcon size={18} />
                <span className="text-sm font-medium">Expires On</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {proposal.expires_at ? new Date(proposal.expires_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'No expiration'}
              </p>
            </div>
          </div>

          {/* View Profile Button */}
          <div className="mb-6">
            <button
              onClick={handleViewProfile}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <UserIcon size={18} />
              View {role === 'worker' ? 'Employer' : 'Worker'} Profile
            </button>
          </div>

          {/* Review Section - Only for employers when proposal is completed */}
          {role === 'employer' && status === 'completed' && (
            <div className="mb-6 border-t border-gray-200 pt-6">
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 border border-teal-200">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquareIcon size={24} className="text-teal-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    {hasReviewed ? 'Your Review' : 'Leave a Review'}
                  </h3>
                </div>

                {hasReviewed && existingReview ? (
                  // Display existing review
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            size={20}
                            className={`${i < existingReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(existingReview.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-700">{existingReview.content}</p>
                    <p className="text-xs text-gray-500 mt-2">✓ Review submitted</p>
                  </div>
                ) : showReviewForm ? (
                  // Review form
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setReviewRating(rating)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <StarIcon
                              size={32}
                              className={`${
                                rating <= reviewRating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {reviewRating} {reviewRating === 1 ? 'star' : 'stars'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Review
                      </label>
                      <textarea
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                        rows={4}
                        placeholder="Share your experience working with this professional..."
                        required
                      />
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                ) : (
                  // Show review button
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="w-full bg-white hover:bg-gray-50 text-teal-600 font-medium py-3 rounded-lg transition-colors border-2 border-teal-500 flex items-center justify-center gap-2"
                  >
                    <StarIcon size={18} />
                    Write a Review
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-end border-t border-gray-200 pt-6">
            {/* Employer actions for accepted proposals */}
            {role === 'employer' && (status === 'accepted' || status === 'approved' || status === 'in-progress') && onStatusChange && (
              <>
                {status !== 'in-progress' && (
                  <button
                    onClick={() => onStatusChange(proposal, 'in-progress')}
                    className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    Mark as In Progress
                  </button>
                )}
                {(status === 'in-progress' || status === 'accepted' || status === 'approved') && (
                  <button
                    onClick={() => onStatusChange(proposal, 'completed')}
                    className="px-5 py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
                  >
                    Mark as Completed
                  </button>
                )}
              </>
            )}

            {/* Employer cancel action */}
            {role === 'employer' && onCancel && status === 'pending' && (
              <button
                onClick={() => onCancel(proposal)}
                className="px-5 py-2.5 border-2 border-red-500 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
              >
                Cancel Proposal
              </button>
            )}

            {/* Worker accept/reject actions */}
            {role === 'worker' && status === 'pending' && (
              <>
                <button
                  onClick={() => onReject && onReject(proposal)}
                  className="px-5 py-2.5 border-2 border-red-500 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => onAccept && onAccept(proposal)}
                  className="px-5 py-2.5 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
                >
                  Accept Proposal
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetailModal;
