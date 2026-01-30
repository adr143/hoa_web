'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import FindJobsContent from '@/app/jobs/FindJobsContent'; // we'll move your logic here

export default function FindJobs() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading job listings...
        </div>
      }
    >
      <FindJobsContent />
    </Suspense>
  );
}
