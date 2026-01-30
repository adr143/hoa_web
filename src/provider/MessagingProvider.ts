"use client"

import React, { useState, useCallback, useEffect } from 'react';
import { MessagingContext } from '@/context/MessagingContext';
import { Message, Conversation } from '@/types/messaging';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

const CONVERSATIONS_PER_PAGE = 10;

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { sendNotification } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatState, setChatState] = useState<{ open: boolean; recipientId?: string | null; recipientName?: string | null; initialText?: string | null }>({ open: false });
  const [conversationsOffset, setConversationsOffset] = useState(0);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);

  const sendMessage = useCallback(async (recipientId: string, text: string) => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { error: err } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user.id,
            recipient_id: recipientId,
            text,
            read: false
          }
        ]);
      if (err) throw err;
      await fetchMessages(recipientId);
      setConversationsOffset(0);
      setConversations([]);
      fetchConversations(0, CONVERSATIONS_PER_PAGE).catch(() => { /* ignore */ });
      try {
        await sendNotification(recipientId, {
          type: 'message',
          title: `New message from ${user.name || 'Someone'}`,
          message: text,
          sender_id: user.id,
          link: `/messages?to=${user.id}&name=${encodeURIComponent(user.name || '')}`,
        });
      } catch (notifyErr) {
        console.error('Failed to send message notification', notifyErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, sendNotification]);

  const fetchMessages = useCallback(async (recipientId: string) => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      if (err) throw err;
      setMessages(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchConversations = useCallback(async (offset = 0, limit = CONVERSATIONS_PER_PAGE) => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data: msgs, error: err } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (err) throw err;

      const convMap = new Map<string, { other_user_id: string; last_message: string; last_message_time: string; unread_count: number }>();
      (msgs || []).forEach(m => {
        const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
        if (!convMap.has(otherId)) {
          convMap.set(otherId, {
            other_user_id: otherId,
            last_message: m.text,
            last_message_time: m.created_at,
            unread_count: 0
          });
        }
        if (m.recipient_id === user.id && !m.read) {
          convMap.get(otherId)!.unread_count++;
        }
      });

      const allConvs = Array.from(convMap.values()).map((c, idx) => ({ ...c, id: `conv_${idx}` }));
      const paginatedConvs = allConvs.slice(offset, offset + limit);
      setHasMoreConversations(offset + limit < allConvs.length);

      const otherIds = paginatedConvs.map(c => c.other_user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', otherIds);

      const { data: workers } = await supabase
        .from('workers')
        .select('id, profile_image')
        .in('id', otherIds);

      const { data: employers } = await supabase
        .from('employers')
        .select('id, logo')
        .in('id', otherIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const workerMap = new Map(workers?.map(w => [w.id, w.profile_image]) || []);
      const employerMap = new Map(employers?.map(e => [e.id, e.logo]) || []);

      const mapped = paginatedConvs.map(c => ({
        ...c,
        current_user_id: user.id,
        other_user_avatar: workerMap.get(c.other_user_id) || employerMap.get(c.other_user_id) || null,
        other_user_name: profileMap.get(c.other_user_id)?.name ?? 'Unknown User'
      }));

      if (offset === 0) {
        setConversations(mapped);
      } else {
        setConversations(prev => [...prev, ...mapped]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadMoreConversations = useCallback(async () => {
    if (!hasMoreConversations || isLoading) return;
    const newOffset = conversationsOffset + CONVERSATIONS_PER_PAGE;
    setConversationsOffset(newOffset);
    await fetchConversations(newOffset, CONVERSATIONS_PER_PAGE);
  }, [conversationsOffset, hasMoreConversations, isLoading, fetchConversations]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(`messages_user_${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${user.id}` }, () => {
        setConversationsOffset(0);
        fetchConversations(0, CONVERSATIONS_PER_PAGE).catch(() => { /* ignore */ });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, () => {
        setConversationsOffset(0);
        fetchConversations(0, CONVERSATIONS_PER_PAGE).catch(() => { /* ignore */ });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `recipient_id=eq.${user.id}` }, () => {
        fetchConversations(conversationsOffset, CONVERSATIONS_PER_PAGE).catch(() => { /* ignore */ });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => { /* ignore */ });
    };
  }, [user?.id]);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const { error: err } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
      
      if (err) throw err;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark message as read');
    }
  }, []);

  const openChat = useCallback((recipientId?: string | null, recipientName?: string | null, initialText?: string | null) => {
    setChatState({ open: true, recipientId: recipientId ?? null, recipientName: recipientName ?? null, initialText: initialText ?? null });
    if (recipientId) {
      fetchMessages(recipientId).catch((e) => console.error('fetchMessages pre-load error:', e));
    }
  }, [fetchMessages]);

  const closeChat = useCallback(() => {
    setChatState({ open: false });
  }, []);

  return React.createElement(
    MessagingContext.Provider, {
      value: {
        messages,
        conversations,
        currentConversation,
        isLoading,
        error,
        hasMoreConversations,
        sendMessage,
        fetchMessages,
        fetchConversations,
        loadMoreConversations,
        setCurrentConversation,
        markAsRead,
        chatState,
        openChat,
        closeChat
      }
    },
    children
  )
}
