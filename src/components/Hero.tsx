import React, { useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
export function Hero() {
  const [userType, setUserType] = useState('employer');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      if (userType === 'employer') {
        router.push(`/workers?search=${encodeURIComponent(searchTerm)}`);
      } else {
        router.push(`/jobs?search=${encodeURIComponent(searchTerm)}`);
      }
    }
  };
  const handleButtonClick = () => {
    if (userType === 'employer') {
      router.push('/employer/profile');
    } else {
      router.push('/jobs');
    }
  };
  return <section className="bg-gradient-to-r from-teal-50 to-blue-50 min-h-screen md:min-h-[calc(100vh-64px)] flex items-center py-8 md:py-0">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="w-full md:w-1/2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 md:mb-6 leading-tight">
              {userType === 'employer' ? 'Find Skilled Workers For Any Job' : 'Find Your Next Job Opportunity'}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-6 md:mb-8 max-w-lg leading-relaxed">
              {userType === 'employer' ? 'Connect with qualified and trusted workers in your area. We make it easy to find the right match for your specific needs.' : 'Connect with employers looking for your skills. We make it easy to find the right job opportunity for your expertise.'}
            </p>
            <div className="mb-6 md:mb-8 inline-flex p-1 bg-gray-100 rounded-full text-xs sm:text-sm">
              <button onClick={() => setUserType('employer')} className={`px-3 sm:px-4 py-2 rounded-full font-medium transition-colors ${userType === 'employer' ? 'bg-teal-500 text-white' : 'text-gray-700 hover:text-teal-500'}`}>
                I want to hire
              </button>
              <button onClick={() => setUserType('jobseeker')} className={`px-3 sm:px-4 py-2 rounded-full font-medium transition-colors ${userType === 'jobseeker' ? 'bg-teal-500 text-white' : 'text-gray-700 hover:text-teal-500'}`}>
                I want to work
              </button>
            </div>
            <form onSubmit={handleSearch} className="relative max-w-lg mb-6 md:mb-8">
              <input type="text" placeholder={userType === 'employer' ? 'Search for workers...' : 'Search for jobs...'} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full py-3 px-4 sm:px-5 pr-12 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-md text-sm sm:text-base" />
              <button type="submit" className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal-500 transition-colors">
                <SearchIcon size={20} />
              </button>
            </form>
            <button onClick={handleButtonClick} className="w-full sm:w-auto bg-teal-500 text-white px-6 sm:px-8 py-3 rounded-full font-medium hover:bg-teal-600 transition-colors shadow-md text-sm sm:text-base">
              {userType === 'employer' ? 'Post a Job' : 'Find Jobs'}
            </button>
          </div>
          <div className="w-full md:w-1/2 flex justify-center">
            <img src={userType === 'employer' ? 'https://qnsjtzfhcdkyksipizbm.supabase.co/storage/v1/object/public/web-images/image_hero_1.jpg' : 'https://qnsjtzfhcdkyksipizbm.supabase.co/storage/v1/object/public/web-images/image_hero_2.png'} alt={userType === 'employer' ? 'Person hiring workers' : 'Person looking for job'} className="rounded-lg shadow-xl w-full h-auto object-cover max-h-[300px] sm:max-h-[400px] md:max-h-[500px]" />
          </div>
        </div>
      </div>
    </section>;
}