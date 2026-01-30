'use client';

import React, { useState, useEffect } from 'react';
import { MapPinIcon, BriefcaseIcon, CalendarIcon, MessageCircleIcon } from 'lucide-react';
import { useParams, usePathname, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useEmployer } from '@/hooks/useEmployer';

export default function EmployerDisplayProfile() {
  const params = useParams();
  const { fetchEmployer, employerData } = useEmployer();
  const slug = params?.slug as string;
  const { user } = useAuth();
  // messaging handled inside MessagingChat component

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const availableTabs = React.useMemo(() => ['profile', 'jobs'], []);

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
  // messaging handled on the dedicated messages page via redirect

  useEffect(() => {
    if (slug) {
      (async () => {
        await fetchEmployer(slug);
        setLoading(false);
      })();
    }
  }, [slug, fetchEmployer]);

  // message sending handled via `sendMessage` from hook when needed

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col items-center justify-start min-h-screen bg-gray-50 p-6 space-y-6">
        <div className="w-full h-64 bg-gray-200 rounded-lg" />
        <div className="flex w-full max-w-5xl space-x-6">
          <div className="w-32 h-32 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-4 py-2">
            <div className="h-6 w-1/3 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!employerData) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Employer not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        {/* Cover Image */}
        <div className="h-40 sm:h-48 md:h-64 rounded-t-lg overflow-hidden">
          {employerData.cover_image ? (
            <img src={employerData.cover_image} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No cover image</span>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-b-lg">
          {/* Profile Header */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/4 mb-6 md:mb-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-lg border-4 border-white shadow-md overflow-hidden -mt-12 sm:-mt-14 md:-mt-16 lg:-mt-20 relative z-10 bg-white mx-auto md:mx-0">
                  {employerData.logo ? (
                    <img src={employerData.logo} alt={employerData.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-xl sm:text-2xl font-bold">{employerData.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                {employerData.verified && (
                  <div className="mt-4 flex items-center justify-center md:justify-start">
                    <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs sm:text-sm flex items-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Verified
                    </span>
                  </div>
                )}
                <div className="mt-4">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500 text-xs sm:text-sm">Membership</span>
                      <span className="text-teal-500 font-medium text-xs sm:text-sm">{employerData.tier}</span>
                    </div>
                    {employerData.tier === 'Paid Plan' && (
                      <div className="bg-teal-500 text-xs text-white font-medium py-0.5 px-2 rounded-full inline-block">
                        PREMIUM
                      </div>
                    )}
                    {employerData.tier === 'Enterprise' && (
                      <div className="bg-purple-500 text-xs text-white font-medium py-0.5 px-2 rounded-full inline-block">
                        ENTERPRISE
                      </div>
                    )}
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
                  <div className="flex gap-4 items-center justify-center md:justify-start">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{employerData.name}</h1>
                    {employerData.tier !== 'Free' && (
                      <div className="flex items-center">
                        <span className="w-4 h-4 sm:w-5 sm:h-5 bg-teal-100 rounded-full flex items-center justify-center mr-2">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700">{employerData.tier} Employer</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 break-all">{employerData.website}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-6">
                  {user?.id !== employerData.id && (
                    <button
                      onClick={() => router.push(`/messages?to=${employerData.id}&name=${encodeURIComponent(employerData.name)}`)}
                      className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium"
                    >
                      <MessageCircleIcon size={18} />
                      Message
                    </button>
                  )}
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
                  <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
                    <button
                      onClick={() => handleSetTab('profile')}
                      className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                        activeTab === 'profile'
                          ? 'border-teal-500 text-teal-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => handleSetTab('jobs')}
                      className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                        activeTab === 'jobs'
                          ? 'border-teal-500 text-teal-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Job Posts
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'profile' && (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-800 mb-3">About</h2>
                      <p className="text-gray-600">{employerData.description}</p>
                    </div>

                    {employerData.specialties.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3">Specialties</h2>
                        <div className="flex flex-wrap gap-2">
                          {employerData.specialties.map((specialty, index) => (
                            <span key={index} className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-800 mb-3">Contact Information</h2>
                      <div className="space-y-2 text-gray-600">
                        <p>Email: {employerData.email}</p>
                        <p>Phone: {employerData.phone}</p>
                        <p>Website: {employerData.website}</p>
                      </div>
                    </div>
                    
                    {employerData.posts.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Posts</h2>
                        <div className="space-y-6">
                          {employerData.posts.map((post) => (
                            <div key={post.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-start mb-3">
                                {employerData.logo ? (
                                  <img src={employerData.logo} alt={employerData.name} className="w-10 h-10 rounded-full mr-3" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                    <span className="text-gray-400 font-bold">{employerData.name.charAt(0)}</span>
                                  </div>
                                )}
                                <div>
                                  <h3 className="font-medium text-gray-800">{employerData.name}</h3>
                                  <p className="text-gray-500 text-xs">{new Date(post.date).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <p className="text-gray-600 mb-4">{post.content}</p>
                              {post.images && post.images.length > 0 && (
                                <div className={`grid ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-4`}>
                                  {post.images.map((image, idx) => (
                                    <img key={idx} src={image} alt="Post" className="rounded-lg w-full h-48 object-cover" />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'jobs' && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">Job Listings</h2>
                    <div className="space-y-4">
                      {employerData.jobs.length === 0 ? (
                        <p className="text-gray-500">No active job listings</p>
                      ) : (
                        employerData.jobs.map((job) => (
                          <div key={job.id} className="border border-teal-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <Link href={`/jobs/${job.category.toLowerCase().replace(/\s+/g, '-')}/${job.id}`} className="font-medium text-gray-800 hover:text-teal-600">
                                {job.title}
                              </Link>
                              <span className={`text-xs px-2 py-1 rounded-full ${job.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {job.status}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{job.description}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {job.tags.map((tag, idx) => (
                                <span key={idx} className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500">
                              <div>
                                <span className="mr-4">
                                  <MapPinIcon size={14} className="inline mr-1" />
                                  {job.location}
                                </span>
                                <span>
                                  <CalendarIcon size={14} className="inline mr-1" />
                                  Posted: {new Date(job.posted_date).toLocaleDateString()}
                                </span>
                              </div>
                              <Link href={`/jobs/${job.category.toLowerCase().replace(/\s+/g, '-')}/${job.id}`} className="text-teal-500 hover:text-teal-600 font-medium">
                                View Details
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}
