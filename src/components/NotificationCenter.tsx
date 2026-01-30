'use client';

import React, { useState } from 'react';
import { BellIcon, CheckIcon, TrashIcon, XIcon } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types';
import Link from 'next/link';
import { NotificationLightbox } from './NotificationLightbox';
export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    selectedNotification,
    setSelectedNotification
  } = useNotifications();
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark as read when opening if there are unread notifications
      markAllAsRead();
    }
  };
  const handleNotificationClick = (notification: Notification, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setSelectedNotification(notification);
  };
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <div className="bg-blue-100 p-2 rounded-full">
            <BellIcon size={16} className="text-blue-500" />
          </div>;
      case 'hiring':
        return <div className="bg-green-100 p-2 rounded-full">
            <CheckIcon size={16} className="text-green-500" />
          </div>;
      case 'verification':
        return <div className="bg-purple-100 p-2 rounded-full">
            <CheckIcon size={16} className="text-purple-500" />
          </div>;
      case 'message':
        return <div className="bg-yellow-100 p-2 rounded-full">
            <BellIcon size={16} className="text-yellow-500" />
          </div>;
      default:
        return <div className="bg-gray-100 p-2 rounded-full">
            <BellIcon size={16} className="text-gray-500" />
          </div>;
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays > 0) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
    }
  };
  return <div className="relative">
      <button className="relative p-2 text-gray-600 hover:text-teal-500 focus:outline-none" onClick={toggleNotifications}>
        <BellIcon size={24} />
        {unreadCount > 0 && <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>}
      </button>
      {isOpen && <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg overflow-hidden z-50">
            <div className="p-3 bg-teal-500 text-white flex justify-between items-center">
              <h3 className="font-medium">Notifications</h3>
              <div className="flex space-x-2">
                <button onClick={e => {
              e.stopPropagation();
              markAllAsRead();
            }} className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-2 py-1">
                  Mark all as read
                </button>
                <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                  <XIcon size={18} />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? <div className="p-4 text-center text-gray-500">
                  No notifications
                </div> : notifications.map(notification => <div key={notification.id} className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'bg-teal-50' : ''} cursor-pointer`} onClick={e => handleNotificationClick(notification, e)}>
                    <div className="flex">
                      <div className="mr-3">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(notification.date)}
                        </p>
                        {notification.sender_id && <p className="text-xs text-gray-500 mt-1">
                            From: {notification.sender_id}
                          </p>}
                      </div>
                      <button className="ml-2 text-gray-400 hover:text-red-500" onClick={e => {
                e.stopPropagation();
                clearNotification(notification.id);
              }}>
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>)}
            </div>
            <div className="p-2 bg-gray-50 text-center">
              <Link href="/notifications" className="text-sm text-teal-500 hover:text-teal-600 font-medium" onClick={() => setIsOpen(false)}>
                View all notifications
              </Link>
            </div>
          </div>
        </>}
      {selectedNotification && <NotificationLightbox notification={selectedNotification} onClose={() => setSelectedNotification(null)} />}
    </div>;
}