"use client";

import React, { useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessagingChat } from '@/components/MessagingChat';
import { useMessaging } from '@/hooks/useMessaging';

function MessagesContent() {
  const params = useSearchParams();
  const {fetchConversations,
    fetchMessages,
    setCurrentConversation,
    hasMoreConversations,
    isLoading,
    conversations,
    loadMoreConversations
  } = useMessaging();
  const to = params.get('to') ?? undefined;
  const name = params.get('name') ?? undefined;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchConversations(0, 10).catch(() => { /* ignore */ });
  }, [fetchConversations]);

  useEffect(() => {
    if (to) {
      fetchMessages(to).catch(() => { /* ignore */ });
      setCurrentConversation(null);
    }
  }, [to, fetchConversations, setCurrentConversation, fetchMessages]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMoreConversations && !isLoading) {
      loadMoreConversations();
    }
  }, [hasMoreConversations, isLoading, loadMoreConversations]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 1.0
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-0 overflow-hidden">
        <div className="md:col-span-1 border-r border-gray-200 bg-white hidden md:block">
          <div className="h-full flex flex-col">
            <h3 className="font-semibold p-4 border-b border-gray-200 bg-white">Messages</h3>
            <div className="space-y-1 flex-1 overflow-y-auto p-2">
              {conversations.map((c) => (
                <button 
                  key={c.id} 
                  onClick={() => window.location.search = `?to=${c.other_user_id}&name=${encodeURIComponent(c.other_user_name || '')}`} 
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                    to === c.other_user_id ? 'bg-teal-50 border border-teal-200' : ''
                  }`}
                >
                  {c.other_user_avatar ? (
                    <img src={c.other_user_avatar} className="w-12 h-12 rounded-full object-cover flex-shrink-0" alt={c.other_user_name} />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-sm font-semibold text-teal-700 flex-shrink-0">
                      {(c.other_user_name||'').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900">{c.other_user_name}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{c.last_message}</div>
                  </div>
                  {c.unread_count > 0 && (
                    <div className="bg-teal-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-medium flex-shrink-0">
                      {c.unread_count}
                    </div>
                  )}
                </button>
              ))}
              {hasMoreConversations && (
                <div ref={loadMoreRef} className="py-2 text-center">
                  {isLoading && <span className="text-sm text-gray-500">Loading...</span>}
                </div>
              )}
              {conversations.length === 0 && !isLoading && (
                <div className="text-gray-500 p-8 text-center text-sm">No conversations yet</div>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-3 bg-white">
          <div className="h-full flex flex-col relative">
            {to && (
              <div className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <button 
                  onClick={() => window.location.search = ''} 
                  className="p-4 flex items-center gap-2 text-gray-700 hover:text-gray-900 w-full active:bg-gray-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="font-medium">Back to conversations</span>
                </button>
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <MessagingChat recipientId={to ?? undefined} recipientName={name ?? undefined} isOpen={Boolean(true)} inline />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-64px)] flex items-center justify-center">Loading...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
