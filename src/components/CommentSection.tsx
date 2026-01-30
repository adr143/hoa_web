'use client';

import React, { useState, useEffect } from 'react';
import { SendIcon, MessageSquareIcon } from 'lucide-react';
import Link from 'next/link';
import { Comment, CommentAuthor } from '@/types';
import { supabase } from '@/lib/supabase';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  currentUser: CommentAuthor | null; // logged-in user (from profile)
  onAddComment: (newComment: Comment) => void;
}

export function CommentSection({ postId, comments, currentUser, onAddComment }: CommentSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorsMap, setAuthorsMap] = useState<Record<string, CommentAuthor>>({});

  // Fetch author profiles for comments
  useEffect(() => {
    const authorIds = Array.from(
      new Set(comments.map(c => c.author_id).filter(Boolean))
    ) as string[];
    if (authorIds.length === 0) return;

    supabase
      .from('profiles')
      .select('id, name, profile_image, account_type, is_admin')
      .in('id', authorIds)
      .then(({ data, error }) => {
        if (data) {
          const map: Record<string, CommentAuthor> = {};
          data.forEach((p) => (map[p.id] = p));
          setAuthorsMap(map);
        }
        if (error) console.error(error);
      });
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || commentText.trim() === '') return;
    setIsSubmitting(true);

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      post_id: postId,
      author_id: currentUser.id,
      content: commentText,
      date: new Date().toISOString(),
    };

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      author_id: currentUser.id,
      content: commentText,
      date: newComment.date,
    });

    if (!error) {
      onAddComment(newComment);
      setCommentText('');
    } else {
      console.error(error);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h3 className="font-medium text-gray-800 mb-3 flex items-center">
        <MessageSquareIcon size={18} className="mr-2" />
        Comments ({comments.length})
      </h3>

      {comments.length > 0 ? (
        <div className="space-y-4 mb-4">
          {comments.map((comment) => {
            const author = comment.author_id ? authorsMap[comment.author_id] : null;
            return (
              <div key={comment.id} className="flex">
                <div className="w-8 h-8 rounded-full overflow-hidden mr-3 flex-shrink-0">
                  {author?.profile_image && author.profile_image.trim() !== '' ? (
                    <img src={author.profile_image} alt={author.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300 text-white text-sm font-medium">
                      {author ? author.name.charAt(0) : '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <p className="font-medium text-gray-800 text-sm">{author?.name || 'Deleted User'}</p>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(comment.date).toLocaleDateString()} at{' '}
                    {new Date(comment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-sm mb-4">No comments yet</p>
      )}

      {currentUser ? (
        <form onSubmit={handleSubmit} className="flex">
          <div className="w-8 h-8 rounded-full overflow-hidden mr-3 flex-shrink-0">
            {currentUser?.profile_image && currentUser.profile_image.trim() !== '' ? (
              <img src={currentUser.profile_image} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-teal-500 text-white text-sm font-medium">
                {currentUser?.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full border border-gray-300 rounded-full py-2 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-teal-500 p-1 ${
                isSubmitting || commentText.trim() === '' ? 'opacity-50 cursor-not-allowed' : 'hover:text-teal-600'
              }`}
              disabled={isSubmitting || commentText.trim() === ''}
            >
              <SendIcon size={18} />
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <p className="text-gray-600 text-sm">
            <Link href="/signin" className="text-teal-500 font-medium hover:text-teal-600">
              Sign in
            </Link>{' '}
            to leave a comment
          </p>
        </div>
      )}
    </div>
  );
}
