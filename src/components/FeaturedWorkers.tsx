import React from 'react';
import { MapPinIcon, StarIcon } from 'lucide-react';
import Link from 'next/link';
export function FeaturedWorkers() {
  const workers = [{
    id: 'worker1',
    name: 'Carlos Mendoza',
    title: 'Professional Gardener',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    rating: 4.9,
    reviews: 27,
    location: 'Makati City',
    skills: ['Landscaping', 'Plant Care', 'Garden Design'],
    hourlyRate: '₱250'
  }, {
    id: 'worker2',
    name: 'Isabella Santos',
    title: 'Master Carpenter',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    rating: 4.8,
    reviews: 34,
    location: 'Quezon City',
    skills: ['Custom Furniture', 'Cabinetry', 'Woodworking'],
    hourlyRate: '₱350'
  }, {
    id: 'worker3',
    name: 'Miguel Reyes',
    title: 'Professional Driver',
    image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    rating: 5.0,
    reviews: 42,
    location: 'Pasig City',
    skills: ['Family Driving', 'Navigation', 'Vehicle Maintenance'],
    hourlyRate: '₱200'
  }, {
    id: 'worker4',
    name: 'Ana Lim',
    title: 'Physical Therapist',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    rating: 4.9,
    reviews: 51,
    location: 'Taguig City',
    skills: ['Geriatric Care', 'Rehabilitation', 'Strength Training'],
    hourlyRate: '₱800'
  }];
  return <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 md:mb-4">
            Featured Workers
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
            Connect with our top-rated professionals ready to help you with your
            needs
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {workers.map(worker => <div key={worker.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="h-40 sm:h-48 overflow-hidden">
                <img src={worker.image} alt={worker.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 md:p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base line-clamp-2">{worker.name}</h3>
                  <div className="flex items-center flex-shrink-0">
                    <span className="text-yellow-400 font-bold text-xs md:text-sm mr-1">
                      {worker.rating}
                    </span>
                    <StarIcon size={14} className="text-yellow-400 fill-current md:w-4 md:h-4" />
                    <span className="text-gray-500 text-xs ml-1">
                      ({worker.reviews})
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-xs md:text-sm line-clamp-1">{worker.title}</p>
                <p className="text-gray-500 text-xs md:text-sm flex items-center mt-1 mb-3 line-clamp-1">
                  <MapPinIcon size={12} className="mr-1 flex-shrink-0" /> {worker.location}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {worker.skills.slice(0, 2).map((skill, index) => <span key={index} className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs line-clamp-1">
                      {skill}
                    </span>)}
                  {worker.skills.length > 2 && <span className="text-gray-500 text-xs flex items-center">
                      +{worker.skills.length - 2}
                    </span>}
                </div>
                <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
                  <p className="text-teal-500 font-bold text-sm md:text-base">
                    {worker.hourlyRate}/hr
                  </p>
                  <Link href={`/worker/${worker.id}`} className="text-teal-500 text-xs md:text-sm font-medium hover:text-teal-600 transition-colors whitespace-nowrap">
                    View Profile →
                  </Link>
                </div>
              </div>
            </div>)}
        </div>
        <div className="mt-10 md:mt-12 text-center">
          <Link href="/workers" className="bg-teal-500 text-white px-6 sm:px-8 py-2 md:py-3 rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm text-sm sm:text-base w-full sm:w-auto inline-block">
            Browse All Workers
          </Link>
        </div>
      </div>
    </section>;
}