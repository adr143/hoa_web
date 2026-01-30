import React from 'react';
import { XIcon, CheckCircleIcon, BellIcon, MessageSquareIcon } from 'lucide-react';
import { Notification } from '@/types';
interface NotificationLightboxProps {
  notification: Notification;
  onClose: () => void;
}
export function NotificationLightbox({
  notification,
  onClose
}: NotificationLightboxProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'new_application':
        return <BellIcon size={24} className="text-blue-500" />;
      case 'proposal_update':
        return <CheckCircleIcon size={24} className="text-green-500" />;
      case 'verification':
        return <CheckCircleIcon size={24} className="text-purple-500" />;
      case 'message':
        return <MessageSquareIcon size={24} className="text-yellow-500" />;
      default:
        return <BellIcon size={24} className="text-gray-500" />;
    }
  };
  const getNotificationTypeLabel = () => {
    switch (notification.type) {
      case 'new_application':
        return 'Application';
      case 'proposal_update':
        return 'Hiring';
      case 'verification':
        return 'Verification';
      case 'message':
        return 'Message';
      case 'system':
        return 'System';
      default:
        return 'Notification';
    }
  };
  return <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <div className="mr-3">{getNotificationIcon()}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {notification.title}
              </h3>
              <p className="text-sm text-gray-500">
                {getNotificationTypeLabel()} • {formatDate(notification.date)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <XIcon size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="prose max-w-none">
            <p className="text-gray-800 whitespace-pre-line">
              {notification.message}
            </p>
            {notification.additional_content && <div className="mt-4 pt-4 border-t border-gray-100">
                <div dangerouslySetInnerHTML={{
              __html: notification.additional_content
            }} />
              </div>}
            {notification.sender_id && <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Sent by{' '}
                  <span className="font-medium">{notification.sender_id}</span>
                </p>
              </div>}
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>;
}