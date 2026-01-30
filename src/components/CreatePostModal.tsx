import React, { useState, useRef } from 'react';
import { XIcon, ImageIcon, VideoIcon, SendIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (post: {
    content: string;
    images: File[];
    date: string;
  }) => void;
}
export function CreatePostModal({
  isOpen,
  onClose,
  onPost
}: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    user
  } = useAuth();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const newPreviews: string[] = [];
      
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = event => {
          if (event.target?.result) {
            newPreviews.push(event.target.result as string);
            if (newPreviews.length === filesArray.length) {
              setImages([...images, ...filesArray]);
              setImagePreviews([...imagePreviews, ...newPreviews]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };
  const removeImage = (index: number) => {
    const updatedImages = [...images];
    const updatedPreviews = [...imagePreviews];
    updatedImages.splice(index, 1);
    updatedPreviews.splice(index, 1);
    setImages(updatedImages);
    setImagePreviews(updatedPreviews);
  };
  const handleSubmit = () => {
    if (content.trim() === '' && images.length === 0) return;
    setIsSubmitting(true);
    // In a real app, you would send this to your backend
    const newPost = {
      content,
      images,
      date: new Date().toISOString()
    };
    setTimeout(() => {
      onPost(newPost);
      setIsSubmitting(false);
      setContent('');
      setImages([]);
      setImagePreviews([]);
      onClose();
    }, 1000);
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Create Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XIcon size={20} />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-start mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden mr-3">
              {user?.profile_image ? <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-teal-500 text-white font-bold">
                  {user?.name.charAt(0)}
                </div>}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">{user?.name}</p>
            </div>
          </div>
          <textarea placeholder="What would you like to share?" value={content} onChange={e => setContent(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 mb-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
          {imagePreviews.length > 0 && <div className={`grid ${imagePreviews.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-4`}>
              {imagePreviews.map((preview, index) => <div key={index} className="relative">
                  <img src={preview} alt={`Upload ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                  <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md">
                    <XIcon size={16} className="text-gray-700" />
                  </button>
                </div>)}
            </div>}
          <div className="flex items-center justify-between border-t border-b py-3 my-4">
            <p className="text-gray-700 font-medium">Add to your post</p>
            <div className="flex space-x-2">
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-green-500 hover:bg-green-50 rounded-full" title="Add Images">
                <ImageIcon size={20} />
              </button>
              <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-full" title="Add Video">
                <VideoIcon size={20} />
              </button>
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          </div>
          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={isSubmitting || content.trim() === '' && images.length === 0} className={`px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 flex items-center ${isSubmitting || content.trim() === '' && images.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isSubmitting ? <>
                  <SendIcon size={16} className="mr-2 animate-spin" />
                  Posting...
                </> : <>
                  <SendIcon size={16} className="mr-2" />
                  Post
                </>}
            </button>
          </div>
        </div>
      </div>
    </div>;
}