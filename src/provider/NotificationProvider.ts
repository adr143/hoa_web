'use client';

import React, { ReactNode, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { NotificationContext } from '@/context/NotificationContext';
import { Notification as AppNotification } from '@/types';

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  const mapNotification = (row: any): AppNotification => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: row.read,
    date: row.date,
    link: row.link,
    related_id: row.related_id,
    sender_id: row.sender_id,
    recipient_id: row.recipient_id,
    additional_content: row.additional_content,
  });

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .order('date', { ascending: false });

    if (!error && data) {
      const mapped = data.map(mapNotification);
      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.read).length);
    } else if (error) {
      console.error('Failed to fetch notifications:', error.message);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel(`notifications:user_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = mapNotification(payload.new);
          setNotifications(prev => {
            if (prev.find(n => n.id === newNotification.id)) return prev;
            return [newNotification, ...prev];
          });
          if (!newNotification.read) setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  const addNotification = async (notification: Omit<AppNotification, 'id' | 'date' | 'read' | 'recipientId'>) => {
    if (!user) return;
    await sendNotification(user.id, notification);
  };

  const sendNotification = async (recipientId: string, notification: Omit<AppNotification, 'id' | 'date' | 'read' | 'recipientId'>) => {
    if (!recipientId) return;
    try {
      let tempId: string | null = null;
      if (user && recipientId === user.id) {
        tempId = `temp-${Date.now()}`;
        const tempNotification: AppNotification = {
          id: tempId,
          read: false,
          date: new Date().toISOString(),
          recipient_id: user.id,
          ...notification,
        };
        setNotifications(prev => [tempNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert({ ...notification, sender_id:notification.sender_id, recipient_id: recipientId, read: false, date: new Date().toISOString() })
        .select()
        .single();

      if (error) {
        if (tempId) {
          setNotifications(prev => prev.filter(n => n.id !== tempId));
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        console.error('Failed to send notification:', error.message);
      } else if (data && tempId) {
        setNotifications(prev => prev.map(n => (n.id === tempId ? mapNotification(data) : n)));
      }
    } catch (err) {
      console.error('sendNotification error:', err);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    await supabase.from('notifications').update({ read: true }).eq('recipient_id', user?.id);
  };

  const clearNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    setUnreadCount(0);
    await supabase.from('notifications').delete().eq('recipient_id', user?.id);
  };

  return React.createElement(
    NotificationContext.Provider,
    {
      value: {
        notifications,
        unreadCount,
        addNotification,
        sendNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        selectedNotification,
        setSelectedNotification,
      }
    },
    children
  );
};
