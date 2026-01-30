import { createContext } from 'react';
import { Notification as AppNotification } from '@/types';

export interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<AppNotification, 'id' | 'date' | 'read' | 'recipientId'>
  ) => Promise<void>;
  sendNotification: (
    recipientId: string,
    notification: Omit<AppNotification, 'id' | 'date' | 'read' | 'recipientId'>
  ) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  selectedNotification: AppNotification | null;
  setSelectedNotification: (notification: AppNotification | null) => void;
}

export const NotificationContext = createContext<NotificationContextType | null>(null);
