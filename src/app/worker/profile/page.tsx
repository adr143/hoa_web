'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPinIcon, BriefcaseIcon, CalendarIcon, SettingsIcon, StarIcon, CheckCircleIcon, XCircleIcon, ClockIcon, SparklesIcon, MessageSquareIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ImageUploadModal } from '@/components/ImageUploadModal';
import ProposalDetailModal from '@/components/ProposalDetailModal';
import { useNotifications } from '@/hooks/useNotifications';
import { useWorker } from '@/hooks/useWorker';
import { useJobApplications } from '@/hooks/useJobApplication';
import { useRecommendations, JobRecommendation } from '@/hooks/useRecommendations';
import { JobRecommendationCard } from '@/components/JobRecommendationCard';
import { jobCategories } from '@/data';
function WorkerProfileContent() {
  const [activeTab, setActiveTab] = useState('profile');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const {
    user,
    isLoggedIn,
    changeName,
    changePassword
  } = useAuth();
  const { workerData, fetchWorker, handleProfileImageUpdate, handleCoverImageUpdate, handleVideoReelUpload, updateWorkerInfo, updateWorkerCategories } = useWorker();
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
  const [isCoverImageModalOpen, setIsCoverImageModalOpen] = useState(false);
  const { applications, fetchApplications } = useJobApplications();
  const [newPassword, setNewPassword] = useState('');
  const [checkPassword, setCheckPassword] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const isOwnProfile = !id || (isLoggedIn && user && user.id === id);
  const availableTabs = React.useMemo(() => isOwnProfile ? ['profile', 'applications', 'proposals', 'recommendations', 'account'] : ['profile'], [isOwnProfile]);
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && availableTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, availableTabs]);

  const handleSetTab = (tab: string) => {
    if (!availableTabs.includes(tab)) return;
    setActiveTab(tab);
    try {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set('tab', tab);
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl);
    } catch (err) {
      alert(err)
    }
  };

  const { getRecommendedJobsForWorker, loading: recommendationsLoading } = useRecommendations();
  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([]);

  const [applicationsPage, setApplicationsPage] = useState(1);
  const applicationsPerPage = 5;

  const [proposalsPage, setProposalsPage] = useState(1);
  const proposalsPerPage = 5;

  useEffect(() => {
      const loadWorker = async () => {
        if (!user?.id) return;
        try {
          await fetchWorker(user.id);
        } catch (error) {
          console.error('Failed to fetch worker data:', error);
        }
      };
      loadWorker();
    }, [user?.id, fetchWorker]);

  const averageRating = useMemo(() => {
    const reviews = workerData?.reviews || [];
    if (!Array.isArray(reviews) || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc: number, r: { rating?: number }) => acc + (Number(r.rating) || 0), 0);
    return sum / reviews.length;
  }, [workerData]);

  useEffect(() => {
    if (activeTab === 'recommendations' && isOwnProfile && workerData?.id) {
      const loadRecommendations = async () => {
        const recommendations = await getRecommendedJobsForWorker(workerData.id, 12);
        setJobRecommendations(recommendations);
      };
      loadRecommendations();
    }
  }, [activeTab, isOwnProfile, workerData?.id, getRecommendedJobsForWorker]);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        await fetchApplications(workerData?.id);
      } catch (error) {
        console.error('Failed to fetch job applications:', error);
      }
    };
    loadApplications();
  }, [fetchApplications, workerData?.id]);

  const handleProfileImageChange = async (file: File) => {
    try {
      await handleProfileImageUpdate(file);
    } catch (error) {
      console.error('Failed to update profile image:', error);
    }
  };

  const handleCoverImageChange = async (file: File) => {
    try {
      await handleCoverImageUpdate(file);
    } catch (error) {
      console.error('Failed to update cover image:', error);
    }
  };

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isUploadingReel, setIsUploadingReel] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Keep selectedCategories in sync when workerData loads/changes
  useEffect(() => {
    const initial = Array.isArray(workerData?.category)
      ? workerData.category
      : (workerData?.category ? [workerData.category] : []);
    setSelectedCategories(initial || []);
  }, [workerData?.category]);

  const handleCategoryChange = (categoryTitle: string, checked: boolean) => {
    setSelectedCategories(prev => {
      if (checked) {
        if (prev.includes(categoryTitle)) return prev;
        if (prev.length >= 3) return prev;
        return [...prev, categoryTitle];
      } else {
        return prev.filter(c => c !== categoryTitle);
      }
    });
  };

  const handleSaveChanges = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!workerData) return;

    const firstName = (e.currentTarget.querySelector('#first-name') as HTMLInputElement).value;
    const lastName = (e.currentTarget.querySelector('#last-name') as HTMLInputElement).value;
    const fullName = `${firstName} ${lastName}`.trim();

    const title = (e.currentTarget.querySelector('#professional-title') as HTMLInputElement).value;
    const about = (e.currentTarget.querySelector('#about') as HTMLTextAreaElement).value;
    const location = (e.currentTarget.querySelector('#location') as HTMLInputElement).value;
    const skillsStr = (e.currentTarget.querySelector('#skills') as HTMLInputElement).value;
    const hourlyRate = (e.currentTarget.querySelector('#hourly-rate') as HTMLInputElement).value;
    const availability = (e.currentTarget.querySelector('#availability') as HTMLInputElement).value;
    const email = (e.currentTarget.querySelector('#email') as HTMLInputElement)?.value;
      const travelDistanceStr = (e.currentTarget.querySelector('#travel-distance') as HTMLInputElement)?.value;
    const languagesStr = (e.currentTarget.querySelector('#languages') as HTMLInputElement)?.value;

    try {
      if (fullName && fullName !== user?.name) {
        const nameSuccess = await changeName(fullName);
        if (!nameSuccess) {
          alert('Failed to update name');
          return;
        }
      }

      await updateWorkerInfo({
        name: fullName,
        title,
        about,
        location,
        skills: skillsStr.split(',').map(s => s.trim()),
        hourly_rate: hourlyRate,
        availability,
        email: email || undefined,
        travel_distance: travelDistanceStr ? Number(travelDistanceStr) : undefined,
        languages: languagesStr ? languagesStr.split(',').map(s => s.trim()) : undefined,
      });

      if (selectedCategories.length > 0) {
        await updateWorkerCategories(selectedCategories);
      }

      alert('Profile updated successfully!');
      if (user?.id) await fetchWorker(user.id);
    } catch (error) {
      alert('Failed to update profile.');
    }
  };

  async function handlePasswordChange() {
    if (!workerData) return;
    if (!newPassword || !checkPassword) {
      alert('Please fill in all password fields.');
      return;
    }
    if (newPassword !== checkPassword) {
      alert('Passwords do not match.');
      return;
    }
    
    try {
      const success = await changePassword(newPassword);
      if (success) {
        alert('Password changed successfully.');
        setNewPassword('');
        setCheckPassword('');
      } else {
        alert('Failed to change password.');
      }
    } catch (error) {
      console.error('Password change error:', error);
      alert('Failed to change password.');
    }
  }

  const { sendNotification } = useNotifications();

  const handleAcceptProposal = async (proposal: any) => {
    if (!user) return;
    setIsActionLoading(true);
    try {

      const { error: updateError } = await supabase
        .from('active_proposals')
        .update({ status: 'approved', accepted_at: new Date().toISOString() })
        .eq('id', proposal.id);

      if (updateError) throw updateError;

      try {
        await sendNotification(proposal.employer_id, {
          type: 'proposal_update',
          title: 'Proposal Accepted',
          message: `${user.name || 'A worker'} accepted your proposal: ${proposal.title || proposal.jobTitle}`,
          sender_id: user.id,
          link: `/worker/profile/${user.id}`,
        } as any);
      } catch (err) {
        console.error('Failed to notify employer:', err);
      }

      await fetchWorker(user.id);
      setIsAcceptModalOpen(false);
      setSelectedProposal(null);
      setIsProposalModalOpen(false);
    } catch (err) {
      console.error('Failed to accept proposal:', err);
      alert('Failed to accept proposal.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectProposal = async (proposal: any) => {
    if (!user) return;
    setIsActionLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('active_proposals')
        .update({ status: 'rejected', rejected_at: new Date().toISOString() })
        .eq('id', proposal.id);

      if (updateError) throw updateError;

      try {
        await sendNotification(proposal.employer_id, {
          type: 'proposal_update',
          title: 'Proposal Declined',
          message: `${user.name || 'A worker'} declined your proposal: ${proposal.title || proposal.jobTitle}`,
          sender_id: user.id,
          link: `/worker/profile/${user.id}`,
        } as any);
      } catch (err) {
        console.error('Failed to notify employer:', err);
      }

      await fetchWorker(user.id);
      setIsProposalModalOpen(false);
    } catch (err) {
      console.error('Failed to reject proposal:', err);
      alert('Failed to decline proposal.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        {/* Cover Image */}
        <div className="h-40 sm:h-48 md:h-64 rounded-t-lg overflow-hidden relative">
          <img src={workerData?.cover_image} alt="Cover" className="w-full h-full object-cover" />
          {isOwnProfile && <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4">
              <button onClick={() => setIsCoverImageModalOpen(true)} className="bg-white text-gray-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-md font-medium hover:bg-gray-100 transition-colors shadow-sm text-xs sm:text-sm">
                Edit Cover
              </button>
            </div>}
        </div>
        <div className="bg-white border border-gray-200 shadow-sm rounded-b-lg">
          {/* Profile Header */}
          <div className="p-4 sm:p-6 relative">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/4 mb-6 md:mb-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-lg border-4 border-white shadow-md overflow-hidden -mt-12 sm:-mt-14 md:-mt-16 lg:-mt-20 relative z-10 mx-auto md:mx-0">
                  <img src={workerData?.profile_image} alt={user?.name} className="w-full h-full object-cover" />
                  {isOwnProfile && <button onClick={() => setIsProfileImageModalOpen(true)} className="absolute bottom-0 right-0 bg-gray-800 bg-opacity-75 text-white p-1 rounded-tl-md hover:bg-gray-700">
                      <SettingsIcon size={14} className="sm:w-4 sm:h-4" />
                    </button>}
                </div>
                <div className="mt-4 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start">
                    <span className="text-yellow-400 font-bold mr-1 text-sm sm:text-base">
                      {averageRating.toFixed(1)}
                    </span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => <StarIcon key={i} size={14} className={`sm:w-4 sm:h-4 ${i < Math.round(averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'} fill-current`} />)}
                    </div>
                    <span className="text-gray-500 text-xs sm:text-sm ml-1">
                      ({workerData?.reviews.length || 0} reviews)
                    </span>
                  </div>
                  <p className="text-teal-500 font-bold mt-2 text-base sm:text-lg">
                    ₱{workerData?.hourly_rate || 0}/hr
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  {workerData?.badges?.map((badge, index) => <div key={index} className="flex items-center justify-center md:justify-start">
                      <span className="w-4 h-4 sm:w-5 sm:h-5 bg-teal-100 rounded-full flex items-center justify-center mr-2">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-xs sm:text-sm text-gray-700">{badge}</span>
                    </div>)}
                    <div className="flex items-center justify-center md:justify-start">
                      <span className="text-xs sm:text-sm text-gray-500">Tier: {workerData?.tier || 'Basic'}</span>
                    </div>
                    {workerData?.tier === 'Verified' && (
                      <div className="flex items-center justify-center md:justify-start">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Purple Angel Badge
                        </span>
                      </div>
                    )}
                    {workerData?.tier === 'Premium' && (
                      <div className="flex items-center justify-center md:justify-start">
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Golden Angel Badge
                        </span>
                      </div>
                    )}
                </div>
                <div className="mt-4 text-gray-500 text-xs sm:text-sm text-center md:text-left space-y-1">
                  <p>
                    <CalendarIcon size={14} className="inline mr-2" />
                    Member since {workerData?.member_since ? new Date(workerData.member_since).getFullYear() : 'N/A'}
                  </p>
                  <p>
                    <MapPinIcon size={14} className="inline mr-2" />
                    {workerData?.location || 'Location not specified'}
                  </p>
                </div>
              </div>
              <div className="md:w-3/4 md:pl-8 mt-6 md:mt-0">
                <div className="mb-4 sm:mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center md:text-left">
                    {user?.name || 'Worker Name'}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 text-center md:text-left">{workerData?.title || 'Professional Title'}</p>
                </div>
                {/* Tabs */}
                <div className="border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto overflow-y-hidden scrollbar-hide">
                  <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
                    {availableTabs.includes('profile') && <button onClick={() => handleSetTab('profile')} className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'profile' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Profile
                      </button>}
                    {availableTabs.includes('applications') && <button onClick={() => handleSetTab('applications')} className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'applications' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Applications
                      </button>}
                    {availableTabs.includes('proposals') && <button onClick={() => handleSetTab('proposals')} className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'proposals' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Proposals
                      </button>}
                    {availableTabs.includes('recommendations') && <button onClick={() => handleSetTab('recommendations')} className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 whitespace-nowrap ${activeTab === 'recommendations' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <SparklesIcon size={14} className="sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Recommended Jobs</span>
                        <span className="sm:hidden">Jobs</span>
                      </button>}
                    {availableTabs.includes('account') && <button onClick={() => handleSetTab('account')} className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'account' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Account
                      </button>}
                  </nav>
                </div>
                {/* Tab Content */}
                {activeTab === 'profile' && <div>
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        About
                      </h2>
                      <p className="text-gray-600">{workerData?.about}</p>
                    </div>
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        Skills
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {workerData?.skills.map((skill, index) => <span key={index} className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">
                            {skill}
                          </span>)}
                      </div>
                    </div>
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        Experience
                      </h2>
                      <div className="space-y-4">
                        {workerData?.experience.map((exp, index) => <div key={index} className="flex">
                            <div className="mr-4">
                              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                <BriefcaseIcon size={20} className="text-teal-600" />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-800">
                                {exp.title}
                              </h3>
                              <p className="text-gray-600">{exp.company}</p>
                              <p className="text-gray-500 text-sm">
                                {exp.period}
                              </p>
                              <p className="text-gray-600 mt-1">
                                {exp.description}
                              </p>
                            </div>
                          </div>)}
                      </div>
                    </div>
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        Education
                      </h2>
                      <div className="space-y-4">
                        {workerData?.education.map((edu, index) => <div key={index} className="flex">
                            <div className="mr-4">
                              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                <CalendarIcon size={20} className="text-teal-600" />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-800">
                                {edu.degree}
                              </h3>
                              <p className="text-gray-600">{edu.institution}</p>
                              <p className="text-gray-500 text-sm">
                                {edu.year}
                              </p>
                            </div>
                          </div>)}
                      </div>
                    </div>
                    {/* Reviews Section */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <MessageSquareIcon size={24} className="text-teal-500" />
                          Reviews & Feedback
                        </h2>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                            <StarIcon size={16} className="text-yellow-400 fill-yellow-400" />
                            <span className="font-semibold text-gray-800">{averageRating.toFixed(1)}</span>
                            <span className="text-gray-500 text-sm">({workerData?.reviews.length || 0})</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Reviews List */}
                        {workerData?.reviews && workerData.reviews.length > 0 ? (
                          <div className="space-y-4">
                            {workerData.reviews.map((review) => (
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
                              Reviews from employers will appear here
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>}
                {activeTab === 'applications' && isOwnProfile && <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold text-gray-800">
                        Job Applications
                      </h2>
                      {applications && applications.length > 0 && (
                        <p className="text-sm text-gray-500">
                          Showing {((applicationsPage - 1) * applicationsPerPage) + 1} - {Math.min(applicationsPage * applicationsPerPage, applications.length)} of {applications.length}
                        </p>
                      )}
                    </div>
                    <div className="space-y-4">
                      {applications?.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                          <BriefcaseIcon size={48} className="mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-500 text-lg mb-2">No applications yet</p>
                          <p className="text-gray-400 text-sm mb-4">Start applying to jobs to see your applications here</p>
                          <button onClick={() => router.push('/jobs')} className="bg-teal-500 text-white px-6 py-2 rounded-md hover:bg-teal-600 transition-colors">
                            Browse Jobs
                          </button>
                        </div>
                      ) : (
                        <>
                          {applications
                            ?.slice((applicationsPage - 1) * applicationsPerPage, applicationsPage * applicationsPerPage)
                            .map((application) => {
                          const statusConfig = {
                            'accepted': { bg: 'border-green-200 bg-green-50', badge: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Hired' },
                            'pending': { bg: 'border-yellow-200 bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: 'Pending' },
                            'rejected': { bg: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'Declined' },
                            'reviewed': { bg: 'border-blue-200 bg-blue-50', badge: 'bg-blue-100 text-blue-800', icon: ClockIcon, label: 'Under Review' }
                          };
                          const config = statusConfig[application.status as keyof typeof statusConfig] || statusConfig.pending;
                          const StatusIcon = config.icon;

                          return (
                            <div key={application.id} className={`border rounded-xl p-6 ${config.bg} hover:shadow-lg transition-all duration-200`}>
                              <div className="flex items-start gap-4">
                                {/* Employer Logo */}
                                <div className="flex-shrink-0">
                                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md bg-white">
                                    <img
                                      src={application.job?.employer?.profile?.profile_image || 'https://via.placeholder.com/64'}
                                      alt={application.job?.employer?.profile?.name || 'Employer'}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>

                                {/* Application Details */}
                                <div className="flex-1 min-w-0">
                                  {/* Header with Title and Status */}
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 min-w-0 pr-4">
                                      <h3 className="font-bold text-gray-900 text-xl mb-1 truncate">
                                        {application.job?.title || 'Job Title Not Available'}
                                      </h3>
                                      <p className="text-gray-700 font-medium text-base flex items-center gap-2">
                                        <BriefcaseIcon size={16} className="text-gray-500" />
                                        {application.job?.employer?.profile?.name || 'Employer Name Not Available'}
                                      </p>
                                    </div>
                                    <span className={`text-xs px-3 py-2 rounded-full font-semibold ${config.badge} whitespace-nowrap flex items-center gap-1.5 shadow-sm`}>
                                      <StatusIcon size={14} />
                                      {config.label}
                                    </span>
                                  </div>

                                  {/* Location and Date */}
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                                    <span className="flex items-center gap-1.5 bg-white bg-opacity-60 px-3 py-1.5 rounded-lg">
                                      <MapPinIcon size={16} className="text-teal-600" />
                                      <span className="font-medium">{application.job?.location || 'Location not specified'}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-white bg-opacity-60 px-3 py-1.5 rounded-lg">
                                      <CalendarIcon size={16} className="text-teal-600" />
                                      <span className="font-medium">
                                        Applied {application.applied_at ? new Date(application.applied_at).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        }) : 'Date not available'}
                                      </span>
                                    </span>
                                  </div>

                                  {/* Job Description Preview */}
                                  {application.job?.description && (
                                    <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
                                      <p className="text-gray-700 text-sm line-clamp-2 leading-relaxed">
                                        {application.job.description}
                                      </p>
                                    </div>
                                  )}

                                  {/* Cover Letter Preview */}
                                  {application.cover_letter && (
                                    <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
                                      <p className="text-gray-600 text-xs font-semibold mb-1 uppercase tracking-wide">Your Cover Letter</p>
                                      <p className="text-gray-700 text-sm line-clamp-2 leading-relaxed">
                                        {application.cover_letter}
                                      </p>
                                    </div>
                                  )}

                                  {/* Attachments */}
                                  {application.attachments && application.attachments.length > 0 && (
                                    <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
                                      <p className="text-gray-600 text-xs font-semibold mb-2 uppercase tracking-wide">Attachments</p>
                                      <div className="flex flex-wrap gap-2">
                                        {application.attachments.map((attachment, idx) => (
                                          <span key={idx} className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-md font-medium">
                                            📎 {attachment}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Action Button */}
                                  <div className="flex justify-end pt-2">
                                    <button
                                      onClick={() => router.push(`/jobs/${application.job?.category || 'general'}/${application.job_id}`)}
                                      className="bg-teal-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                                    >
                                      View Job Details
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                          {/* Pagination Controls for Applications */}
                          {applications && applications.length > applicationsPerPage && (
                            <div className="flex justify-center items-center gap-2 mt-6 pt-6 border-t border-gray-200">
                              <button
                                onClick={() => setApplicationsPage(prev => Math.max(1, prev - 1))}
                                disabled={applicationsPage === 1}
                                className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                  applicationsPage === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <ChevronLeftIcon size={16} />
                                Previous
                              </button>

                              <div className="flex items-center gap-2">
                                {Array.from({ length: Math.ceil(applications.length / applicationsPerPage) }, (_, i) => i + 1).map((page) => (
                                  <button
                                    key={page}
                                    onClick={() => setApplicationsPage(page)}
                                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                      applicationsPage === page
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ))}
                              </div>

                              <button
                                onClick={() => setApplicationsPage(prev => Math.min(Math.ceil(applications.length / applicationsPerPage), prev + 1))}
                                disabled={applicationsPage === Math.ceil(applications.length / applicationsPerPage)}
                                className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                  applicationsPage === Math.ceil(applications.length / applicationsPerPage)
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                Next
                                <ChevronRightIcon size={16} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>}
                {activeTab === 'proposals' && isOwnProfile && <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold text-gray-800">
                        Job Proposals
                      </h2>
                      {workerData?.active_proposals && workerData.active_proposals.length > 0 && (
                        <p className="text-sm text-gray-500">
                          Showing {((proposalsPage - 1) * proposalsPerPage) + 1} - {Math.min(proposalsPage * proposalsPerPage, workerData.active_proposals.length)} of {workerData.active_proposals.length}
                        </p>
                      )}
                    </div>
                    <div className="space-y-4">
                      {workerData?.active_proposals?.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                          <BriefcaseIcon size={48} className="mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-500 text-lg mb-2">No proposals yet</p>
                          <p className="text-gray-400 text-sm">Employers will send you job proposals here</p>
                        </div>
                      ) : (
                        <>
                          {workerData?.active_proposals
                            .slice((proposalsPage - 1) * proposalsPerPage, proposalsPage * proposalsPerPage)
                            .map((proposal: any) => {
                          const status = (proposal.status || 'pending').toLowerCase();
                          const statusConfig = {
                            'accepted': { bg: 'border-green-200 bg-green-50', badge: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Accepted' },
                            'approved': { bg: 'border-green-200 bg-green-50', badge: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Approved' },
                            'rejected': { bg: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'Declined' },
                            'in-progress': { bg: 'border-blue-200 bg-blue-50', badge: 'bg-blue-100 text-blue-800', icon: ClockIcon, label: 'In Progress' },
                            'completed': { bg: 'border-purple-200 bg-purple-50', badge: 'bg-purple-100 text-purple-800', icon: CheckCircleIcon, label: 'Completed' },
                            'expired': { bg: 'border-gray-200 bg-gray-50', badge: 'bg-gray-100 text-gray-800', icon: XCircleIcon, label: 'Expired' },
                            'pending': { bg: 'border-yellow-200 bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: 'Pending' }
                          };
                          const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
                          const StatusIcon = config.icon;

                          return (
                            <div key={proposal.id} className={`border rounded-lg p-5 ${config.bg} hover:shadow-md transition-shadow`}>
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                  <img
                                    src={proposal.employer?.logo || proposal.employer?.profile_image || 'https://via.placeholder.com/48'}
                                    alt={proposal.employer?.profile?.name || 'Employer'}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                      <button
                                        onClick={() => { setSelectedProposal(proposal); setIsProposalModalOpen(true); }}
                                        className="text-left font-semibold text-gray-900 text-lg hover:text-teal-600 transition-colors"
                                      >
                                        {proposal.title || proposal.jobTitle || 'Job Proposal'}
                                      </button>
                                      <p className="text-gray-600 text-sm mt-1">
                                        From: <span className="font-medium">{proposal.employer?.profile?.name || proposal.employer_name}</span>
                                      </p>
                                    </div>
                                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${config.badge} whitespace-nowrap ml-2 flex items-center gap-1`}>
                                      <StatusIcon size={14} />
                                      {config.label}
                                    </span>
                                  </div>

                                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                                    {proposal.description}
                                  </p>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                                    <div className="bg-white bg-opacity-50 rounded-md p-2">
                                      <p className="text-gray-500 text-xs mb-0.5">Rate</p>
                                      <p className="font-semibold text-gray-900">
                                        {proposal.rate ? `₱${proposal.rate}/${proposal.rate_type || 'hr'}` : 'Negotiable'}
                                      </p>
                                    </div>
                                    <div className="bg-white bg-opacity-50 rounded-md p-2">
                                      <p className="text-gray-500 text-xs mb-0.5">Start Date</p>
                                      <p className="font-semibold text-gray-900">
                                        {proposal.start_date ? new Date(proposal.start_date).toLocaleDateString() : 'TBD'}
                                      </p>
                                    </div>
                                    <div className="bg-white bg-opacity-50 rounded-md p-2">
                                      <p className="text-gray-500 text-xs mb-0.5">Duration</p>
                                      <p className="font-semibold text-gray-900">{proposal.duration || 'N/A'}</p>
                                    </div>
                                    <div className="bg-white bg-opacity-50 rounded-md p-2">
                                      <p className="text-gray-500 text-xs mb-0.5">Expires</p>
                                      <p className="font-semibold text-gray-900">
                                        {proposal.expires_at ? new Date(proposal.expires_at).toLocaleDateString() : 'N/A'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <button
                                      onClick={() => { setSelectedProposal(proposal); setIsProposalModalOpen(true); }}
                                      className="text-teal-600 text-sm font-medium hover:text-teal-700 hover:underline"
                                    >
                                      View Full Details →
                                    </button>
                                    {status === 'pending' && (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleRejectProposal(proposal)}
                                          className="border border-red-500 text-red-600 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                                        >
                                          Decline
                                        </button>
                                        <button
                                          onClick={() => { setSelectedProposal(proposal); setIsAcceptModalOpen(true); }}
                                          className="bg-teal-500 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-teal-600 transition-colors"
                                        >
                                          Accept
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                          {/* Pagination Controls for Proposals */}
                          {workerData?.active_proposals && workerData.active_proposals.length > proposalsPerPage && (
                            <div className="flex justify-center items-center gap-2 mt-6 pt-6 border-t border-gray-200">
                              <button
                                onClick={() => setProposalsPage(prev => Math.max(1, prev - 1))}
                                disabled={proposalsPage === 1}
                                className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                  proposalsPage === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <ChevronLeftIcon size={16} />
                                Previous
                              </button>

                              <div className="flex items-center gap-2">
                                {Array.from({ length: Math.ceil(workerData.active_proposals.length / proposalsPerPage) }, (_, i) => i + 1).map((page) => (
                                  <button
                                    key={page}
                                    onClick={() => setProposalsPage(page)}
                                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                      proposalsPage === page
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ))}
                              </div>

                              <button
                                onClick={() => setProposalsPage(prev => Math.min(Math.ceil(workerData.active_proposals.length / proposalsPerPage), prev + 1))}
                                disabled={proposalsPage === Math.ceil(workerData.active_proposals.length / proposalsPerPage)}
                                className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                  proposalsPage === Math.ceil(workerData.active_proposals.length / proposalsPerPage)
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                Next
                                <ChevronRightIcon size={16} />
                              </button>
                            </div>
                          )}

                          {/* Proposal detail modal */}
                          <ProposalDetailModal isOpen={isProposalModalOpen} onClose={() => setIsProposalModalOpen(false)} proposal={selectedProposal} role="worker" onAccept={handleAcceptProposal} onReject={handleRejectProposal} />
                        </>
                      )}
                    </div>

                    {/* Accept confirmation modal */}
                    {isAcceptModalOpen && selectedProposal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                          <h3 className="text-lg font-medium text-gray-800 mb-3">Accept Proposal</h3>
                          <p className="text-gray-600 mb-4">Are you sure you want to accept the proposal "{selectedProposal.title || selectedProposal.jobTitle}" from {selectedProposal.employer?.profile?.name || selectedProposal.employer_name}?</p>
                          <div className="flex justify-end space-x-3">
                            <button onClick={() => { setIsAcceptModalOpen(false); setSelectedProposal(null); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={async () => { await handleAcceptProposal(selectedProposal); }} className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600">{isActionLoading ? 'Accepting...' : 'Accept'}</button>
                          </div>
                        </div>
                      </div>}
                  </div>}

                {/* Recommendations Tab */}
                {activeTab === 'recommendations' && isOwnProfile && (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <SparklesIcon size={24} className="text-teal-500" />
                        AI-Recommended Jobs
                      </h2>
                      <p className="text-gray-600 text-sm">
                        Based on your skills, experience, and preferences, here are jobs that match your profile
                      </p>
                    </div>

                    {/* Loading State */}
                    {recommendationsLoading && (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                      </div>
                    )}

                    {/* Recommendations Grid */}
                    {!recommendationsLoading && jobRecommendations.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobRecommendations.map((recommendation) => (
                          <JobRecommendationCard
                            key={recommendation.job.id}
                            recommendation={recommendation}
                            showMatchScore={true}
                          />
                        ))}
                      </div>
                    )}

                    {/* Empty State */}
                    {!recommendationsLoading && jobRecommendations.length === 0 && (
                      <div className="text-center py-12">
                        <SparklesIcon size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No recommendations available yet</p>
                        <p className="text-gray-400 text-sm">
                          Complete your profile with skills and experience to get personalized job recommendations
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'account' && isOwnProfile && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">
                      Account Settings
                    </h2>
                    <form className="space-y-6" onSubmit={handleSaveChanges}>
                      {/* Personal Information */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-4">Personal Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-700 text-sm mb-1" htmlFor="first-name">
                              First Name
                            </label>
                            <input
                              type="text"
                              id="first-name"
                              defaultValue={user?.name.split(' ')[0] || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm mb-1" htmlFor="last-name">
                              Last Name
                            </label>
                            <input
                              type="text"
                              id="last-name"
                              defaultValue={user?.name.split(' ')[1] || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-gray-700 text-sm mb-1" htmlFor="email">
                              Email
                            </label>
                            <input
                              type="email"
                              id="email"
                              defaultValue={workerData?.email || user?.email || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm mb-1">Video Reel</label>
                            {workerData?.video_reel_path ? (
                              <div className="mb-2">
                                <div className="w-full max-w-md rounded-md overflow-hidden border border-gray-200">
                                  <div className="aspect-video max-h-56 bg-black">
                                    <video controls preload="metadata" playsInline className="w-full h-full object-contain" src={workerData.video_reel_path} />
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Status: {workerData.video_reel_status || 'none'}</p>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 mb-2">No video reel uploaded</p>
                            )}
                            <div>
                              <input
                                type="file"
                                accept="video/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setIsUploadingReel(true);
                                  setUploadProgress(0);

                                  const interval = setInterval(() => {
                                    setUploadProgress(p => {
                                      const next = p + Math.floor(Math.random() * 10) + 5;
                                      return next >= 90 ? 90 : next;
                                    });
                                  }, 400);

                                  try {
                                    await handleVideoReelUpload(file);
                                    setUploadProgress(100);
                                    clearInterval(interval);
                                    if (user?.id) await fetchWorker(user.id);
                                    setTimeout(() => {
                                      setIsUploadingReel(false);
                                      setUploadProgress(0);
                                      alert('Video reel uploaded and pending review.');
                                    }, 600);
                                  } catch (err) {
                                    clearInterval(interval);
                                    setIsUploadingReel(false);
                                    setUploadProgress(0);
                                    console.error('Video upload failed', err);
                                    alert('Failed to upload video reel.');
                                  }
                                }}
                                className="w-full"
                              />

                              {isUploadingReel && (
                                <div className="w-full mt-2">
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div className="h-2 bg-teal-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">Uploading: {uploadProgress}%</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-700 text-sm mb-1" htmlFor="professional-title">
                            Professional Title
                          </label>
                          <input
                            type="text"
                            id="professional-title"
                            defaultValue={workerData?.title || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 text-sm mb-1" htmlFor="about">
                            About
                          </label>
                          <textarea
                            id="about"
                            rows={4}
                            defaultValue={workerData?.about || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 text-sm mb-1" htmlFor="location">
                            Location
                          </label>
                          <input
                            type="text"
                            id="location"
                            defaultValue={workerData?.location || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                      </div>

                      {/* Categories */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-4">Categories</h3>
                        <div className="space-y-2">
                          {jobCategories.map((cat) => (
                            <label key={cat.title} className="flex items-center">
                              <input
                                type="checkbox"
                                value={cat.title}
                                checked={selectedCategories.includes(cat.title)}
                                onChange={(e) => handleCategoryChange(cat.title, e.target.checked)}
                                className="w-4 h-4 text-teal-500 rounded"
                                id={`category-${cat.title}`}
                              />
                              <span className="ml-2 text-gray-700 text-sm">{cat.title}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Skills & Expertise */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-4">Skills & Expertise</h3>
                        <div>
                          <label className="block text-gray-700 text-sm mb-1" htmlFor="skills">
                            Skills (separate with commas)
                          </label>
                          <input
                            type="text"
                            id="skills"
                            defaultValue={workerData?.skills.join(', ')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm mb-1" htmlFor="languages">
                            Languages (separate with commas)
                          </label>
                          <input
                            type="text"
                            id="languages"
                            defaultValue={workerData?.languages?.join(', ') || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 text-sm mb-1" htmlFor="hourly-rate">
                            Hourly Rate (₱)
                          </label>
                          <input
                            type="number"
                            id="hourly-rate"
                            defaultValue={workerData?.hourly_rate || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 text-sm mb-1" htmlFor="availability">
                            Availability
                          </label>
                          <input
                            type="text"
                            id="availability"
                            defaultValue={workerData?.availability || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm mb-1" htmlFor="travel-distance">
                            Maximum Travel Distance (km)
                          </label>
                          <input
                            type="number"
                            id="travel-distance"
                            defaultValue={workerData?.travel_distance ?? ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                      </div>
                      {/* Submit */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          className="bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600 transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                      <div className="px-4">
                          <label className="block text-gray-700 text-sm mb-1" htmlFor="password">
                            Change Password
                          </label>
                          <input
                            type="password"
                            id="password"
                            placeholder="New Password"
                            value={newPassword}
                            className="w-full px-3 py-2 my-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <input
                            type="password"
                            id="check-password"
                            placeholder="Retype New Password"
                            value={checkPassword}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            onChange={(e) => setCheckPassword(e.target.value)}
                          />
                        </div>
                        <div className="pt-2">
                        <button
                          type="button"
                          className="bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600 transition-colors"
                          onClick={handlePasswordChange}
                        >
                          Save Password
                        </button>
                      </div>
                    </form>

                    {/* Danger Zone */}
                    <div className="bg-red-50 p-4 rounded-lg mt-6">
                      <h3 className="font-medium text-red-800 mb-2">Danger Zone</h3>
                      <p className="text-red-600 text-sm mb-4">
                        Permanently delete your account and all associated data.
                      </p>
                      <button className="bg-white border border-red-500 text-red-500 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modals */}
      <ImageUploadModal isOpen={isProfileImageModalOpen} onClose={() => setIsProfileImageModalOpen(false)} onSave={handleProfileImageChange} title="Update Profile Picture" aspectRatio="square" initialImage={workerData?.profile_image} />
      <ImageUploadModal isOpen={isCoverImageModalOpen} onClose={() => setIsCoverImageModalOpen(false)} onSave={handleCoverImageChange} title="Update Cover Photo" aspectRatio="cover" initialImage={workerData?.cover_image} />
    </div>;
}

export default function WorkerProfile() {
  return (
    <Suspense fallback={<div className="container mx-auto px-3 sm:px-4 py-8 flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div></div>}>
      <WorkerProfileContent />
    </Suspense>
  );
}

