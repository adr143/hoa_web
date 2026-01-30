"use client";

export const dynamic = "force-dynamic";

import React, { Suspense } from "react";
import { ArticleProvider } from "@/provider/ArticleProvider";
import {ArticlesContent} from "@/app/__articles/ArticleContent"; // move your existing logic here (below)
import { Loader2 } from "lucide-react";

// Page entry — Suspense boundary prevents SSR crash with useSearchParams()
export default function Articles() {
  return (
    <ArticleProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center text-gray-600">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading articles...
          </div>
        }
      >
        <ArticlesContent />
      </Suspense>
    </ArticleProvider>
  );
}
