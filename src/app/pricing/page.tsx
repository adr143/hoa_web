"use client";

import React, { useState } from 'react';
import { CheckIcon, User, BadgeCheck, Crown, Star } from 'lucide-react';
import Link from 'next/link';
import { EMPLOYER_TIER_FEATURES, WORKER_TIER_FEATURES } from '@/types/verification';

export default function Pricing() {
  const [accountType, setAccountType] = useState<'employer' | 'worker'>('employer');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');
  return <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Verification & Pricing Plans
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect tier for your needs. Upgrade your account to unlock more features and build trust.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <div className="inline-flex p-1 bg-gray-100 rounded-full">
              <button
                onClick={() => setAccountType('employer')}
                className={`px-6 py-2 rounded-full text-sm font-medium ${accountType === 'employer' ? 'bg-teal-500 text-white' : 'text-gray-700'}`}
              >
                Employer Plans
              </button>
              <button
                onClick={() => setAccountType('worker')}
                className={`px-6 py-2 rounded-full text-sm font-medium ${accountType === 'worker' ? 'bg-teal-500 text-white' : 'text-gray-700'}`}
              >
                Worker Plans
              </button>
            </div>
            <div className="inline-flex p-1 bg-gray-100 rounded-full">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium ${billingPeriod === 'monthly' ? 'bg-teal-500 text-white' : 'text-gray-700'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annually')}
                className={`px-6 py-2 rounded-full text-sm font-medium ${billingPeriod === 'annually' ? 'bg-teal-500 text-white' : 'text-gray-700'}`}
              >
                Annual (Save 17%)
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {accountType === 'employer' ? (
            <>
              {/* Employer Basic */}
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <User className="h-10 w-10 text-teal-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {EMPLOYER_TIER_FEATURES.Basic.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-800">
                      {billingPeriod === 'monthly' ? EMPLOYER_TIER_FEATURES.Basic.price.monthly : EMPLOYER_TIER_FEATURES.Basic.price.annually}
                    </span>
                    {billingPeriod === 'annually' && EMPLOYER_TIER_FEATURES.Basic.price.annually !== 'Free' && <span className="text-sm text-gray-500 ml-2">/year</span>}
                  </div>
                  <Link href="/verification">
                    <button className="w-full py-3 px-6 rounded-lg font-medium mb-8 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                      Get Started
                    </button>
                  </Link>
                  <div className="border-t border-gray-200 pt-6">
                    <p className="font-medium text-gray-700 mb-4">Features:</p>
                    <ul className="space-y-3">
                      {EMPLOYER_TIER_FEATURES.Basic.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckIcon size={18} className="text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="font-medium text-gray-700 mb-2 mt-6">Requirements:</p>
                    <ul className="space-y-2">
                      {EMPLOYER_TIER_FEATURES.Basic.requirements.map((req, idx) => (
                        <li key={idx} className="text-sm text-gray-600">• {req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Employer Verified */}
              <div className="bg-white rounded-xl overflow-hidden border border-teal-500 shadow-lg">
                <div className="bg-teal-500 text-white text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <BadgeCheck className="h-10 w-10 text-teal-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {EMPLOYER_TIER_FEATURES.Verified.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-800">
                      {billingPeriod === 'monthly' ? EMPLOYER_TIER_FEATURES.Verified.price.monthly : EMPLOYER_TIER_FEATURES.Verified.price.annually}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  <Link href="/verification">
                    <button className="w-full py-3 px-6 rounded-lg font-medium mb-8 bg-teal-500 text-white hover:bg-teal-600 transition-colors">
                      Upgrade Now
                    </button>
                  </Link>
                  <div className="border-t border-gray-200 pt-6">
                    <p className="font-medium text-gray-700 mb-4">Features:</p>
                    <ul className="space-y-3">
                      {EMPLOYER_TIER_FEATURES.Verified.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckIcon size={18} className="text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="font-medium text-gray-700 mb-2 mt-6">Requirements:</p>
                    <ul className="space-y-2">
                      {EMPLOYER_TIER_FEATURES.Verified.requirements.map((req, idx) => (
                        <li key={idx} className="text-sm text-gray-600">• {req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Employer Enterprise */}
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <Crown className="h-10 w-10 text-teal-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {EMPLOYER_TIER_FEATURES.Enterprise.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-800">
                      {billingPeriod === 'monthly' ? EMPLOYER_TIER_FEATURES.Enterprise.price.monthly : EMPLOYER_TIER_FEATURES.Enterprise.price.annually}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  <Link href="/verification">
                    <button className="w-full py-3 px-6 rounded-lg font-medium mb-8 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                      Contact Sales
                    </button>
                  </Link>
                  <div className="border-t border-gray-200 pt-6">
                    <p className="font-medium text-gray-700 mb-4">Features:</p>
                    <ul className="space-y-3">
                      {EMPLOYER_TIER_FEATURES.Enterprise.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckIcon size={18} className="text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="font-medium text-gray-700 mb-2 mt-6">Requirements:</p>
                    <ul className="space-y-2">
                      {EMPLOYER_TIER_FEATURES.Enterprise.requirements.map((req, idx) => (
                        <li key={idx} className="text-sm text-gray-600">• {req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Worker Basic */}
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <User className="h-10 w-10 text-teal-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {WORKER_TIER_FEATURES.Basic.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-800">
                      {billingPeriod === 'monthly' ? WORKER_TIER_FEATURES.Basic.price.monthly : WORKER_TIER_FEATURES.Basic.price.annually}
                    </span>
                    {billingPeriod === 'annually' && WORKER_TIER_FEATURES.Basic.price.annually !== 'Free' && <span className="text-sm text-gray-500 ml-2">/year</span>}
                  </div>
                  <Link href="/verification">
                    <button className="w-full py-3 px-6 rounded-lg font-medium mb-8 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                      Get Started
                    </button>
                  </Link>
                  <div className="border-t border-gray-200 pt-6">
                    <p className="font-medium text-gray-700 mb-4">Features:</p>
                    <ul className="space-y-3">
                      {WORKER_TIER_FEATURES.Basic.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckIcon size={18} className="text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="font-medium text-gray-700 mb-2 mt-6">Requirements:</p>
                    <ul className="space-y-2">
                      {WORKER_TIER_FEATURES.Basic.requirements.map((req, idx) => (
                        <li key={idx} className="text-sm text-gray-600">• {req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Worker Verified */}
              <div className="bg-white rounded-xl overflow-hidden border border-teal-500 shadow-lg">
                <div className="bg-teal-500 text-white text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <BadgeCheck className="h-10 w-10 text-teal-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {WORKER_TIER_FEATURES.Verified.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-800">
                      {billingPeriod === 'monthly' ? WORKER_TIER_FEATURES.Verified.price.monthly : WORKER_TIER_FEATURES.Verified.price.annually}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  <Link href="/verification">
                    <button className="w-full py-3 px-6 rounded-lg font-medium mb-8 bg-teal-500 text-white hover:bg-teal-600 transition-colors">
                      Upgrade Now
                    </button>
                  </Link>
                  <div className="border-t border-gray-200 pt-6">
                    <p className="font-medium text-gray-700 mb-4">Features:</p>
                    <ul className="space-y-3">
                      {WORKER_TIER_FEATURES.Verified.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckIcon size={18} className="text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="font-medium text-gray-700 mb-2 mt-6">Requirements:</p>
                    <ul className="space-y-2">
                      {WORKER_TIER_FEATURES.Verified.requirements.map((req, idx) => (
                        <li key={idx} className="text-sm text-gray-600">• {req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Worker Premium */}
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <Star className="h-10 w-10 text-teal-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {WORKER_TIER_FEATURES.Premium.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-800">
                      {billingPeriod === 'monthly' ? WORKER_TIER_FEATURES.Premium.price.monthly : WORKER_TIER_FEATURES.Premium.price.annually}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  <Link href="/verification">
                    <button className="w-full py-3 px-6 rounded-lg font-medium mb-8 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                      Upgrade Now
                    </button>
                  </Link>
                  <div className="border-t border-gray-200 pt-6">
                    <p className="font-medium text-gray-700 mb-4">Features:</p>
                    <ul className="space-y-3">
                      {WORKER_TIER_FEATURES.Premium.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckIcon size={18} className="text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="font-medium text-gray-700 mb-2 mt-6">Requirements:</p>
                    <ul className="space-y-2">
                      {WORKER_TIER_FEATURES.Premium.requirements.map((req, idx) => (
                        <li key={idx} className="text-sm text-gray-600">• {req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="mt-16 bg-teal-50 rounded-xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Need a custom solution?
              </h3>
              <p className="text-gray-600 mb-6">
                Our Enterprise plan can be tailored to your specific
                requirements. Contact our sales team for a personalized quote.
              </p>
              <button className="bg-teal-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-teal-600 transition-colors shadow-sm">
                Contact Sales
              </button>
            </div>
            <div className="md:w-1/3">
              <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Enterprise solutions" className="rounded-lg shadow-md" />
            </div>
          </div>
        </div>
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                How long does verification take?
              </h3>
              <p className="text-gray-600">
                Verification typically takes 1-3 business days. You'll receive a notification
                once your verification is complete. Enterprise verifications may take longer
                due to additional document requirements.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Can I upgrade my tier later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade your tier at any time through the Verification Center.
                Simply submit the required documents for your desired tier and our team will
                review your request.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                What documents are accepted?
              </h3>
              <p className="text-gray-600">
                We accept government-issued IDs (passport, driver's license, national ID, PRC ID),
                NBI/Police/Barangay clearances, and business documents (SEC/DTI registration,
                business permits). All documents must be valid and clearly readable.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Is my data secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. All personal data and documents are encrypted and handled according
                to our Privacy Policy and applicable data protection laws. We use both AI-based
                and human safeguards to protect your information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>;
}