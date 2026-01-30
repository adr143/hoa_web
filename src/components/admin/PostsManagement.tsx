'use client';

import React from 'react';
import { TrashIcon, FileTextIcon } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  date: string;
  employer?: {
    company_name?: string;
    logo?: string;
  };
  images?: string[];
  likes?: number;
}

interface PostsManagementProps {
  posts: Post[];
  onDeletePost: (postId: string) => void;
}

export function PostsManagement({ posts, onDeletePost }: PostsManagementProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Employer Posts Management</h2>
        <div className="text-sm text-gray-600">Total: {posts.length}</div>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center text-gray-500">
            <FileTextIcon size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No posts found</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Employer Info */}
                  <div className="flex items-center mb-4">
                    {post.employer?.logo && (
                      <img
                        src={post.employer.logo}
                        alt=""
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {post.employer?.company_name || 'Unknown Employer'}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(post.date)}</p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-gray-700 mb-4">{post.content}</p>

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                      {post.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Post image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Post Stats */}
                  <div className="flex items-center text-sm text-gray-500">
                    <span>{post.likes || 0} likes</span>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => onDeletePost(post.id)}
                  className="ml-4 text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete post"
                >
                  <TrashIcon size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

