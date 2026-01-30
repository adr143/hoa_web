"use client";

import Link from "next/link";
import { CalendarIcon, StarIcon } from "lucide-react";

interface JobCardProps {
  id: string;
  title: string;
  employer: string;
  profile: string;
  location: string;
  description: string;
  tags: string[];
  postedDays: number;
  category?: string;
  rating?: number;
  reviewCount?: number;
}

export default function JobCard({
  id,
  title,
  employer,
  profile,
  location,
  description,
  tags,
  postedDays,
  category = "all",
  rating = 0,
  reviewCount = 0,
}: JobCardProps) {
  const categorySlug = category.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          <Link
            href={`/jobs/${categorySlug}/${id}`}
            className="hover:text-teal-600 transition-colors"
          >
            {title}
          </Link>
        </h3>
        <div className="flex justify-between items-center mt-2">
          <div className="flex justify-start items-center">
            <img className="w-10 h-10 rounded-full mr-3" src={profile} alt="Profile Image"/>
            <div>
              <p className="text-gray-700 font-medium">{employer}</p>
              {rating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <StarIcon size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">({reviewCount})</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-500 text-sm">{location}</p>
        </div>
      </div>

      <p className="text-gray-600 mb-6">{description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-500 text-sm flex items-center">
          <CalendarIcon size={16} className="mr-1" />
          Posted {postedDays} {postedDays === 1 ? "day" : "days"} ago
        </span>
        <Link
          href={`/jobs/${categorySlug}/${id}`}
          className="bg-teal-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-teal-600 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
