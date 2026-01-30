'use client';

import React, { useState, useEffect } from 'react';
import { MapPinIcon, BriefcaseIcon, CalendarIcon, SettingsIcon, PlusCircleIcon, SparklesIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { ImageUploadModal } from '@/components/ImageUploadModal';
import ProposalDetailModal from '@/components/ProposalDetailModal';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/hooks/useNotifications';
import { CreatePostModal } from '@/components/CreatePostModal';
import { CommentSection } from '@/components/CommentSection';
import { useEmployer } from '@/hooks/useEmployer';
import { useRecommendations, WorkerRecommendation } from '@/hooks/useRecommendations';
import { ActiveProposal } from '@/types/worker';
import { WorkerRecommendationCard } from '@/components/WorkerRecommendationCard';

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return 'Invalid date';
  }
};

export default function EmployerProfile() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const { user, isLoggedIn, changeName, changePassword, deleteAccount } = useAuth();
  const { employerData, loading, fetchEmployer, handleProfileImageUpdate, handleCoverImageUpdate, handleCreatePost, handleAddComment, updateEmployerInfo, checkJobLimit } = useEmployer();

  const isOwnProfile = !id || (isLoggedIn && user?.id === id);
  const availableTabs = isOwnProfile ? ['profile', 'jobs', 'proposals', 'recommendations', 'account'] : ['profile', 'jobs'];

  const [activeTab, setActiveTab] = useState('profile');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && availableTabs.includes(tab)) setActiveTab(tab);
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
      console.error('Failed to set tab in URL:', err);
    }
  };

  // Modals
  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
  const [isCoverImageModalOpen, setIsCoverImageModalOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ActiveProposal | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const { sendNotification } = useNotifications();

  // Recommendations
  const { getRecommendedWorkersForJob, getTopWorkers, loading: recommendationsLoading } = useRecommendations();
  const [workerRecommendations, setWorkerRecommendations] = useState<WorkerRecommendation[]>([]);
  const [selectedJobForRecommendations, setSelectedJobForRecommendations] = useState<string | null>(null);

  // Company information form state
  const [companyInfo, setCompanyInfo] = useState({
    company_name: '',
    company_description: '',
    website: '',
    employees: '',
    company_location: '',
  });

  // Update company info state when employerData loads
  useEffect(() => {
    if (employerData) {
      setCompanyInfo({
        company_name: employerData.company_name || '',
        company_description: employerData.company_description || '',
        website: employerData.website || '',
        employees: employerData.employees || '',
        company_location: employerData.company_location || '',
      });
    }
  }, [employerData]);

  // Company info form handlers
  const handleCompanyInfoChange = (field: string, value: string) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanyInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateEmployerInfo(companyInfo);
      alert('Company information updated successfully!');
      await fetchEmployer(id);
    } catch (error) {
      console.error('Failed to update company information:', error);
      alert('Failed to update company information');
    }
  };

  const handleProposalStatusChange = async (proposal: any, newStatus: 'in-progress' | 'completed') => {
    try {
      const { error } = await supabase
        .from('active_proposals')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', proposal.id);

      if (error) throw error;

      // Notify worker
      try {
        await sendNotification(proposal.worker_id, {
          type: 'proposal_update',
          title: 'Proposal Status Updated',
          message: `Your proposal "${proposal.title}" has been marked as ${newStatus === 'in-progress' ? 'In Progress' : 'Completed'}`,
          sender_id: user?.id,
          link: `/worker/profile`,
        } as any);
      } catch (err) {
        console.error('Failed to notify worker:', err);
      }

      await fetchEmployer(id);
      alert(`Proposal marked as ${newStatus === 'in-progress' ? 'In Progress' : 'Completed'}`);
    } catch (err) {
      console.error('Failed to update proposal status:', err);
      alert('Failed to update proposal status');
    } finally {
      setIsProposalModalOpen(false);
    }
  };

  useEffect(() => {
    const loadEmployer = async () => {
      try {
        await fetchEmployer(id);
      } catch (error) {
        console.error('Failed to fetch employer data:', error);
      }
    };
    loadEmployer();
  }, [id, fetchEmployer]);

  // Handler wrappers
  const handlePostComment = async (postId: string, content: string) => {
    if (!isLoggedIn || !user) {
      router.push('/signin');
      return;
    }
    try {
      await handleAddComment(postId, content);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handlePostCreation = async (post: { content: string; images: File[]; date: string }) => {
    if (!employerData) return;
    try {
      await handleCreatePost(post);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

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

  // Load initial recommendations when recommendations tab is active
  useEffect(() => {
    if (activeTab === 'recommendations' && isOwnProfile && !selectedJobForRecommendations) {
      const loadTopWorkers = async () => {
        const topWorkers = await getTopWorkers(undefined, 12);
        setWorkerRecommendations(topWorkers.map(worker => ({
          worker,
          matchScore: {
            score: 0,
            reasons: [],
            categoryMatch: false,
            locationMatch: false,
            skillsMatch: 0,
            experienceMatch: false,
            salaryMatch: false,
            travelDistanceMatch: false
          }
        })));
      };
      loadTopWorkers();
    }
  }, [activeTab, isOwnProfile, selectedJobForRecommendations, getTopWorkers]);

  if (loading || !employerData) return (
  <div className="animate-pulse flex flex-col items-center justify-start min-h-screen bg-gray-50 p-6 space-y-6">
    {/* Cover skeleton */}
    <div className="w-full h-64 bg-gray-200 rounded-lg" />
    {/* Profile section skeleton */}
    <div className="flex w-full max-w-5xl space-x-6">
      <div className="w-32 h-32 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-4 py-2">
        <div className="h-6 w-1/3 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
      </div>
    </div>
    {/* Jobs / posts skeleton */}
    <div className="w-full max-w-5xl space-y-4">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="p-4 border rounded-lg space-y-2">
          <div className="h-4 w-1/3 bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-5/6 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  </div>
);


  return (
    <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        {/* Cover Image */}
        <div className="h-40 sm:h-48 md:h-64 rounded-t-lg overflow-hidden relative">
          {employerData.cover_image && employerData.cover_image.trim() !== '' ? (
            <img src={employerData.cover_image} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm sm:text-base">No cover image</span>
            </div>
          )}
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
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-lg border-4 border-white shadow-md overflow-hidden -mt-12 sm:-mt-14 md:-mt-16 lg:-mt-20 relative z-10 bg-white mx-auto md:mx-0">
                  {employerData.logo && employerData.logo.trim() !== '' ? (
                    <img src={employerData.logo} alt={employerData.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-xl sm:text-2xl font-bold">{employerData.name.charAt(0)}</span>
                    </div>
                  )}
                  {isOwnProfile && <button onClick={() => setIsProfileImageModalOpen(true)} className="absolute bottom-0 right-0 bg-gray-800 bg-opacity-75 text-white p-1 rounded-tl-md hover:bg-gray-700">
                      <SettingsIcon size={14} className="sm:w-4 sm:h-4" />
                    </button>}
                </div>
                {employerData.verified && <div className="mt-4 flex items-center justify-center md:justify-start">
                    <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs sm:text-sm flex items-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Verified
                    </span>
                  </div>}
                <div className="mt-4">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500 text-xs sm:text-sm">Tier</span>
                      <span className="text-teal-500 font-medium text-xs sm:text-sm">
                        {employerData.tier}
                      </span>
                    </div>
                    {employerData.tier === 'Paid Plan' && <div className="bg-purple-100 text-purple-700 text-xs font-medium py-1 px-2 rounded-full inline-flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Purple Angel Badge
                      </div>}
                    {employerData.tier === 'Enterprise' && <div className="bg-yellow-100 text-yellow-700 text-xs font-medium py-1 px-2 rounded-full inline-flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Golden Angel Badge
                      </div>}
                  </div>
                </div>
                <div className="mt-4 text-gray-500 text-xs sm:text-sm text-center md:text-left space-y-1">
                  <p>
                    <CalendarIcon size={14} className="inline mr-2" />
                    Member since {employerData.member_since}
                  </p>
                  <p>
                    <BriefcaseIcon size={14} className="inline mr-2" />
                    {employerData.employees} employees
                  </p>
                  <p>
                    <MapPinIcon size={14} className="inline mr-2" />
                    {employerData.location}
                  </p>
                </div>
              </div>
              <div className="md:w-3/4 md:pl-8 mt-6 md:mt-0">
                <div className="mb-4 sm:mb-6 text-center md:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                    {employerData.name}
                  </h1>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 break-all">
                    {employerData.website}
                  </p>
                </div>
                {/* Tabs */}
                <div className="border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto overflow-y-hidden scrollbar-hide">
                  <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
                    {availableTabs.includes('profile') && <button onClick={() => handleSetTab('profile')} className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'profile' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Profile
                      </button>}
                    {availableTabs.includes('jobs') && <button onClick={() => handleSetTab('jobs')} className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'jobs' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Job Posts
                      </button>}
                    {availableTabs.includes('proposals') && <button onClick={() => handleSetTab('proposals')} className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'proposals' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Proposals
                      </button>}
                    {availableTabs.includes('recommendations') && <button onClick={() => handleSetTab('recommendations')} className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 whitespace-nowrap ${activeTab === 'recommendations' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <SparklesIcon size={16} />
                        Recommended Workers
                      </button>}
                    {availableTabs.includes('account') && <button onClick={() => handleSetTab('account')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'account' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
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
                      <p className="text-gray-600">
                        {employerData.description}
                      </p>
                    </div>
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        Specialties
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {employerData.specialties.map((specialty, index) => <span key={index} className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">
                            {specialty}
                          </span>)}
                      </div>
                    </div>
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        Contact Information
                      </h2>
                      <div className="space-y-2 text-gray-600">
                        <p>Email: {employerData.email}</p>
                        <p>Phone: {employerData.phone}</p>
                        <p>Website: {employerData.website}</p>
                      </div>
                    </div>
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                          Posts
                        </h2>
                        {isOwnProfile && <button onClick={() => setIsCreatePostModalOpen(true)} className="flex items-center text-teal-500 hover:text-teal-600 text-sm font-medium">
                            <PlusCircleIcon size={16} className="mr-1" />
                            Create Post
                          </button>}
                      </div>
                      <div className="space-y-6">
                        {employerData.posts.map(post => <div key={post.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start mb-3">
                              {employerData.logo && employerData.logo.trim() !== '' ? (
                                <img src={employerData.logo} alt={employerData.name} className="w-10 h-10 rounded-full mr-3" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                  <span className="text-gray-400 font-bold">{employerData.name.charAt(0)}</span>
                                </div>
                              )}
                              <div>
                                <h3 className="font-medium text-gray-800">
                                  {employerData.name}
                                </h3>
                                <p className="text-gray-500 text-xs">
                                  {formatDate(post.date)}
                                </p>
                              </div>
                            </div>
                            <p className="text-gray-600 mb-4">{post.content}</p>
                            {post.images && post.images.length > 0 && <div className={`grid ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-4`}>
                                {post.images.map((image, idx) => <img key={idx} src={image} alt="Post" className="rounded-lg w-full h-48 object-cover" />)}
                              </div>}
                            <div className="flex justify-between text-gray-500 text-sm border-t border-gray-200 pt-3">
                              <button className="flex items-center hover:text-teal-500">
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                                {post.likes} likes
                              </button>
                              <button className="flex items-center hover:text-teal-500">
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                {post.comments.length} comments
                              </button>
                            </div>
                            <CommentSection postId={post.id} comments={post.comments} currentUser={user} onAddComment={(newComment) => handlePostComment(post.id, newComment.content)} />
                          </div>)}
                      </div>
                    </div>
                  </div>}
                {activeTab === 'jobs' && <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold text-gray-800">
                        Job Listings
                      </h2>
                      {isOwnProfile && (
                        <button
                          onClick={async () => {
                            const result = await checkJobLimit(employerData.id); // or employer.id

                            if (!result.allowed) {
                              alert(result.message); // or toast
                              return;
                            }

                            router.push('/jobs/create');
                          }}
                          className="bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600 transition-colors"
                        >
                          Post New Job
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {employerData.jobs.map(job => <div key={job.id} className={`border rounded-lg p-4 ${job.status === 'Filled' ? 'border-gray-200 bg-gray-50' : 'border-teal-200 bg-white'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <Link href={`/jobs/${job.category.toLowerCase().replace(/\s+/g, '-')}/${job.id}`} className="font-medium text-gray-800 hover:text-teal-600">
                              {job.title}
                            </Link>
                            <span className={`text-xs px-2 py-1 rounded-full ${job.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {job.status}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {job.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {job.tags.map((tag, idx) => <span key={idx} className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs">
                                {tag}
                              </span>)}
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <div className="text-gray-500">
                              <span className="mr-4">
                                <MapPinIcon size={14} className="inline mr-1" />
                                {job.location}
                              </span>
                              <span>
                                <CalendarIcon size={14} className="inline mr-1" />
                                Posted:{' '}
                                {(() => {
                                  try {
                                    const date = new Date(job.posted_date);
                                    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
                                  } catch {
                                    return 'Invalid date';
                                  }
                                })()}
                              </span>
                            </div>
                            <div className="flex space-x-3">
                              {isOwnProfile && (
                                <Link
                                  href={`/jobs/${job.category.toLowerCase().replace(/\s+/g, '-')}/${job.id}/applicants`}
                                  className="text-teal-500 hover:text-teal-600 font-medium flex items-center gap-1"
                                >
                                  <BriefcaseIcon size={14} />
                                  {job.applications} {job.applications === 1 ? 'Applicant' : 'Applicants'}
                                </Link>
                              )}
                              {!isOwnProfile && (
                                <span className="text-gray-500">
                                  {job.applications} {job.applications === 1 ? 'Application' : 'Applications'}
                                </span>
                              )}
                              {isOwnProfile && <Link href={`/jobs/edit/${job.id}`} className="text-gray-500 hover:text-gray-600 font-medium">
                                  Edit
                                </Link>}
                            </div>
                          </div>
                        </div>)}
                    </div>
                  </div>}
                {activeTab === 'proposals' && isOwnProfile && <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">Sent Proposals</h2>
                    <div className="space-y-4">
                      {(employerData as any)?.proposals?.length === 0 && <p className="text-gray-500">You haven't sent any proposals yet.</p>}
                      {(employerData as any)?.proposals?.map((proposal: ActiveProposal) => {
                        const status = (proposal.status || 'pending').toLowerCase();
                        const statusClass = status === 'accepted' ? 'bg-green-100 text-green-800' : status === 'rejected' ? 'bg-red-100 text-red-800' : status === 'expired' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800';
                        return (
                          <div key={proposal.id} className={`border rounded-lg p-4 ${status === 'accepted' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                            <div className="flex items-start">
                              <img src={proposal.worker?.profile_image || ''} alt={proposal.worker?.profile?.name || 'Worker'} className="w-12 h-12 rounded-full mr-4" />
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <button onClick={() => { setSelectedProposal(proposal); setIsProposalModalOpen(true); }} className="font-medium text-gray-800 text-left">{proposal.title || proposal.worker.title}</button>
                                  <span className={`text-xs px-2 py-1 rounded-full ${statusClass}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                                </div>
                                <p className="text-gray-600 text-sm">{proposal.description}</p>
                                <div className="mt-2 text-gray-500 text-xs">To: {proposal.worker?.profile?.name || proposal.worker.profile.name}</div>
                                <div className="mt-2 text-gray-500 text-xs">Expires: {proposal.expires_at ? new Date(proposal.expires_at).toLocaleDateString() : 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <ProposalDetailModal
                        isOpen={isProposalModalOpen}
                        onClose={() => setIsProposalModalOpen(false)}
                        proposal={selectedProposal}
                        role="employer"
                        onStatusChange={handleProposalStatusChange}
                        onReviewSubmitted={async () => {
                          // Refresh employer data to show updated reviews
                          await fetchEmployer(id);
                        }}
                        onCancel={async (p) => {
                          try {
                            const { error } = await supabase.from('active_proposals').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', p.id);
                            if (error) throw error;
                            // notify worker
                            try {
                              await sendNotification(p.worker_id, {
                                type: 'proposal',
                                title: 'Proposal Cancelled',
                                message: `A proposal you received was cancelled by the employer: ${p.title}`,
                                sender_id: user?.id,
                                link: `/worker/${p.worker_id}`,
                              } as any);
                            } catch (err) { console.error('Failed to notify worker:', err); }
                            await fetchEmployer(id);
                          } catch (err) {
                            console.error('Failed to cancel proposal:', err);
                            alert('Failed to cancel proposal');
                          } finally {
                            setIsProposalModalOpen(false);
                          }
                        }}
                      />
                    </div>
                  </div>}

                {/* Recommendations Tab */}
                {activeTab === 'recommendations' && isOwnProfile && <div>
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <SparklesIcon size={24} className="text-teal-500" />
                        AI-Recommended Workers
                      </h2>
                      <p className="text-gray-600 text-sm">
                        Based on your job posts and requirements, here are workers that match your needs
                      </p>
                    </div>

                    {/* Job Selector */}
                    {employerData.jobs && employerData.jobs.length > 0 && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Get recommendations for a specific job:
                        </label>
                        <select
                          value={selectedJobForRecommendations || ''}
                          onChange={async (e) => {
                            const jobId = e.target.value;
                            setSelectedJobForRecommendations(jobId || null);
                            if (jobId) {
                              const recommendations = await getRecommendedWorkersForJob(jobId, 12);
                              setWorkerRecommendations(recommendations);
                            } else {
                              // Load top workers
                              const topWorkers = await getTopWorkers(undefined, 12);
                              setWorkerRecommendations(topWorkers.map(worker => ({
                                worker,
                                matchScore: {
                                  score: 0,
                                  reasons: [],
                                  categoryMatch: false,
                                  locationMatch: false,
                                  skillsMatch: 0,
                                  experienceMatch: false,
                                  salaryMatch: false,
                                  travelDistanceMatch: false
                                }
                              })));
                            }
                          }}
                          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">All recommended workers</option>
                          {employerData.jobs.map((job) => (
                            <option key={job.id} value={job.id}>
                              {job.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Loading State */}
                    {recommendationsLoading && (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                      </div>
                    )}

                    {/* Recommendations Grid */}
                    {!recommendationsLoading && workerRecommendations.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workerRecommendations.map((recommendation) => (
                          <WorkerRecommendationCard
                            key={recommendation.worker.id}
                            recommendation={recommendation}
                            showMatchScore={!!selectedJobForRecommendations}
                          />
                        ))}
                      </div>
                    )}

                    {/* Empty State */}
                    {!recommendationsLoading && workerRecommendations.length === 0 && (
                      <div className="text-center py-12">
                        <SparklesIcon size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No recommendations available yet</p>
                        <p className="text-gray-400 text-sm">
                          {employerData.jobs && employerData.jobs.length === 0
                            ? 'Post a job to get personalized worker recommendations'
                            : 'Check back later for AI-powered worker recommendations'}
                        </p>
                      </div>
                    )}
                  </div>}

                {activeTab === 'account' && isOwnProfile && <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">
                      Account Settings
                    </h2>
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-4">
                          Profile Images
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-700 text-sm mb-2">
                              Profile Picture
                            </label>
                            <div className="flex items-center">
                              <div className="w-16 h-16 rounded-lg overflow-hidden mr-4">
                                {employerData.logo && employerData.logo.trim() !== '' ? (
                                  <img src={employerData.logo} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400 text-xl font-bold">{employerData.name.charAt(0)}</span>
                                  </div>
                                )}
                              </div>
                              <button onClick={() => setIsProfileImageModalOpen(true)} className="text-teal-500 hover:text-teal-600 text-sm font-medium">
                                Change Picture
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm mb-2">
                              Cover Photo
                            </label>
                            <button onClick={() => setIsCoverImageModalOpen(true)} className="text-teal-500 hover:text-teal-600 text-sm font-medium">
                              Change Cover Photo
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-4">
                          Account Name
                        </h3>
                        <form className="space-y-4" onSubmit={async (e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const newName = formData.get('account-name') as string;
                          
                          try {
                            if (newName && newName !== user?.name) {
                              const success = await changeName(newName);
                              if (success) {
                                alert('Name updated successfully!');
                                await fetchEmployer(id);
                              } else {
                                alert('Failed to update name');
                              }
                            }
                          } catch (error) {
                            console.error('Failed to update name:', error);
                            alert('Failed to update name');
                          }
                        }}>
                          <div>
                            <label className="block text-gray-700 text-sm mb-1" htmlFor="account-name">
                              Name
                            </label>
                            <input type="text" id="account-name" name="account-name" defaultValue={user?.name} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
                          </div>
                          <div className="pt-2">
                            <button type="submit" className="bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600 transition-colors">
                              Save Name
                            </button>
                          </div>
                        </form>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-4">
                          Company Information
                        </h3>
                        <form className="space-y-4" onSubmit={handleCompanyInfoSubmit}>
                          <div>
                            <label className="block text-gray-700 text-sm mb-1" htmlFor="company-name">
                              Company Name
                            </label>
                            <input type="text" id="company-name" value={companyInfo.company_name} onChange={(e) => handleCompanyInfoChange('company_name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm mb-1" htmlFor="company-description">
                              Description
                            </label>
                            <textarea id="company-description" rows={4} value={companyInfo.company_description} onChange={(e) => handleCompanyInfoChange('company_description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"></textarea>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-700 text-sm mb-1" htmlFor="company-website">
                                Website
                              </label>
                              <input type="text" id="company-website" value={companyInfo.website} onChange={(e) => handleCompanyInfoChange('website', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
                            </div>
                            <div>
                              <label className="block text-gray-700 text-sm mb-1" htmlFor="company-employees">
                                Number of Employees
                              </label>
                              <select id="company-employees" value={companyInfo.employees} onChange={(e) => handleCompanyInfoChange('employees', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500">
                                <option value="1-10">1-10</option>
                                <option value="11-50">11-50</option>
                                <option value="51-200">51-200</option>
                                <option value="201-500">201-500</option>
                                <option value="500+">500+</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm mb-1" htmlFor="company-location">
                              Location
                            </label>
                            <input type="text" id="company-location" value={companyInfo.company_location} onChange={(e) => handleCompanyInfoChange('company_location', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
                          </div>
                          <div className="pt-2">
                            <button type="submit" className="bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600 transition-colors">
                              Save Changes
                            </button>
                          </div>
                        </form>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-4">
                          Contact Information
                        </h3>
                        <form className="space-y-4" onSubmit={async (e) => {
                          e.preventDefault();
                          try {
                            // Form submission logic would go here
                          } catch (error) {
                            console.error('Failed to update contact information:', error);
                          }
                        }}>
                          <div>
                            <label className="block text-gray-700 text-sm mb-1" htmlFor="contact-email">
                              Email Address
                            </label>
                            <input type="email" id="contact-email" defaultValue={employerData.email} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm mb-1" htmlFor="contact-phone">
                              Phone Number
                            </label>
                            <input type="tel" id="contact-phone" defaultValue={employerData.phone} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
                          </div>
                          <div className="pt-2">
                            <button type="submit" className="bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600 transition-colors">
                              Save Changes
                            </button>
                          </div>
                        </form>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-4">
                          Password
                        </h3>
                        <form className="space-y-4" onSubmit={async (e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const newPassword = formData.get('new-password') as string;
                          const confirmPassword = formData.get('confirm-password') as string;
                          
                          if (!newPassword || !confirmPassword) {
                            alert('Please fill in all password fields');
                            return;
                          }
                          
                          if (newPassword !== confirmPassword) {
                            alert('Passwords do not match');
                            return;
                          }
                          
                          const success = await changePassword(newPassword);
                          if (success) {
                            alert('Password updated successfully!');
                            (e.target as HTMLFormElement).reset();
                          } else {
                            alert('Failed to update password');
                          }
                        }}>
                          <div>
                            <label className="block text-gray-700 text-sm mb-1" htmlFor="new-password">
                              New Password
                            </label>
                            <input type="password" id="new-password" name="new-password" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm mb-1" htmlFor="confirm-password">
                              Confirm New Password
                            </label>
                            <input type="password" id="confirm-password" name="confirm-password" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
                          </div>
                          <div className="pt-2">
                            <button type="submit" className="bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600 transition-colors">
                              Change Password
                            </button>
                          </div>
                        </form>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h3 className="font-medium text-red-800 mb-2">
                          Danger Zone
                        </h3>
                        <p className="text-red-600 text-sm mb-4">
                          Permanently delete your account and all associated
                          data.
                        </p>
                        <button onClick={async () => {
                          if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                            const success = await deleteAccount();
                            if (success) {
                              alert('Account deleted successfully.');
                              router.push('/');
                            } else {
                              alert('Failed to delete account.');
                            }
                          }
                        }} className="bg-white border border-red-500 text-red-500 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modals */}
      <ImageUploadModal isOpen={isProfileImageModalOpen} onClose={() => setIsProfileImageModalOpen(false)} onSave={handleProfileImageChange} title="Update Profile Picture" aspectRatio="square" initialImage={employerData.logo} />
      <ImageUploadModal isOpen={isCoverImageModalOpen} onClose={() => setIsCoverImageModalOpen(false)} onSave={handleCoverImageChange} title="Update Cover Photo" aspectRatio="cover" initialImage={employerData.cover_image} />
      <CreatePostModal isOpen={isCreatePostModalOpen} onClose={() => setIsCreatePostModalOpen(false)} onPost={handlePostCreation} />
    </div>);
}