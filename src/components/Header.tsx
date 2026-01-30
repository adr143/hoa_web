"use client";

import React, { useState } from "react";
import { MenuIcon, XIcon, ChevronDownIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { NotificationCenter } from "./NotificationCenter";
import { jobCategories } from "@/data/jobCategories";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isLoggedIn, user, logout } = useAuth();
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img src="/images/logo.png" alt="House of Angels" className="h-12 sm:h-14" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="/"
            className="text-gray-800 font-medium hover:text-teal-500 transition-colors"
          >
            Home
          </Link>

          {/* Find Jobs Dropdown - Hidden for employers */}
          {user?.account_type !== 'employer' && (
          <div className="relative group">
            <button className="flex items-center text-gray-800 font-medium hover:text-teal-500 transition-colors">
              <Link href="/jobs" className="flex items-center">Find Jobs</Link>
              <ChevronDownIcon size={16} className="ml-1" />
            </button>
            <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
              {jobCategories.map(category => (
                <Link
                  key={category.slug}
                  href={`/jobs/${category.slug}`}
                  className="block px-4 py-2 text-gray-800 hover:bg-teal-50 hover:text-teal-500"
                >
                  {category.title}
                </Link>
              ))}
            </div>
          </div>
          )}

          {/* Hire Workers Dropdown - Hidden for workers */}
          {user?.account_type !== 'jobseeker' && (
          <div className="relative group">
            <button className="flex items-center text-gray-800 font-medium hover:text-teal-500 transition-colors">
              <Link href="/hiring" className="flex items-center">Hire Workers</Link>
              <ChevronDownIcon size={16} className="ml-1" />
            </button>
            <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
              {jobCategories.map(category => (
                <Link
                  key={category.slug}
                  href={`/hiring/${category.slug}`}
                  className="block px-4 py-2 text-gray-800 hover:bg-teal-50 hover:text-teal-500"
                >
                  {category.title}
                </Link>
              ))}
            </div>
          </div>
          )}

          {/* Resources Dropdown */}
          <div className="relative group">
            <button className="flex items-center text-gray-800 font-medium hover:text-teal-500 transition-colors">
              Resources
              <ChevronDownIcon size={16} className="ml-1" />
            </button>
            <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
              <Link
                href="/about"
                className="block px-4 py-2 text-gray-800 hover:bg-teal-50 hover:text-teal-500"
              >
                About Us
              </Link>
              {/* <Link
                href="/articles"
                className="block px-4 py-2 text-gray-800 hover:bg-teal-50 hover:text-teal-500"
              >
                Articles and Guides
              </Link> */}
              <Link
                href="/pricing"
                className="block px-4 py-2 text-gray-800 hover:bg-teal-50 hover:text-teal-500"
              >
                Price Plans
              </Link>
              <Link
                href="/help"
                className="block px-4 py-2 text-gray-800 hover:bg-teal-50 hover:text-teal-500"
              >
                Help
              </Link>
            </div>
          </div>

          {/* Auth/User Menu */}
          {isLoggedIn ? (
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full overflow-hidden focus:outline-none border-2 border-transparent hover:border-teal-500 transition-colors"
                >
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={20} className="text-gray-600" />
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-30">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="font-medium text-gray-800">{user?.name}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>

                    <Link
                      href={user?.account_type === "employer" ? "/employer/profile" : "/worker/profile"}
                      className="block px-4 py-2 text-gray-800 hover:bg-teal-50 hover:text-teal-500"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      My Profile
                    </Link>

                    <Link
                      href="/notifications"
                      className="block px-4 py-2 text-gray-800 hover:bg-teal-50 hover:text-teal-500"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Notifications
                    </Link>

                    <Link
                      href="/messages"
                      className="block px-4 py-2 text-gray-800 hover:bg-teal-50 hover:text-teal-500"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Messages
                    </Link>

                    <Link
                      href="/verification"
                      className="block px-4 py-2 text-gray-800 hover:bg-teal-50 hover:text-teal-500"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Verification Center
                    </Link>

                    {user?.account_type === "employer" && (
                      <Link
                        href="/jobs/create"
                        className="block px-4 py-2 text-gray-800 hover:bg-teal-50 hover:text-teal-500"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Post a Job
                      </Link>
                    )}

                    {user?.is_admin && (
                      <Link
                        href="/admin/dashboard"
                        className="block px-4 py-2 text-gray-800 hover:bg-teal-50 hover:text-teal-500"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link
              href="/signin"
              className="bg-teal-500 text-white px-6 py-2 rounded-full font-medium hover:bg-teal-600 transition-colors"
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-2">
          {isLoggedIn && <NotificationCenter />}
          <button onClick={toggleMenu} className="text-gray-800 hover:text-teal-500 focus:outline-none p-1">
            {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 max-h-[calc(100vh-56px)] overflow-y-auto shadow-lg">
          <nav className="flex flex-col py-2">
            <Link
              href="/"
              className="px-4 py-3 text-sm sm:text-base text-gray-800 font-medium hover:bg-teal-50 hover:text-teal-500 border-b border-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>

            {/* Find Jobs Mobile - Hidden for employers */}
            {user?.account_type !== 'employer' && (
            <div className="border-b border-gray-100">
              <details className="group">
                <summary className="px-4 py-3 text-gray-800 font-medium hover:bg-teal-50 hover:text-teal-500 cursor-pointer flex items-center justify-between">
                  Find Jobs
                  <ChevronDownIcon size={16} className="group-open:rotate-180 transition-transform" />
                </summary>
                <div className="bg-gray-50 pl-4">
                  {jobCategories.map(category => (
                    <Link
                      key={category.slug}
                      href={`/jobs/${category.slug}`}
                      className="block px-4 py-2 text-gray-700 text-sm hover:text-teal-500"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {category.title}
                    </Link>
                  ))}
                </div>
              </details>
            </div>
            )}

            {/* Hire Workers Mobile - Hidden for workers */}
            {user?.account_type !== 'jobseeker' && (
            <div className="border-b border-gray-100">
              <details className="group">
                <summary className="px-4 py-3 text-gray-800 font-medium hover:bg-teal-50 hover:text-teal-500 cursor-pointer flex items-center justify-between">
                  Hire Workers
                  <ChevronDownIcon size={16} className="group-open:rotate-180 transition-transform" />
                </summary>
                <div className="bg-gray-50 pl-4">
                  {jobCategories.map(category => (
                    <Link
                      key={category.slug}
                      href={`/hiring/${category.slug}`}
                      className="block px-4 py-2 text-gray-700 text-sm hover:text-teal-500"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {category.title}
                    </Link>
                  ))}
                </div>
              </details>
            </div>
            )}

            {/* Resources Mobile */}
            <div className="border-b border-gray-100">
              <details className="group">
                <summary className="px-4 py-3 text-gray-800 font-medium hover:bg-teal-50 hover:text-teal-500 cursor-pointer flex items-center justify-between">
                  Resources
                  <ChevronDownIcon size={16} className="group-open:rotate-180 transition-transform" />
                </summary>
                <div className="bg-gray-50 pl-4">
                  <Link
                    href="/about"
                    className="block px-4 py-2 text-gray-700 text-sm hover:text-teal-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About Us
                  </Link>
                  <Link
                    href="/articles"
                    className="block px-4 py-2 text-gray-700 text-sm hover:text-teal-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Articles and Guides
                  </Link>
                  <Link
                    href="/pricing"
                    className="block px-4 py-2 text-gray-700 text-sm hover:text-teal-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/contact"
                    className="block px-4 py-2 text-gray-700 text-sm hover:text-teal-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </div>
              </details>
            </div>

            {/* Auth Mobile */}
            {isLoggedIn ? (
              <>
                <Link
                  href={user?.account_type === "employer" ? "/employer/profile" : "/worker/profile"}
                  className="px-4 py-3 text-gray-800 font-medium hover:bg-teal-50 hover:text-teal-500 border-b border-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Profile
                </Link>
                <Link
                  href="/notifications"
                  className="px-4 py-3 text-gray-800 font-medium hover:bg-teal-50 hover:text-teal-500 border-b border-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Notifications
                </Link>
                <Link
                  href="/messages"
                  className="px-4 py-3 text-gray-800 font-medium hover:bg-teal-50 hover:text-teal-500 border-b border-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Messages
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-3 text-left text-gray-800 font-medium hover:bg-teal-50 hover:text-teal-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                className="px-4 py-3 text-teal-500 font-medium hover:bg-teal-50 border-b border-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
