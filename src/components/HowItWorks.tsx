import React from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon, CheckCircleIcon, CalendarIcon, BriefcaseIcon, UserIcon, FileTextIcon } from 'lucide-react';
export function HowItWorks() {
  const router = useRouter();
  return <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 md:mb-4">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
            Whether you're looking to hire or find work, our platform makes the
            process simple and efficient.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10 md:mb-16">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-teal-600 mb-6 text-center">
              For Employers
            </h3>
            <div className="space-y-4 md:space-y-6">
              <StepCard icon={<FileTextIcon size={28} className="text-teal-500 md:w-8 md:h-8" />} step="1" title="Post a Job" description="Create a detailed job listing specifying your requirements, location, and budget." />
              <StepCard icon={<SearchIcon size={28} className="text-teal-500 md:w-8 md:h-8" />} step="2" title="Review Applications" description="Browse profiles, check qualifications, and review ratings from previous employers." />
              <StepCard icon={<CheckCircleIcon size={28} className="text-teal-500 md:w-8 md:h-8" />} step="3" title="Hire & Pay" description="Select the right worker, schedule the job, and pay securely through our platform." />
            </div>
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-teal-600 mb-6 text-center">
              For Job Seekers
            </h3>
            <div className="space-y-4 md:space-y-6">
              <StepCard icon={<UserIcon size={28} className="text-teal-500 md:w-8 md:h-8" />} step="1" title="Create Profile" description="Showcase your skills, experience, and availability to attract potential employers." />
              <StepCard icon={<BriefcaseIcon size={28} className="text-teal-500 md:w-8 md:h-8" />} step="2" title="Find Opportunities" description="Browse job listings that match your skills and apply with just a few clicks." />
              <StepCard icon={<CalendarIcon size={28} className="text-teal-500 md:w-8 md:h-8" />} step="3" title="Work & Earn" description="Complete jobs, build your reputation, and receive secure payments for your services." />
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6">
          <button onClick={() => router.push('/jobs/create')} className="bg-teal-500 text-white px-6 sm:px-8 py-2 md:py-3 rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm text-sm sm:text-base">
            Post a Job
          </button>
          <button onClick={() => router.push('/jobs')} className="bg-white border border-teal-500 text-teal-500 px-6 sm:px-8 py-2 md:py-3 rounded-full font-medium hover:bg-teal-50 transition-colors shadow-sm text-sm sm:text-base">
            Find Work
          </button>
        </div>
      </div>
    </section>;
}

interface StepCardProps {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
}
function StepCard({
  icon,
  step,
  title,
  description
}: StepCardProps) {
  return <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 md:gap-4 mb-4">
        <div className="flex-shrink-0 mt-1">{icon}</div>
        <div className="bg-teal-100 text-teal-700 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0">
          {step}
        </div>
      </div>
      <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 md:mb-3">{title}</h3>
      <p className="text-sm md:text-base text-gray-600 leading-relaxed">{description}</p>
    </div>;
}