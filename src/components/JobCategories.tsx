// JobCategories.tsx
import React from 'react';
import { HomeIcon, HammerIcon, TruckIcon, HeartPulseIcon, PackageIcon, ScissorsIcon, SunIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { jobCategories } from '@/data/jobCategories'; // centralized config

// Optional: map icons to category titles
const iconMap: Record<string, React.ReactNode> = {
  'Care & Household': <HomeIcon size={32} className="text-teal-500" />,
  'Construction, Trades & Craftsmanship': <HammerIcon size={32} className="text-teal-500" />,
  'Driving & Transport': <TruckIcon size={32} className="text-teal-500" />,
  'Licensed Healthcare Professionals': <HeartPulseIcon size={32} className="text-teal-500" />,
  'Logistics & General Labor': <PackageIcon size={32} className="text-teal-500" />,
  'Personal & Wellness': <ScissorsIcon size={32} className="text-teal-500" />,
  'Specialized/Seasonal Work': <SunIcon size={32} className="text-teal-500" />,
};

export function JobCategories() {
  const router = useRouter();

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 md:mb-4">Explore Job Categories</h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
            Find qualified workers or job opportunities across a wide range of categories
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {jobCategories.map((category) => (
            <CategoryCard
              key={category.title}
              icon={iconMap[category.title] || <HomeIcon size={32} className="text-teal-500" />}
              title={category.title}
              jobs={category.subcategories.map((sub) => sub.name)}
              slug={category.slug}
            />
          ))}
        </div>

        <div className="mt-10 md:mt-12 text-center">
          <button onClick={() => router.push('/hiring')} className="bg-teal-500 text-white px-6 sm:px-8 py-2 md:py-3 rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm text-sm sm:text-base w-full sm:w-auto">
            View All Categories
          </button>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ icon, title, jobs, slug }: { icon: React.ReactNode; title: string; jobs: string[]; slug: string }) {
  const router = useRouter();

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 mt-1">{icon}</div>
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 line-clamp-2">{title}</h3>
      </div>
      <ul className="text-gray-600 space-y-2 ml-2 text-sm md:text-base">
        {jobs.slice(0, 3).map((job, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></span>
            <span className="line-clamp-1">{job}</span>
          </li>
        ))}
        {jobs.length > 3 && (
          <li className="text-teal-500 font-medium text-xs md:text-sm">+{jobs.length - 3} more</li>
        )}
      </ul>
      <div className="mt-4">
        <button onClick={() => router.push(`/hiring/${slug}`)} className="text-teal-500 font-medium hover:text-teal-600 transition-colors text-xs md:text-sm inline-block">
          Browse jobs →
        </button>
      </div>
    </div>
  );
}
