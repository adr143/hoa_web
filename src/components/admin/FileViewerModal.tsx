"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

interface FileViewerModalProps {
  bucket: string;
  files: string[]; // full paths
  isOpen: boolean;
  onClose: () => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({ bucket, files, isOpen, onClose }) => {
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchFileUrl = async (fileName: string) => {
    if (fileUrls[fileName]) return; // already fetched

    setLoadingFile(fileName);
    setError(null);

    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

      if (error || !data.publicUrl) {
        setError(`Failed to fetch ${fileName}`);
        return;
      }

      setFileUrls(prev => ({ ...prev, [fileName]: data.publicUrl }));
    } catch (err) {
      console.error(err);
      setError(`Error fetching ${fileName}`);
    } finally {
      setLoadingFile(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 max-w-4xl p-6 relative overflow-y-auto max-h-[90vh]">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4">File Viewer</h2>

        {files.map(fileName => (
          <div key={fileName} className="mb-6 border p-4 rounded-md">
            <p className="font-medium">{fileName.split("/").pop()}</p>
            <button
              className="mt-2 px-3 py-1 bg-teal-500 text-white rounded-md hover:bg-teal-600"
              onClick={() => fetchFileUrl(fileName)}
              disabled={!!fileUrls[fileName]}
            >
              {fileUrls[fileName] ? "Loaded" : "View File"}
            </button>

            {loadingFile === fileName && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {fileUrls[fileName] && (
              <div className="mt-2">
                {fileName.endsWith(".pdf") ? (
                  <iframe src={fileUrls[fileName]} className="w-full h-64 border" title={fileName}></iframe>
                ) : (
                  <img src={fileUrls[fileName]} alt={fileName} className="max-h-64 object-contain border" />
                )}
                <a
                  href={fileUrls[fileName]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-teal-600 underline"
                >
                  Open in new tab
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
