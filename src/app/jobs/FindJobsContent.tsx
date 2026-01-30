'use client';

import React, { useEffect, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import { LocationInput } from '@/components/LocationInput';
import { useJobs } from '@/hooks/useJobs';
import JobCard from '@/components/JobCard';
import { Job } from '@/types';
import { jobCategories, JobCategory } from '@/data/jobCategories';

export default function FindJobsContent() {
  const { category } = useParams<{ category?: string }>();
  const searchParams = useSearchParams();
  const { fetchJobs } = useJobs();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [activeCategorySlug, setActiveCategorySlug] = useState(category || 'all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [distanceFilter, setDistanceFilter] = useState('any');
  const [locationFilter, setLocationFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [employmentType, setEmploymentType] = useState('any');
  const [salaryType, setSalaryType] = useState('any');
  const [customDays, setCustomDays] = useState('');
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (category) setActiveCategorySlug(category);
  }, [category]);

  // Get worker's current location (or use their home location from profile)
  useEffect(() => {
    if (useCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In production, use reverse geocoding API to convert coordinates to location name
          setCurrentLocation(`${position.coords.latitude},${position.coords.longitude}`);
        },
        (error) => {
          console.error('Error getting location:', error);
          setUseCurrentLocation(false);
        }
      );
    }
  }, [useCurrentLocation]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // --- Fetch jobs from Supabase ---
  useEffect(() => {
    const getJobs = async () => {
      // Determine which location to use
      const effectiveLocation = useCurrentLocation ? currentLocation : locationFilter;
      const effectiveDistance = distanceFilter !== 'any' ? parseFloat(distanceFilter) : undefined;
      const effectiveMinSalary = minSalary ? parseFloat(minSalary) : undefined;
      const effectiveMaxSalary = maxSalary ? parseFloat(maxSalary) : undefined;

      const result = await fetchJobs(
        activeCategorySlug === 'all' ? undefined : activeCategorySlug,
        searchTerm || undefined,
        effectiveLocation || undefined,
        dateFilter,
        undefined, // range
        effectiveDistance,
        subcategoryFilter || undefined,
        employmentType !== 'any' ? employmentType : undefined,
        effectiveMinSalary,
        effectiveMaxSalary,
        skillsFilter.length > 0 ? skillsFilter : undefined,
        currentPage,
        pageSize
      );

      setJobs(result.jobs);
      setTotalCount(result.totalCount);
      setLoading(false);
    };

    getJobs();
  }, [fetchJobs, activeCategorySlug, searchTerm, locationFilter, dateFilter, distanceFilter, subcategoryFilter, useCurrentLocation, currentLocation, minSalary, maxSalary, employmentType, skillsFilter, currentPage]);

  const categoryInfo: JobCategory =
    jobCategories.find(c => c.slug === activeCategorySlug) || {
      title: 'All Job Categories',
      description: 'Browse all available job opportunities across various categories.',
      image: 'https://images.unsplash.com/photo-1454165804606-...',
      subcategories: [],
      slug: '',
    };

  const subcategories = activeCategorySlug === 'all'
    ? []
    : categoryInfo.subcategories.map(s => s.name);

  // Client-side filtering for custom days and salary type
  const filteredJobs = jobs.filter((job) => {
    // Custom days filter
    if (customDays && job.posted_date) {
      const daysAgo = parseInt(customDays);
      if (!isNaN(daysAgo)) {
        const jobDate = new Date(job.posted_date);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        if (jobDate < cutoffDate) return false;
      }
    }

    // Salary type filter
    if (salaryType !== 'any' && job.salary_type !== salaryType) {
      return false;
    }

    return true;
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="h-48 relative">
            <img
              src={categoryInfo.image}
              alt={categoryInfo.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-teal-900/70 to-transparent flex items-center">
              <div className="px-8 text-white max-w-lg">
                <h1 className="text-3xl font-bold mb-2">{categoryInfo.title}</h1>
                <p className="text-white/90">{categoryInfo.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="relative max-w-lg mb-6">
            <input
              type="text"
              placeholder="Search for jobs..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full py-3 px-5 pr-12 rounded-full border border-gray-300 focus:ring-2 focus:ring-teal-500"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <SearchIcon size={20} className="text-gray-400" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Date Posted</label>
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="all">Any time</option>
                  <option value="today">Today</option>
                  <option value="week">Past week</option>
                  <option value="month">Past month</option>
                </select>
              </div>

              {subcategories.length > 0 && (
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Subcategory</label>
                  <select
                    value={subcategoryFilter}
                    onChange={(e) => setSubcategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">All subcategories</option>
                    {subcategories.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm mb-2 text-gray-700">Location</label>
                <div className="space-y-2">
                  {!useCurrentLocation && (
                    <LocationInput
                      id="location-filter"
                      label=""
                      placeholder="Enter location"
                      onChange={setLocationFilter}
                    />
                  )}
                  <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={useCurrentLocation}
                      onChange={(e) => {
                        setUseCurrentLocation(e.target.checked);
                        if (e.target.checked) setLocationFilter('');
                      }}
                      className="mr-2 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                    />
                    Use my current location
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Distance Radius</label>
                <select
                  value={distanceFilter}
                  onChange={e => setDistanceFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="any">Any distance</option>
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                  <option value="100">Within 100 km</option>
                </select>
                {distanceFilter !== 'any' && !locationFilter && !useCurrentLocation && (
                  <p className="mt-1 text-xs text-amber-600">⚠️ Set a location to use distance filter</p>
                )}
              </div>
            </div>
            {(locationFilter || useCurrentLocation) && distanceFilter !== 'any' && (
              <p className="mt-4 text-sm text-teal-600">
                🎯 Showing jobs within {distanceFilter}km of {useCurrentLocation ? 'your location' : locationFilter}
              </p>
            )}
          </div>

          {/* Advanced Filters */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-800">Advanced Filters</span>
                {(minSalary || maxSalary || employmentType !== 'any' || salaryType !== 'any' || customDays || skillsFilter.length > 0) && (
                  <span className="px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded-full">
                    {[minSalary, maxSalary, employmentType !== 'any', salaryType !== 'any', customDays, skillsFilter.length > 0].filter(Boolean).length} active
                  </span>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvancedFilters && (
              <div className="px-6 pb-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {/* Salary Range */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="number"
                          placeholder="Min (₱)"
                          value={minSalary}
                          onChange={(e) => setMinSalary(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500"
                          min="0"
                        />
                      </div>
                      <span className="text-gray-500">to</span>
                      <div className="flex-1">
                        <input
                          type="number"
                          placeholder="Max (₱)"
                          value={maxSalary}
                          onChange={(e) => setMaxSalary(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Salary Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Salary Type</label>
                    <select
                      value={salaryType}
                      onChange={(e) => setSalaryType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="any">Any type</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="project">Per Project</option>
                    </select>
                  </div>

                  {/* Employment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="any">Any type</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="temporary">Temporary</option>
                      <option value="freelance">Freelance</option>
                    </select>
                  </div>

                  {/* Posted Within Days */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Posted Within (Days)</label>
                    <input
                      type="number"
                      placeholder="e.g., 7, 14, 30"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500"
                      min="1"
                    />
                  </div>

                  {/* Skills Filter */}
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add skill requirement (e.g., Plumbing, Carpentry)"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && skillInput.trim()) {
                              e.preventDefault();
                              if (!skillsFilter.includes(skillInput.trim())) {
                                setSkillsFilter([...skillsFilter, skillInput.trim()]);
                              }
                              setSkillInput('');
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500"
                        />
                        <button
                          onClick={() => {
                            if (skillInput.trim() && !skillsFilter.includes(skillInput.trim())) {
                              setSkillsFilter([...skillsFilter, skillInput.trim()]);
                              setSkillInput('');
                            }
                          }}
                          className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      {skillsFilter.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {skillsFilter.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm"
                            >
                              {skill}
                              <button
                                onClick={() => setSkillsFilter(skillsFilter.filter((_, i) => i !== index))}
                                className="hover:text-teal-900"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clear Advanced Filters */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setMinSalary('');
                      setMaxSalary('');
                      setEmploymentType('any');
                      setSalaryType('any');
                      setCustomDays('');
                      setSkillsFilter([]);
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Clear Advanced Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          {loading ? (
            <p className="text-center text-gray-500">Loading jobs...</p>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                id={job.id!}
                title={job.title}
                employer={job.employer?.profile?.name || 'Unknown Employer'}
                profile={job.employer?.logo || 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'}
                location={job.location}
                description={job.description}
                tags={job.tags}
                postedDays={job.posted_days}
                category={activeCategorySlug}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No jobs found matching your criteria.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('all');
                  setLocationFilter('');
                  setDistanceFilter('any');
                }}
                className="mt-4 text-teal-500 hover:text-teal-600 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredJobs.length > 0 && totalCount > pageSize && (
            <div className="flex justify-center items-center gap-4 mt-8 pb-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {currentPage} of {Math.ceil(totalCount / pageSize)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
