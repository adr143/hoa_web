'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { MapPinIcon, StarIcon, ClockIcon, CheckCircleIcon, MessageSquareIcon } from 'lucide-react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useWorker } from '@/hooks/useWorker';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Worker, ActiveProposal } from '@/types/worker';
import { supabase } from '@/lib/supabase';
import CreateProposalModal from '@/components/CreateProposalModal';

export default function WorkerDetail() {
  const {
    slug
  } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const {
    isLoggedIn,
    user
  } = useAuth();
  const {
    workerData,
    fetchWorker
  } = useWorker();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobProposalOpen, setJobProposalOpen] = useState(false);
  const [eligibleToReview, setEligibleToReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [_employerTier, setEmployerTier] = useState<string | null>(null);
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
    const checkEmployerTier = async () => {
      if (!user || user.account_type !== 'employer') {
        setIsRestricted(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('employers')
          .select('tier, verified')
          .eq('user_id', user.id)
          .single();
        if (error) throw error;
        setEmployerTier(data?.tier || 'Free Tier');
        setIsRestricted(!data?.verified && data?.tier === 'Free Tier');
      } catch (err) {
        console.error('Failed to check employer tier:', err);
        setIsRestricted(true);
      }
    };
    checkEmployerTier();
  }, [user]);

  useEffect(() => {
        const loadWorker = async () => {
          if (!slug || typeof slug !== 'string') return;
          try {
            await fetchWorker(slug);
            setWorker(workerData);
          } catch (error) {
            console.error('Failed to fetch worker data:', error);
          }
        };
        loadWorker();
        if (worker) {
          setLoading(false);
        }
      }, [slug, fetchWorker, workerData, worker]);

      const averageRating = useMemo(() => {
        if (!worker || !Array.isArray(worker.reviews) || worker.reviews.length === 0) return 0;
        const sum = worker.reviews.reduce((acc: number, r: { rating?: number }) => acc + (Number(r.rating) || 0), 0);
        return sum / worker.reviews.length;
      }, [worker]);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!user || user.account_type !== 'employer' || !workerData) {
        setEligibleToReview(false);
        return;
      }

      try {
        const { data: completedProposals, error: completedError } = await supabase
          .from('active_proposals')
          .select('id')
          .eq('worker_id', workerData.id)
          .eq('employer_id', user.id)
          .eq('status', 'completed')
          .limit(1);

        if (completedError) throw completedError;

        if (completedProposals && completedProposals.length > 0) {
          setEligibleToReview(true);
        } else {
          const { data: appData, error: appError } = await supabase
            .from('job_applications')
            .select('id, status, job:jobs(id, employer_id)')
            .eq('worker_id', workerData.id)
            .eq('status', 'accepted')
            .limit(1);

          if (appError) throw appError;
          const found = (appData || []).some((a: { job?: Array<{ id?: string; employer_id?: string }> }) => Array.isArray(a.job) && a.job.some(j => j.employer_id === user.id));

          if (found) {
            setEligibleToReview(true);
          } else {
            const { data: anyProposals, error: anyPropError } = await supabase
              .from('active_proposals')
              .select('id')
              .eq('worker_id', workerData.id)
              .eq('employer_id', user.id)
              .in('status', ['approved', 'in-progress'])
              .limit(1);

            if (anyPropError) throw anyPropError;
            setEligibleToReview(Boolean(anyProposals && anyProposals.length > 0));
          }
        }

        const { data: reviewData } = await supabase
          .from('review')
          .select('id')
          .eq('worker_id', workerData.id)
          .eq('employer_id', user.id)
          .limit(1);
        setHasReviewed(Boolean(reviewData && reviewData.length > 0));
      } catch (err) {
        console.error('Failed to check review eligibility:', err);
        setEligibleToReview(false);
      }
    };
    checkEligibility();
  }, [user, workerData]);

  const handleContact = () => {
    if (!isLoggedIn) {
      router.push(`/signin?from=${encodeURIComponent(pathname)}`);
      return;
    }
    router.push(`/messages?to=${worker?.id ?? ''}&name=${encodeURIComponent(worker?.profile?.name || '')}`);
  };

  const handleJobProposal = () => {
    if (!isLoggedIn) {
      router.push(`/signin?from=${encodeURIComponent(pathname)}`);
      return;
    }
    setJobProposalOpen(true);
  };

  const handleProposalAction = (proposalId: string, action: 'approve' | 'reject') => {
    setWorker((prev: Worker | null) => {
      if (!prev) return prev;
      return {
        ...prev,
        active_proposals: prev.active_proposals.map((prop: ActiveProposal) => prop.id === proposalId ? { ...prop, status: action } : prop)
      } as Worker;
    });
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.account_type !== 'employer' || !workerData) {
      alert('You are not authorized to submit a review.');
      return;
    }
    if (!eligibleToReview) {
      alert('You are not eligible to review this worker.');
      return;
    }
    if (!reviewContent.trim()) {
      alert('Please enter a review message.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const payload = {
        worker_id: workerData.id,
        employer_id: user.id,
        author: user.name || user.email || 'Employer',
        rating: reviewRating,
        content: reviewContent,
        date: new Date().toISOString(),
      };

      const { error } = await supabase.from('review').insert(payload);
      if (error) throw error;

      await fetchWorker(workerData.id);
      setHasReviewed(true);
      setReviewContent('');
      setReviewRating(5);
      alert('Review submitted. Thank you!');
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16">
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
      </div>;
  }
  if (!worker) {
    return <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Worker Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The worker profile you're looking for doesn't exist or has been
              removed.
            </p>
            <button onClick={() => router.push('/workers')} className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600">
              Browse Workers
            </button>
          </div>
        </div>
      </div>;
  }
  const categoryLabel = Array.isArray(worker.category) ? worker.category[0] : worker.category;
  const categoryPath = typeof categoryLabel === 'string' ? categoryLabel.toLowerCase().replace(/\s+/g, '-') : '';
  const breadcrumbItems = [{
    label: 'workers',
    path: '/workers'
  }, {
    label: categoryLabel,
    path: `/workers/${categoryPath}`
  }];
  return <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={breadcrumbItems} currentPageLabel={worker.profile?.name} />
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-48 overflow-hidden">
            <img src={worker.cover_image} alt="Cover" className="w-full h-full object-cover" />
          </div>
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="mb-4 md:mb-0 md:mr-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md -mt-12 md:-mt-16 relative z-10 bg-white">
                  <img src={worker.profile_image} alt={worker.profile?.name} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="flex-1">
                <div className='flex gap-4'>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                  {worker.profile?.name}
                </h1>
                {workerData?.tier !== 'Basic' ?
                    <div key='tier' className="flex items-center justify-center md:justify-start">
                      <span className="w-4 h-4 sm:w-5 sm:h-5 bg-teal-100 rounded-full flex items-center justify-center mr-2">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-xs sm:text-sm text-gray-700">{workerData?.tier} Worker</span>
                    </div>:
                    <></>
                    }
                </div>
                <p className="text-gray-600 mb-2">{worker.title}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon size={16} className="mr-1" />
                    <span>{worker.location}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center text-yellow-400 mr-1">
                      <StarIcon size={16} className="fill-current" />
                      <span className="font-bold ml-1">{averageRating.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-500">
                      ({worker.reviews.length} reviews)
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <ClockIcon size={16} className="mr-1" />
                    <span>{worker.availability}</span>
                  </div>
                </div>
                {Object.values(worker.verifications).some(Boolean) && <div className="flex flex-wrap gap-2 mt-2">
                    {worker.verifications.identity && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center">
                        <CheckCircleIcon size={12} className="mr-1" />
                        ID Verified
                      </span>}
                    {worker.verifications.background && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center">
                        <CheckCircleIcon size={12} className="mr-1" />
                        Background Check
                      </span>}
                    {worker.verifications.skills && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs flex items-center">
                        <CheckCircleIcon size={12} className="mr-1" />
                        Skills Verified
                      </span>}
                  </div>}
              </div>
              {isLoggedIn && user?.account_type === 'employer' && !isRestricted && (
              <div className="mt-4 md:mt-0 md:ml-4 flex flex-col sm:flex-row gap-2">
                <button onClick={handleContact} className="bg-teal-500 text-white px-4 py-2 rounded-md font-medium hover:bg-teal-600 transition-colors">
                  Contact
                </button>
                <button onClick={handleJobProposal} className="border border-teal-500 text-teal-500 px-4 py-2 rounded-md font-medium hover:bg-teal-50 transition-colors">
                  Send Job Offer
                </button>
              </div>)}
            </div>
          </div>
          <div className="p-6">
            {isRestricted && (
              <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Upgrade to View Full Profile</h3>
                    <p className="text-gray-700 mb-4">
                      You're viewing a limited summary. Upgrade to a Paid Plan or get verified to access full details.
                    </p>
                    <button
                      onClick={() => router.push('/pricing')}
                      className="bg-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-600 transition-colors shadow-md"
                    >
                      View Pricing Plans
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Rate</h3>
                  <p className="text-gray-800 font-medium">
                    Php{worker.hourly_rate}/hr
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">
                    Experience
                  </h3>
                  <p className="text-gray-800 font-medium">
                    {worker.experience.map(
                      (exp, index) => (
                        <span key={index}>
                          {exp.title} - {exp.company} ({exp.period})
                          <br />
                          {exp.description}
                        </span>
                      )
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">
                    Category
                  </h3>
                  <p className="text-gray-800 font-medium">
                    {Array.isArray(worker.category)
                      ? worker.category.join(', ')
                      : worker.category}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {worker.skills.map((skill, index) => <span key={index} className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>)}
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                About
              </h2>
              <p className="text-gray-600 mb-6">
                {isRestricted ? worker.description.substring(0, 150) + '...' : worker.description}
              </p>
              {isRestricted && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mb-6">
                  <p className="text-gray-500">Full details available with Paid Plan or Verification</p>
                </div>
              )}
              {!isRestricted && (<>
              {worker.video_reel_path && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Video Reel</h2>
                  <div className="w-full rounded-lg overflow-hidden border border-gray-200">
                    <div className="w-full aspect-video max-h-96 bg-black">
                      <video controls preload="metadata" playsInline className="w-full h-full object-contain">
                        <source src={worker.video_reel_path} />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                </div>
              )}
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Work History
              </h2>
              <div className="space-y-4 mb-6">
                {worker.work_history.map((work, index) => <div key={index} className="border-l-2 border-teal-500 pl-4">
                    <h3 className="font-medium text-gray-800">{work.title}</h3>
                    <p className="text-gray-600 text-sm">{work.employer}</p>
                    <p className="text-gray-500 text-sm">{work.duration}</p>
                    <p className="text-gray-600 mt-1">{work.description}</p>
                  </div>)}
              </div>
              {worker.certifications.length > 0 && <>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">
                    Certifications
                  </h2>
                  <div className="space-y-3 mb-6">
                    {worker.certifications.map((cert, index) => <div key={index} className="flex items-start">
                        <div className="mr-2 mt-1">
                          <CheckCircleIcon size={18} className="text-teal-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">
                            {cert.name}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {cert.issuer}, {cert.year}
                          </p>
                        </div>
                      </div>)}
                  </div>
                </>}
              {worker.education.length > 0 && <>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">
                    Education
                  </h2>
                  <div className="space-y-3 mb-6">
                    {worker.education.map((edu, index) => <div key={index}>
                        <h3 className="font-medium text-gray-800">
                          {edu.degree}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {edu.institution}, {edu.year}
                        </p>
                      </div>)}
                  </div>
                </>}
              {worker.portfolio.length > 0 && <>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">
                    Portfolio
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {worker.portfolio.map((item, index) => <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
                        <div className="p-3">
                          <h3 className="font-medium text-gray-800">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {item.description}
                          </p>
                        </div>
                      </div>)}
                  </div>
                </>}
              </>)}

              {isRestricted && worker.reviews.length > 0 && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Reviews</h2>
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <StarIcon size={24} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-2xl font-bold text-gray-800">{averageRating.toFixed(1)}</span>
                    </div>
                    <p className="text-gray-600 mb-4">Based on {worker.reviews.length} reviews</p>
                    <p className="text-gray-500 text-sm">Upgrade to read full reviews</p>
                  </div>
                </div>
              )}

              {!isRestricted && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <MessageSquareIcon size={24} className="text-teal-500" />
                    Reviews & Feedback
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                      <StarIcon size={16} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold text-gray-800">{averageRating.toFixed(1)}</span>
                      <span className="text-gray-500 text-sm">({worker.reviews.length || 0})</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {isLoggedIn && user?.account_type === 'employer' && eligibleToReview && !hasReviewed && (
                    <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6 border-2 border-teal-200 shadow-sm">
                      <form onSubmit={submitReview} className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquareIcon size={20} className="text-teal-600" />
                          <h3 className="font-semibold text-gray-800 text-lg">Share Your Experience</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Help others by sharing your experience working with {worker.profile?.name}
                        </p>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                          <textarea
                            value={reviewContent}
                            onChange={(e) => setReviewContent(e.target.value)}
                            className="w-full border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-4 py-3 rounded-lg resize-none transition-colors"
                            rows={4}
                            placeholder="Share details about your experience, quality of work, professionalism, communication..."
                            required
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={isSubmittingReview}
                            className="px-6 py-2.5 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {isSubmittingReview ? (
                              <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Submitting...
                              </span>
                            ) : (
                              'Submit Review'
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {worker.reviews && worker.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {worker.reviews.map((review) => (
                        <div
                          key={review.id}
                          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {review.author.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800 text-lg">
                                  {review.author}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                  {new Date(review.date).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                              <StarIcon size={16} className="text-yellow-400 fill-yellow-400" />
                              <span className="font-semibold text-gray-800">{review.rating}.0</span>
                            </div>
                          </div>

                          <div className="flex mb-3">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                size={18}
                                className={`${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>

                          <p className="text-gray-700 leading-relaxed">{review.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <MessageSquareIcon size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg mb-2">No reviews yet</p>
                      <p className="text-gray-400 text-sm">
                        {isLoggedIn && user?.account_type === 'employer' && eligibleToReview
                          ? 'Be the first to leave a review'
                          : 'Reviews from employers will appear here'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              )}

              {isLoggedIn && user?.id === worker.id && worker.active_proposals?.length > 0 && <>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">
                      Job Offers
                    </h2>
                    <div className="space-y-4 mb-6">
                      {worker.active_proposals.map((proposal: ActiveProposal) => <div key={proposal.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-gray-800">
                              {proposal.title}
                            </h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                              {proposal.status === 'pending' ? 'New Offer' : proposal.status}
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm mb-2">
                            From: {proposal.employer_name}
                          </p>
                          <p className="text-gray-600 mb-3">
                            {proposal.description}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                            <div>
                              <span className="text-xs text-gray-500">
                                Rate
                              </span>
                              <p className="font-medium text-gray-800">
                                {proposal.rate}/{proposal.rate_type}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                Start Date
                              </span>
                              <p className="font-medium text-gray-800">
                                {new Date(proposal.start_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                Duration
                              </span>
                              <p className="font-medium text-gray-800">
                                {proposal.duration}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                Expires
                              </span>
                              <p className="font-medium text-gray-800">
                                {new Date(proposal.expires_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {proposal.status === 'pending' && <div className="flex justify-end space-x-2 mt-4">
                              <button onClick={() => handleProposalAction(proposal.id, 'reject')} className="border border-red-500 text-red-500 px-4 py-1 rounded-md text-sm hover:bg-red-50">
                                Decline
                              </button>
                              <button onClick={() => handleProposalAction(proposal.id, 'approve')} className="bg-teal-500 text-white px-4 py-1 rounded-md text-sm hover:bg-teal-600">
                                Accept
                              </button>
                            </div>}
                        </div>)}
                    </div>
                  </>}
            </div>
          </div>
        </div>
      </div>
      <CreateProposalModal isOpen={jobProposalOpen} onClose={() => setJobProposalOpen(false)} workerId={worker.id} onSuccess={async () => { await fetchWorker(typeof slug == 'string' ? slug : ''); setJobProposalOpen(false); }} />
    </div>;
}
