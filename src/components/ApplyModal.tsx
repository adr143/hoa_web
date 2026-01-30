"use client";
import React from "react";
import { XIcon } from "lucide-react";
import { Job } from "@/types";

interface ApplyModalProps {
  job: Job;
  handleApply: (data: any, files?: FileList) => void;
  setApplyModalOpen: (open: boolean) => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({ job, handleApply, setApplyModalOpen }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Apply for: {job.title}</h2>
          <button onClick={() => setApplyModalOpen(false)} className="text-gray-400 hover:text-gray-500">
            <XIcon size={20} />
          </button>
        </div>
        <div className="p-6">
          <form className="space-y-6" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const files = (formData.get('resume') as File)?.name ? (document.getElementById('file-upload') as HTMLInputElement)?.files ?? undefined : undefined;
            handleApply(Object.fromEntries(formData.entries()), files);
          }}>
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="cover-message">Message to Employer</label>
              <textarea id="cover-message" name="cover_letter" rows={5} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Introduce yourself..." required></textarea>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Upload Documents (Optional)</label>
              <input type="file" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent" id="file-upload" name="resume" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
            </div>
            <div className="pt-4">
              <button type="submit" className="w-full bg-teal-500 text-white py-3 rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm">Submit Application</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
