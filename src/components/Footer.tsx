import React from 'react';
import { FacebookIcon, TwitterIcon, InstagramIcon, LinkedinIcon } from 'lucide-react';
import Link from 'next/link';
export function Footer() {
  return <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">House of Angels</h3>
            <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4">
              Connecting employers with skilled workers across all service
              categories. Our mission is to make quality work accessible to all.
            </p>
            <div className="flex space-x-4 justify-center sm:justify-start">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <FacebookIcon size={18} className="sm:w-5 sm:h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <TwitterIcon size={18} className="sm:w-5 sm:h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <InstagramIcon size={18} className="sm:w-5 sm:h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <LinkedinIcon size={18} className="sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Quick Links</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link href="/" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  Job Categories
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  Help
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-center sm:text-left">
            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">For Employers</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link href="/workers" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  Browse Workers
                </Link>
              </li>
              <li>
                <Link href="/employer/profile" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  Safety Guidelines
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-center sm:text-left">
            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">For Workers</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link href="/jobs" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  Find Jobs
                </Link>
              </li>
              <li>
                <Link href="/worker/profile" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  Create Profile
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  Success Stories
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  Skills Training
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-gray-400">
          <p className="text-xs sm:text-sm">
            &copy; {new Date().getFullYear()} House of Angels. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>;
}