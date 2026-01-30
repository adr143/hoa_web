'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { SearchIcon, MapPinIcon, StarIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { LocationInput } from '@/components/LocationInput';
import { jobCategories } from '@/data/jobCategories';
import { useWorker } from '@/hooks/useWorker';

function HireWorkersContent() {
  const { category } = useParams<{ category?: string }>();
  const { fetchWorkers } = useWorker();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [activeCategorySlug, setActiveCategorySlug] = useState(category || 'all');
  const [ratingFilter, setRatingFilter] = useState('any');
  const [locationFilter, setLocationFilter] = useState('');
  const [distanceFilter, setDistanceFilter] = useState('any');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minHourlyRate, setMinHourlyRate] = useState('');
  const [maxHourlyRate, setMaxHourlyRate] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('any');
  const [availability, setAvailability] = useState('any');
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Update category if URL changes
  useEffect(() => {
    if (category) setActiveCategorySlug(category);
  }, [category]);

  // Get user's current location
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

  // --- Dynamically get subcategories from jobCategories ---
  const categoryInfo = useMemo(() => 
    jobCategories.find(c => c.slug === activeCategorySlug) || {
      title: 'All Worker Categories',
      description: 'Browse all available skilled workers across various categories.',
      image: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=1000&q=80',
      subcategories: [],
      slug: ''
    }, [activeCategorySlug]);

  const subcategories = activeCategorySlug === 'all'
    ? []
    : categoryInfo.subcategories.map(s => s.name);

  // --- Fetch workers ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [workers, setWorkers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    const loadWorkers = async () => {
      setLoading(true);
      const effectiveLocation = useCurrentLocation ? currentLocation : locationFilter;
      const effectiveDistance = distanceFilter !== 'any' ? parseFloat(distanceFilter) : undefined;
      const effectiveRating = ratingFilter !== 'any' ? parseFloat(ratingFilter) : undefined;
      const effectiveMinRate = minHourlyRate ? parseFloat(minHourlyRate) : undefined;
      const effectiveMaxRate = maxHourlyRate ? parseFloat(maxHourlyRate) : undefined;

      const result = await fetchWorkers(
        activeCategorySlug === 'all' ? undefined : categoryInfo.title,
        effectiveLocation || undefined,
        effectiveDistance,
        effectiveRating,
        subcategoryFilter || undefined,
        skillsFilter.length > 0 ? skillsFilter : undefined,
        effectiveMinRate,
        effectiveMaxRate,
        currentPage,
        pageSize
      );
      setWorkers(result.workers);
      setTotalCount(result.totalCount);
      setLoading(false);
    };

    loadWorkers();
  }, [activeCategorySlug, fetchWorkers, locationFilter, distanceFilter, ratingFilter, subcategoryFilter, useCurrentLocation, currentLocation, minHourlyRate, maxHourlyRate, skillsFilter, currentPage, categoryInfo.title]);

  // --- Client-side search filtering ---
  const filteredWorkers = workers.filter(worker =>
    searchTerm === '' ||
    worker.profile?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.skills.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-5xl mx-auto">
        {activeCategorySlug && (
          <div className="mb-12 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="h-48 overflow-hidden relative">
              <img src={categoryInfo.image} alt={categoryInfo.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-teal-900/70 to-transparent flex items-center">
                <div className="px-8 text-white max-w-lg">
                  <h1 className="text-3xl font-bold mb-2">{categoryInfo.title}</h1>
                  <p className="text-white/90">{categoryInfo.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-lg mb-6">
          <input
            type="text"
            placeholder="Search for workers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 px-5 pr-12 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <SearchIcon size={20} className="text-gray-400" />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm mb-6 md:mb-8">
          <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <div>
              <label className="block text-gray-700 text-xs md:text-sm mb-2 font-medium">Minimum Rating</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 text-sm"
              >
                <option value="any">Any rating</option>
                <option value="3">3+ stars</option>
                <option value="4">4+ stars</option>
                <option value="4.5">4.5+ stars</option>
                <option value="5">5 stars only</option>
              </select>
            </div>

            {subcategories.length > 0 && (
              <div>
                <label className="block text-gray-700 text-sm mb-2">Subcategory</label>
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
              <label className="block text-gray-700 text-sm mb-2">Location</label>
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
              <label className="block text-gray-700 text-sm mb-2">Distance Radius</label>
              <select
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500"
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
              🎯 Showing workers within {distanceFilter}km of {useCurrentLocation ? 'your location' : locationFilter}
            </p>
          )}
        </div>

        {/* Advanced Filters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 md:mb-8">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-base md:text-lg font-semibold text-gray-800">Advanced Filters</span>
              {(minHourlyRate || maxHourlyRate || experienceLevel !== 'any' || availability !== 'any' || skillsFilter.length > 0) && (
                <span className="px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded-full">
                  {[minHourlyRate, maxHourlyRate, experienceLevel !== 'any', availability !== 'any', skillsFilter.length > 0].filter(Boolean).length} active
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
                {/* Hourly Rate Range */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate Range</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Min (₱)"
                        value={minHourlyRate}
                        onChange={(e) => setMinHourlyRate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500"
                        min="0"
                      />
                    </div>
                    <span className="text-gray-500">to</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Max (₱)"
                        value={maxHourlyRate}
                        onChange={(e) => setMaxHourlyRate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="any">Any experience</option>
                    <option value="entry">Entry Level (0-2 years)</option>
                    <option value="intermediate">Intermediate (2-5 years)</option>
                    <option value="expert">Expert (5+ years)</option>
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="any">Any availability</option>
                    <option value="immediate">Available immediately</option>
                    <option value="week">Available within a week</option>
                    <option value="month">Available within a month</option>
                  </select>
                </div>

                {/* Skills Filter */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add skill (e.g., Plumbing, Carpentry)"
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
                    setMinHourlyRate('');
                    setMaxHourlyRate('');
                    setExperienceLevel('any');
                    setAvailability('any');
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

        {/* Worker Cards */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            </div>
          ) : filteredWorkers.length > 0 ? (
            filteredWorkers.map((worker) => <WorkerCard key={worker.id}
              id={worker.id}
              name={worker.profile?.name}
              title={worker.title}
              location={worker.location}
              rating={worker.rating}
              reviews={worker.reviews}
              description={worker.description}
              skills={worker.skills}
              hourly_rate={worker.hourly_rate}
            />)
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No workers found matching your criteria.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRatingFilter('any');
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
          {filteredWorkers.length > 0 && totalCount > pageSize && (
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

/* Worker Card Component */
function WorkerCard({ id, name, title, location, reviews, description, skills, hourly_rate }: any) {
  const averageRating = reviews && reviews.length > 0
    ? reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviews.length
    : 0;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start">
        <div className="md:w-1/4 mb-4 md:mb-0 md:mr-6">
          <div className="bg-gray-200 rounded-full w-24 h-24 mx-auto md:mx-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-500">{name.charAt(0)}</span>
          </div>
          <div className="text-center md:text-left mt-2">
            {averageRating > 0 && (
              <div className="flex items-center justify-center md:justify-start">
                <span className="text-yellow-400 font-bold mr-1">{averageRating.toFixed(1)}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      size={16}
                      className={`${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'} fill-current`}
                    />
                  ))}
                </div>
                <span className="text-gray-500 text-sm ml-1">({reviews?.length || 0})</span>
              </div>
            )}
            <p className="text-teal-500 font-bold mt-2">{hourly_rate}/hr</p>
          </div>
        </div>
        <div className="md:w-3/4">
          <div className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{name}</h3>
                <p className="text-gray-700">{title}</p>
              </div>
              <p className="text-gray-500 text-sm flex items-center">
                <MapPinIcon size={14} className="mr-1" />
                {location}
              </p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">{description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((skill: string, index: number) => (
              <span key={index} className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
          <div className="flex justify-end">
            <Link
              href={`/worker/${id}`}
              className="bg-teal-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-teal-600 transition-colors"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HireWorkers() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <HireWorkersContent />
    </Suspense>
  );
}
