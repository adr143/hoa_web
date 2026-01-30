"use client";
import React from "react";
import { MapPinIcon, BriefcaseIcon, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { EmployerData } from "@/types";

interface EmployerCardProps {
  employer: EmployerData;
  employerId: string;
}

export const EmployerCard: React.FC<EmployerCardProps> = ({ employer, employerId }) => {
  if (!employer) return null;

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">About the Employer</h3>
      <Link href={`/employer/${employerId}`} className="flex items-center mb-4 hover:bg-gray-100 p-2 rounded-lg transition-colors">
        <img src={employer.logo} alt={employer.name} className="w-12 h-12 rounded-full border border-gray-200" />
        <div className="ml-3">
          <p className="font-medium text-gray-800">{employer.name}</p>
          {employer.verified && (
            <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs flex items-center w-fit">
              Verified
            </span>
          )}
        </div>
      </Link>
      <div className="space-y-3 text-sm text-gray-600">
        <p className="flex items-start">
          <MapPinIcon size={16} className="mr-2 mt-1 flex-shrink-0" />
          <span>{employer.location}</span>
        </p>
        <p className="flex items-start">
          <BriefcaseIcon size={16} className="mr-2 mt-1 flex-shrink-0" />
          <span>{employer.employees} employees</span>
        </p>
        <p className="flex items-start">
          <CalendarIcon size={16} className="mr-2 mt-1 flex-shrink-0" />
          <span>Member since {employer.member_since}</span>
        </p>
        <Link href={`/employer/${employerId}`} className="text-teal-500 hover:text-teal-600 font-medium text-sm">
          View Full Profile →
        </Link>
      </div>
    </div>
  );
};
