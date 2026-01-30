import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { jobCategories } from '@/data';
import { Job } from '@/types';

export function AvailableJobs() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', ...jobCategories.map(category => category.title)]
  const jobs: Job[] = []
  const filteredJobs = activeCategory === 'All' ? jobs : jobs.filter(job => job.category.includes(activeCategory));
  return <section className="py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
            Latest Job Opportunities
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
            Browse through our most recent job listings or post your own job to
            find the perfect match
          </p>
        </div>
        <div className="mb-6 sm:mb-8 flex flex-wrap justify-center gap-2">
          {categories.map((category, index) => <button key={index} onClick={() => setActiveCategory(category)} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${activeCategory === category ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {category}
            </button>)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredJobs.map((job, index) => <JobCard job={job} key={index} />)}
        </div>
        <div className="mt-10 sm:mt-12 text-center">
          <button onClick={() => router.push('/jobs')} className="bg-teal-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm text-sm sm:text-base w-full sm:w-auto">
            View All Jobs
          </button>
        </div>
      </div>
    </section>;
}

function JobCard({ job }: { job: Job }) {
  return <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-base sm:text-xl font-semibold text-gray-800 line-clamp-2">{job.title}</h3>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-1">
          <p className="text-sm sm:text-base text-gray-700 font-medium line-clamp-1">{job.employer?.profile?.name}</p>
          <p className="text-gray-500 text-xs sm:text-sm line-clamp-1">{job.location}</p>
        </div>
      </div>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 line-clamp-3">{job.description}</p>
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        {job.tags.map((tag, index) => <span key={index} className="bg-teal-100 text-teal-700 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">
            {tag}
          </span>)}
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <span className="text-gray-500 text-sm">Posted 2 days ago</span>
        <button className="text-teal-500 hover:text-teal-600 font-medium text-sm">
          Apply Now →
        </button>
      </div>
    </div>;
}