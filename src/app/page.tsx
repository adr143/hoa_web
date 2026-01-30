"use client";

import { Hero } from '@/components/Hero';
import { JobCategories } from '@/components/JobCategories';
import { HowItWorks } from '@/components/HowItWorks';
import { AvailableJobs } from '@/components/AvailableJobs';
export default function Home() {
  return <>
      <Hero />
      <JobCategories />
      <HowItWorks />
      <AvailableJobs />
    </>;
}