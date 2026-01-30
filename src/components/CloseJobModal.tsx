"use client";
import React from "react";

interface CloseJobModalProps {
  setConfirmCloseJobOpen: (open: boolean) => void;
  handleCloseJob: () => void;
}

export const CloseJobModal: React.FC<CloseJobModalProps> = ({ setConfirmCloseJobOpen, handleCloseJob }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Close Job Posting</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to close this job posting? It will no longer accept new applications.
          </p>
          <div className="flex justify-end space-x-3">
            <button onClick={() => setConfirmCloseJobOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleCloseJob} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
              Close Job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
