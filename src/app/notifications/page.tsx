"use client";

import React, { useState } from 'react';
import { BellIcon, CheckIcon, TrashIcon } from 'lucide-react';
import { useNotifications} from '@/hooks/useNotifications';
import { NotificationType } from '@/types';
import { NotificationLightbox } from '@/components/NotificationLightbox';
export default function Notifications() {
  const {
    notifications,
    markAsRead,
    clearNotification,
    clearAllNotifications,
    selectedNotification,
    setSelectedNotification
  } = useNotifications();
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const filteredNotifications = filter === 'all' ? notifications : notifications.filter(notification => notification.type === filter);
  const handleNotificationClick = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      if (!notification.read) {
        markAsRead(notification.id);
      }
      setSelectedNotification(notification);
    }
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            <p className="text-gray-600 mt-1">
              View and manage your notification history
            </p>
          </div>
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-sm ${filter === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  All
                </button>
                <button onClick={() => setFilter('new_application')} className={`px-3 py-1 rounded-full text-sm ${filter === 'new_application' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'}`}>
                  Applications
                </button>
                <button onClick={() => setFilter('proposal_update')} className={`px-3 py-1 rounded-full text-sm ${filter === 'proposal_update' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'}`}>
                  Hiring
                </button>
                <button onClick={() => setFilter('system')} className={`px-3 py-1 rounded-full text-sm ${filter === 'system' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700'}`}>
                  Verification
                </button>
                <button onClick={() => setFilter('message')} className={`px-3 py-1 rounded-full text-sm ${filter === 'message' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700'}`}>
                  Messages
                </button>
                <button onClick={() => setFilter('system')} className={`px-3 py-1 rounded-full text-sm ${filter === 'system' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  System
                </button>
              </div>
              {notifications.length > 0 && <button onClick={clearAllNotifications} className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center">
                  <TrashIcon size={16} className="mr-1" />
                  Clear All
                </button>}
            </div>
          </div>
          <div>
            {filteredNotifications.length === 0 ? <div className="p-8 text-center text-gray-500">
                <BellIcon size={48} className="mx-auto text-gray-300 mb-4" />
                <p>No notifications found</p>
                {filter !== 'all' && <button onClick={() => setFilter('all')} className="mt-2 text-teal-500 hover:text-teal-600">
                    View all notifications
                  </button>}
              </div> : <div className="divide-y divide-gray-100">
                {filteredNotifications.map(notification => <div key={notification.id} className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-teal-50' : ''} cursor-pointer`} onClick={() => handleNotificationClick(notification.id)}>
                    <div className="flex">
                      <div className="mr-4">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-800">
                              {notification.title}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center mt-2 text-xs text-gray-400">
                              <span>{formatDate(notification.date)}</span>
                              {notification.sender_id && <span className="ml-2 text-gray-500">
                                  From: {notification.sender_id}
                                </span>}
                            </div>
                          </div>
                          <button onClick={e => {
                      e.stopPropagation();
                      clearNotification(notification.id);
                    }} className="text-gray-400 hover:text-red-500 ml-4">
                            <TrashIcon size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>}
          </div>
        </div>
      </div>
      {selectedNotification && <NotificationLightbox notification={selectedNotification} onClose={() => setSelectedNotification(null)} />}
    </div>;
}