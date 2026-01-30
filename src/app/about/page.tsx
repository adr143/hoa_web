import React from 'react';
export default function About() {
  return <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 sm:mb-8">
          About House of Angels
        </h1>
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4">
            Our Mission
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
            House of Angels is a technology platform that enables clients/employers (“Clients”) to discover and connect with independent service providers (e.g., caregivers and skilled workers) (“Providers”). HOA does not employ Providers, does not assign work, does not control work conditions, hours, or pay, and is not a recruitment or employment agency, contractor, or payroll company.
          </p>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
            Our platform serves as a bridge between job seekers and employers,
            making the hiring process more efficient, transparent, and
            accessible for everyone involved.
          </p>
        </div>
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4">
            How We Started
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
            House of Angels began with a simple observation: finding skilled workers
            for specific jobs was often challenging, while many talented
            individuals struggled to connect with potential employers. We saw an
            opportunity to create a platform that would solve both problems
            simultaneously.
          </p>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
            Since our launch, we've helped thousands of workers find meaningful
            employment and enabled countless businesses to find the perfect
            talent for their specific needs.
          </p>
        </div>
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4">
            Our Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg sm:text-xl font-semibold text-teal-600 mb-2 sm:mb-3">
                Trust & Safety
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                We prioritize creating a secure environment for all users
                through thorough vetting processes and transparent reviews.
              </p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg sm:text-xl font-semibold text-teal-600 mb-2 sm:mb-3">
                Inclusivity
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                We believe in creating equal opportunities for all workers,
                regardless of background or experience level.
              </p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg sm:text-xl font-semibold text-teal-600 mb-2 sm:mb-3">
                Quality Service
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                We're committed to maintaining high standards for both job
                listings and worker profiles on our platform.
              </p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg sm:text-xl font-semibold text-teal-600 mb-2 sm:mb-3">
                Community
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                We foster a supportive community where employers and workers can
                build lasting professional relationships.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-teal-50 p-6 sm:p-8 rounded-lg">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4">
            Join Our Community
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
            Whether you're looking to hire talent or find your next opportunity,
            House of Angels is here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button className="bg-teal-500 text-white px-6 py-2.5 sm:py-3 rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm text-sm sm:text-base">
              Post a Job
            </button>
            <button className="bg-white border border-teal-500 text-teal-500 px-6 py-2.5 sm:py-3 rounded-full font-medium hover:bg-teal-50 transition-colors shadow-sm text-sm sm:text-base">
              Find Work
            </button>
          </div>
        </div>
      </div>
    </div>;
}