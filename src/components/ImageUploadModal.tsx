import React, { useState, useRef } from 'react';
import { XIcon, UploadIcon, ImageIcon } from 'lucide-react';
interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File) => void;
  title: string;
  aspectRatio?: 'square' | 'cover';
  initialImage?: string;
}
export function ImageUploadModal({
  isOpen,
  onClose,
  onSave,
  title,
  aspectRatio = 'square',
  initialImage
}: ImageUploadModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = event => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSave = () => {
    if (selectedFile) {
      setIsUploading(true);
      onSave(selectedFile);
      setIsUploading(false);
      onClose();
    }
  };
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XIcon size={20} />
          </button>
        </div>
        <div className="p-6">
          <div className={`mb-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 transition-colors ${aspectRatio === 'cover' ? 'h-48' : 'h-64'}`} onClick={triggerFileInput}>
            {selectedImage ? <div className="w-full h-full relative">
                <img src={selectedImage} alt="Preview" className={`w-full h-full object-cover ${aspectRatio === 'square' ? 'rounded-lg' : ''}`} />
                <button className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow-md" onClick={e => {
              e.stopPropagation();
              setSelectedImage(null);
              setSelectedFile(null);
            }}>
                  <XIcon size={16} className="text-gray-700" />
                </button>
              </div> : <>
                <ImageIcon size={48} className="text-gray-400 mb-2" />
                <p className="text-teal-500 font-medium mb-1">
                  Click to upload
                </p>
                <p className="text-gray-500 text-sm">PNG, JPG (Max 5MB)</p>
              </>}
          </div>
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
          <div className="flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={!selectedImage || isUploading} className={`px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 flex items-center ${!selectedImage || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isUploading && <UploadIcon size={16} className="mr-2 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>;
}