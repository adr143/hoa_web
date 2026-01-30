import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from 'lucide-react';
interface BreadcrumbItem {
  label: string;
  path: string;
}
interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  currentPageLabel?: string;
}
export function Breadcrumbs({
  items,
  currentPageLabel
}: BreadcrumbsProps) {
  return <nav className="flex items-center text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap">
        <li className="flex items-center">
          <Link href="/" className="flex items-center hover:text-teal-600 transition-colors">
            <HomeIcon size={16} className="mr-1" />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, index) => <li key={index} className="flex items-center">
            <ChevronRightIcon size={16} className="mx-2" />
            <Link href={item.path} className="hover:text-teal-600 transition-colors capitalize">
              {item.label}
            </Link>
          </li>)}
        {currentPageLabel && <li className="flex items-center">
            <ChevronRightIcon size={16} className="mx-2" />
            <span className="text-gray-700 font-medium truncate max-w-[200px]" aria-current="page">
              {currentPageLabel}
            </span>
          </li>}
      </ol>
    </nav>;
}