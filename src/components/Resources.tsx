import React from 'react';
export function Resources() {
  return <section className="py-12 sm:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
            Resources & Guides
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
            Helpful information for employers and job seekers to make the most
            of our platform
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <ResourceCard image="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" title="How to Write an Effective Job Description" description="Learn how to create job listings that attract the right candidates and clearly communicate your needs." category="For Employers" />
          <ResourceCard image="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" title="Building a Standout Worker Profile" description="Tips for showcasing your skills and experience to increase your chances of getting hired." category="For Workers" />
          <ResourceCard image="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" title="Fair Pay Guidelines by Service Category" description="Reference rates and pricing information to help both parties agree on fair compensation." category="General" />
        </div>
        <div className="mt-10 sm:mt-16 bg-teal-50 rounded-xl p-6 sm:p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="md:w-2/3 text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
                Ready to get started?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Join thousands of employers and workers already using our
                platform to connect, collaborate, and complete jobs with
                confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                <button className="bg-teal-500 text-white px-6 py-2.5 sm:py-3 rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm text-sm sm:text-base">
                  Post a Job
                </button>
                <button className="bg-white border border-teal-500 text-teal-500 px-6 py-2.5 sm:py-3 rounded-full font-medium hover:bg-teal-50 transition-colors shadow-sm text-sm sm:text-base">
                  Find Work
                </button>
              </div>
            </div>
            <div className="md:w-1/3 w-full">
              <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="People working together" className="rounded-lg shadow-md w-full h-auto" />
            </div>
          </div>
        </div>
      </div>
    </section>;
}

interface ResourceCardProps {
  image: string;
  title: string;
  description: string;
  category: string;
}

function ResourceCard({
  image,
  title,
  description,
  category
}: ResourceCardProps) {
  return <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <img src={image} alt={title} className="w-full h-40 sm:h-48 object-cover" />
      <div className="p-4 sm:p-6">
        <div className="mb-2 sm:mb-3">
          <span className="bg-teal-100 text-teal-700 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">
            {category}
          </span>
        </div>
        <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 line-clamp-2">{title}</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-3">{description}</p>
        <a href="#" className="text-sm sm:text-base text-teal-500 font-medium hover:text-teal-600 transition-colors">
          Read More →
        </a>
      </div>
    </div>;
}