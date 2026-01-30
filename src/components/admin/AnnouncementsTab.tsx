'use client';

import React, { useState } from 'react';
import { MegaphoneIcon, XIcon } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  announcement_type: string;
  target_audience: string;
  is_active: boolean;
  created_at: string;
}

interface AnnouncementsTabProps {
  announcements: Announcement[];
  onCreateAnnouncement: (data: {
    title: string;
    content: string;
    type: string;
    audience: string;
  }) => void;
  onToggleAnnouncement: (id: string, isActive: boolean) => void;
}

export function AnnouncementsTab({
  announcements,
  onCreateAnnouncement,
  onToggleAnnouncement,
}: AnnouncementsTabProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'maintenance' | 'feature'>('info');
  const [audience, setAudience] = useState<'all' | 'employers' | 'workers'>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    onCreateAnnouncement({ title, content, type, audience });
    setTitle('');
    setContent('');
    setType('info');
    setAudience('all');
  };

  const getTypeColor = (announcementType: string) => {
    switch (announcementType) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'maintenance':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'feature':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">System Announcements</h2>

      {/* Create Announcement Form */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Announcement</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Announcement title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Announcement content"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="info">Information</option>
                <option value="warning">Warning</option>
                <option value="maintenance">Maintenance</option>
                <option value="feature">New Feature</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="employers">Employers Only</option>
                <option value="workers">Workers Only</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors font-medium"
          >
            <MegaphoneIcon size={20} className="inline mr-2" />
            Create Announcement
          </button>
        </form>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Active Announcements</h3>
        {announcements.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center text-gray-500">
            <MegaphoneIcon size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No announcements yet</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`border-2 rounded-lg p-6 ${getTypeColor(announcement.announcement_type)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-xs font-semibold uppercase px-2 py-1 rounded bg-white bg-opacity-50 mr-2">
                      {announcement.announcement_type}
                    </span>
                    <span className="text-xs font-semibold uppercase px-2 py-1 rounded bg-white bg-opacity-50">
                      {announcement.target_audience}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold mb-2">{announcement.title}</h4>
                  <p className="text-sm mb-2">{announcement.content}</p>
                  <p className="text-xs opacity-75">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => onToggleAnnouncement(announcement.id, announcement.is_active)}
                  className="ml-4 p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                  title={announcement.is_active ? 'Deactivate' : 'Activate'}
                >
                  <XIcon size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

