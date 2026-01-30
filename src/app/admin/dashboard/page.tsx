"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircleIcon,
  FileTextIcon,
  ShieldIcon,
  UsersIcon,
  XCircleIcon,
  MessageSquareIcon,
  SendIcon,
  SearchIcon,
  UserIcon,
  BriefcaseIcon,
  TrashIcon,
  EyeIcon,
  EyeOffIcon,
  MegaphoneIcon,
  BarChart3Icon,
  ClockIcon,
  SettingsIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications';
import { VerificationRequest, VerificationType } from '@/types'
import { supabase } from '@/lib/supabase';
import {FileViewerModal} from "@/components/admin/FileViewerModal"

export default function AdminDashboard() {
  const router = useRouter()
  const {
    user,
    isLoggedIn
  } = useAuth();
  const {
    sendNotification
  } = useNotifications();

  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/signin');
    } else if (user && !user.is_admin) {
      // If logged in but not admin
      router.push('/');
    }
  }, [isLoggedIn, user, router]);
  const [activeTab, setActiveTab] = useState('overview');
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');

  // Messaging state
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messagePriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [messageType] = useState<'general' | 'warning' | 'announcement' | 'system'>('general');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMessageSuccess, setShowMessageSuccess] = useState(false);

  // Data state
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Announcement state
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'maintenance' | 'feature'>('info');
  const [announcementAudience, setAnnouncementAudience] = useState<'all' | 'employers' | 'workers'>('all');
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [showFileListModal, setShowFileListModal] = useState(false);
  const [selectFiles, setSelectFiles] = useState([''])

  const filteredRequests = verificationRequests?.filter(request => filter === 'all' || request.status === filter);
  const filteredUsers = allUsers.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.account_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Fetch all data
  useEffect(() => {
    if (!user?.is_admin) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch users
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        setAllUsers(usersData || []);

        // Fetch jobs
        const { data: jobsData } = await supabase
          .from('jobs')
          .select(`
            *,
            employer:employers(company_name, logo)
          `)
          .order('posted_date', { ascending: false });
        setAllJobs(jobsData || []);

        // Fetch posts
        const { data: postsData } = await supabase
          .from('posts')
          .select(`
            *,
            employer:employers(company_name, logo)
          `)
          .order('date', { ascending: false });
        setAllPosts(postsData || []);

        // Fetch employer verification requests
        const { data: employerVerificationData } = await supabase
          .from('employer_verification_requests')
          .select(`
            *,
            employer:employers(company_name, email, profile:profiles(name))
          `)
          .order('created_at', { ascending: false });

        // Fetch worker verification requests
        const { data: workerVerificationData } = await supabase
          .from('worker_verification_requests')
          .select(`
            *,
            worker:workers(email, profile:profiles(name))
          `)
          .order('created_at', { ascending: false });

        // Map employer verification requests
        const mappedEmployerRequests = employerVerificationData?.map(request => ({
          id: request.id,
          userId: request.employer_id,
          userName: request.employer?.profile?.name || 'Unknown Employer',
          userEmail: request.employer?.email || 'No email',
          type: 'employer' as VerificationType,
          files: request.id_document_path ? [request.id_document_path] : [],
          dateSubmitted: request.created_at,
          status: request.status as 'pending' | 'approved' | 'rejected',
          notes: request.notes || null,
        })) || [];

        // Map worker verification requests
        const mappedWorkerRequests = workerVerificationData?.map(request => {
          const files = [];
          if (request.id_document_path) files.push(request.id_document_path);
          if (request.face_image_path) files.push(request.face_image_path);
          if (request.nbi_clearance_path) files.push(request.nbi_clearance_path);
          if (request.police_clearance_path) files.push(request.police_clearance_path);
          if (request.barangay_clearance_path) files.push(request.barangay_clearance_path);
          if (request.prc_certificate_path) files.push(request.prc_certificate_path);
          if (request.tesda_certificate_path) files.push(request.tesda_certificate_path);
          if (request.video_reel_path) files.push(request.video_reel_path);
          return {
            id: request.id,
            userId: request.worker_id,
            userName: request.worker?.profile?.name || 'Unknown Worker',
            userEmail: request.worker?.profile?.email || 'No email',
            type: 'worker' as VerificationType,
            files,
            dateSubmitted: request.created_at,
            status: request.status as 'pending' | 'approved' | 'rejected',
            notes: request.notes || null,
            requested_tier: request.requested_tier,
            current_tier: request.current_tier
          };
        }) || [];

        setVerificationRequests([...mappedEmployerRequests, ...mappedWorkerRequests]);

        // Fetch announcements
        const { data: announcementsData } = await supabase
          .from('system_announcements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        setAnnouncements(announcementsData || []);

        // Calculate statistics
        const stats = {
          totalUsers: usersData?.length || 0,
          totalEmployers: usersData?.filter(u => u.account_type === 'employer').length || 0,
          totalWorkers: usersData?.filter(u => u.account_type === 'jobseeker').length || 0,
          totalJobs: jobsData?.length || 0,
          activeJobs: jobsData?.filter(j => j.status === 'active').length || 0,
          totalPosts: postsData?.length || 0,
        };
        setStatistics(stats);

      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleRequestAction = (action: 'approve' | 'reject') => {
    if (!selectedRequest) return;
    setModalAction(action);
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !user) return;
    
    try {
      const table = selectedRequest.type === 'employer' ? 'employer_verification_requests' : 'worker_verification_requests';
      const classType = selectedRequest.type === 'employer' ? 'employers' : 'workers';

      const { error } = await supabase
        .from(table)
        .update({
          status: modalAction === 'approve' ? 'approved' : 'rejected',
          rejection_reason: modalAction === 'reject' ? rejectionReason : null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      const { error: err } = await supabase
      .from(classType)
      .update({
        verification_level: modalAction === 'approve' ? selectedRequest.requested_tier : selectedRequest.current_tier,
        tier: modalAction === 'approve' ? selectedRequest.requested_tier : selectedRequest.current_tier,
      })
      .eq('id', selectedRequest.userId);

      if (err) throw err;

      const updatedRequests = verificationRequests.map(request => {
        if (request.id === selectedRequest.id) {
          return {
            ...request,
            status: (modalAction === 'approve' ? 'approved' : 'rejected') as 'pending' | 'approved' | 'rejected',
            notes: modalAction === 'reject' ? rejectionReason : 'Verification approved'
          };
        }
        return request;
      });
      setVerificationRequests(updatedRequests);

      // Send notification to user
      sendNotification(selectedRequest.userId, {
        type: 'verification',
        title: modalAction === 'approve' ? 'Verification Approved' : 'Verification Rejected',
        message: modalAction === 'approve'
          ? `Your ${selectedRequest.type} verification has been approved.`
          : `Your ${selectedRequest.type} verification has been rejected: ${rejectionReason}`,
        sender_id: user?.id
      });

      setShowModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error updating verification status:', error);
      alert('Failed to update verification status. Please try again.');
    }
  };
  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSendMessage = async () => {
    if (!messageTitle || !messageContent || selectedUsers.length === 0 || !user) return;

    try {
      // Send notification to each selected user
      for (const userId of selectedUsers) {
        // Insert into admin_messages table
        await supabase.from('admin_messages').insert({
          sender_id: user.id,
          recipient_id: userId,
          title: messageTitle,
          content: messageContent,
          message_type: messageType,
          priority: messagePriority
        });

        
      }

      // Log admin action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'send_message',
        target_type: 'user',
        description: `Sent message to ${selectedUsers.length} user(s): ${messageTitle}`,
        metadata: {
          recipients: selectedUsers,
          priority: messagePriority,
          type: messageType
        }
      });

      // Reset form and show success message
      setMessageTitle('');
      setMessageContent('');
      setSelectedUsers([]);
      setShowMessageSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowMessageSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle || !announcementContent || !user) return;

    try {
      const { data, error } = await supabase
        .from('system_announcements')
        .insert({
          title: announcementTitle,
          content: announcementContent,
          announcement_type: announcementType,
          target_audience: announcementAudience,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setAnnouncements([data, ...announcements]);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      alert('Announcement created successfully!');

      sendNotification('all', {
        type: 'system',
        title: announcementTitle,
        message: announcementContent,
        sender_id: user.id
      })

      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'create_announcement',
        target_type: 'system',
        description: `Created announcement: ${announcementTitle}`,
        metadata: { type: announcementType, audience: announcementAudience }
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement.');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      setAllJobs(allJobs.filter(j => j.id !== jobId));

      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_id: user?.id,
        action_type: 'delete_job',
        target_type: 'job',
        target_id: jobId,
        description: 'Deleted job post'
      });

      alert('Job deleted successfully!');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job.');
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;

      setAllJobs(allJobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));

      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_id: user?.id,
        action_type: 'update_job_status',
        target_type: 'job',
        target_id: jobId,
        description: `Changed job status to ${newStatus}`
      });

      alert(`Job ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setAllPosts(allPosts.filter(p => p.id !== postId));

      // Log action
      await supabase.from('admin_actions_log').insert({
        admin_id: user?.id,
        action_type: 'delete_post',
        target_type: 'post',
        target_id: postId,
        description: 'Deleted employer post'
      });

      alert('Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post.');
    }
  };

  const handleOpenFile = async (files:Array<string>) => {
    setShowFileListModal(true);
    setSelectFiles(files);
  };

  const getVerificationTypeName = (type: VerificationType) => {
    switch (type) {
      case 'id':
        return 'ID';
      case 'credentials':
        return 'Professional Credentials';
      case 'address':
        return 'Address';
      case 'employer':
        return 'Employer Verification';
      case 'worker':
        return 'Worker Verification';
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center">
            <CheckCircleIcon size={12} className="mr-1" /> Approved
          </span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs flex items-center">
            <ClockIcon size={12} className="mr-1" /> Pending
          </span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center">
            <XCircleIcon size={12} className="mr-1" /> Rejected
          </span>;
      default:
        return null;
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <div className="container mx-auto px-3 md:px-4 py-8 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 bg-gray-800 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldIcon size={20} className="md:w-6 md:h-6 flex-shrink-0 mt-1" />
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-gray-300 mt-1 text-sm md:text-base">
                    Manage verification requests and platform settings
                  </p>
                </div>
              </div>
              <div className="bg-gray-700 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium flex-shrink-0">
                Admin
              </div>
            </div>
          </div>
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex -mb-px px-3 md:px-6 overflow-x-auto">
              <button onClick={() => setActiveTab('overview')} className={`py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === 'overview' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} mr-4 md:mr-8`}>
                <BarChart3Icon size={14} className="md:w-4 md:h-4 inline mr-1" />
                <span className="hidden sm:inline">Overview</span>
              </button>
              <button onClick={() => setActiveTab('messaging')} className={`py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === 'messaging' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} mr-4 md:mr-8`}>
                <MessageSquareIcon size={14} className="md:w-4 md:h-4 inline mr-1" />
                <span className="hidden sm:inline">Messaging</span>
              </button>
              <button onClick={() => setActiveTab('announcements')} className={`py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === 'announcements' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} mr-4 md:mr-8`}>
                <MegaphoneIcon size={14} className="md:w-4 md:h-4 inline mr-1" />
                <span className="hidden sm:inline">Announcements</span>
              </button>
              <button onClick={() => setActiveTab('jobs')} className={`py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === 'jobs' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} mr-4 md:mr-8`}>
                <BriefcaseIcon size={14} className="md:w-4 md:h-4 inline mr-1" />
                <span className="hidden sm:inline">Jobs</span>
              </button>
              <button onClick={() => setActiveTab('posts')} className={`py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === 'posts' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} mr-4 md:mr-8`}>
                <FileTextIcon size={14} className="md:w-4 md:h-4 inline mr-1" />
                <span className="hidden sm:inline">Posts</span>
              </button>
              <button onClick={() => setActiveTab('verification')} className={`py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === 'verification' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} mr-4 md:mr-8`}>
                <ShieldIcon size={14} className="md:w-4 md:h-4 inline mr-1" />
                <span className="hidden sm:inline">Verification</span>
              </button>
              <button onClick={() => setActiveTab('users')} className={`py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === 'users' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <UsersIcon size={14} className="md:w-4 md:h-4 inline mr-1" />
                <span className="hidden sm:inline">Users</span>
              </button>
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6">Platform Overview</h2>

              {loading ? (
                <div className="text-center py-8 md:py-12">
                  <p className="text-gray-500 text-sm md:text-base">Loading statistics...</p>
                </div>
              ) : (
                <>
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 md:p-6 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-blue-100 text-xs md:text-sm">Total Users</p>
                          <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{statistics?.totalUsers || 0}</p>
                        </div>
                        <UsersIcon size={32} className="md:w-10 md:h-10 opacity-50 flex-shrink-0" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 md:p-6 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-green-100 text-xs md:text-sm">Total Employers</p>
                          <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{statistics?.totalEmployers || 0}</p>
                        </div>
                        <BriefcaseIcon size={32} className="md:w-10 md:h-10 opacity-50 flex-shrink-0" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 md:p-6 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-purple-100 text-xs md:text-sm">Total Workers</p>
                          <p className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">{statistics?.totalWorkers || 0}</p>
                        </div>
                        <UserIcon size={32} className="md:w-10 md:h-10 opacity-50 flex-shrink-0" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg p-4 md:p-6 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-teal-100 text-sm">Total Jobs</p>
                          <p className="text-3xl font-bold mt-2">{statistics?.totalJobs || 0}</p>
                        </div>
                        <BriefcaseIcon size={40} className="opacity-50" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm">Active Jobs</p>
                          <p className="text-3xl font-bold mt-2">{statistics?.activeJobs || 0}</p>
                        </div>
                        <CheckCircleIcon size={40} className="opacity-50" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-pink-100 text-sm">Total Posts</p>
                          <p className="text-3xl font-bold mt-2">{statistics?.totalPosts || 0}</p>
                        </div>
                        <FileTextIcon size={40} className="opacity-50" />
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setActiveTab('messaging')}
                        className="flex items-center justify-center px-4 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                      >
                        <MessageSquareIcon size={20} className="mr-2" />
                        Send Message
                      </button>
                      <button
                        onClick={() => setActiveTab('announcements')}
                        className="flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <MegaphoneIcon size={20} className="mr-2" />
                        Create Announcement
                      </button>
                      <button
                        onClick={() => setActiveTab('jobs')}
                        className="flex items-center justify-center px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        <BriefcaseIcon size={20} className="mr-2" />
                        Manage Jobs
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'verification' && <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Verification Requests
                </h2>
                <div className="flex space-x-2">
                  <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-sm ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    All
                  </button>
                  <button onClick={() => setFilter('pending')} className={`px-3 py-1 rounded-full text-sm ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700'}`}>
                    Pending
                  </button>
                  <button onClick={() => setFilter('approved')} className={`px-3 py-1 rounded-full text-sm ${filter === 'approved' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'}`}>
                    Approved
                  </button>
                  <button onClick={() => setFilter('rejected')} className={`px-3 py-1 rounded-full text-sm ${filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'}`}>
                    Rejected
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map(request => <tr key={request.id} className={`${selectedRequest?.id === request.id ? 'bg-teal-50' : 'hover:bg-gray-50'} cursor-pointer`} onClick={() => setSelectedRequest(request)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="font-medium text-gray-600">
                                {request.userName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {request.userName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.userEmail}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getVerificationTypeName(request.type)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {request.files.length} file(s)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(request.dateSubmitted)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-teal-600 hover:text-teal-900 mr-3" onClick={e => {
                      e.stopPropagation();
                      setSelectedRequest(request);
                    }}>
                            View
                          </button>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
              {filteredRequests.length === 0 && <div className="text-center py-8">
                  <FileTextIcon size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    No verification requests found
                  </p>
                </div>}
              {selectedRequest && <div className="mt-8 bg-gray-50 p-6 rounded-lg">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Request Details
                      </h3>
                      <p className="text-gray-600">
                        {getVerificationTypeName(selectedRequest.type)}{' '}
                        verification for {selectedRequest.userName}
                      </p>
                    </div>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        User Information
                      </h4>
                      <p className="text-gray-800">
                        {selectedRequest.userName}
                      </p>
                      <p className="text-gray-600">
                        {selectedRequest.userEmail}
                      </p>
                      <p className="text-gray-600">
                        User ID: {selectedRequest.userId}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Request Information
                      </h4>
                      <p className="text-gray-800">
                        Request ID: {selectedRequest.id}
                      </p>
                      <p className="text-gray-600">
                        Submitted: {formatDate(selectedRequest.dateSubmitted)}
                      </p>
                      <p className="text-gray-600">
                        {selectedRequest.files.length} file(s) attached
                      </p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      Files
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedRequest.files.map((file, index) => <div key={index} className="border rounded-md p-3 bg-white">
                          <div className="flex items-center">
                            <FileTextIcon size={20} className="text-gray-500 mr-2" />
                            <span className="text-sm text-gray-700 truncate">
                              {file}
                            </span>
                          </div>
                          <button className="mt-2 text-sm text-teal-500 hover:text-teal-600" onClick={()=>{handleOpenFile(selectedRequest.files)}}>
                            View File
                          </button>
                        </div>)}
                    </div>
                  </div>
                  {selectedRequest.notes && <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Notes
                      </h4>
                      <p className="text-gray-700 bg-white p-3 rounded-md border">
                        {selectedRequest.notes}
                      </p>
                    </div>}
                  {selectedRequest.status === 'pending' && <div className="flex justify-end space-x-4">
                      <button onClick={() => handleRequestAction('reject')} className="px-4 py-2 border border-red-500 text-red-500 rounded-md font-medium hover:bg-red-50 transition-colors">
                        Reject
                      </button>
                      <button onClick={() => handleRequestAction('approve')} className="px-4 py-2 bg-green-500 text-white rounded-md font-medium hover:bg-green-600 transition-colors">
                        Approve
                      </button>
                    </div>}
                </div>}
            </div>}
          {activeTab === 'messaging' && <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Messaging Center
                </h2>
              </div>
              {showMessageSuccess && <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        Messages sent successfully! Users will receive your
                        message as a notification.
                      </p>
                    </div>
                  </div>
                </div>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      Compose Message
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="message-title" className="block text-sm font-medium text-gray-700 mb-1">
                          Message Title*
                        </label>
                        <input type="text" id="message-title" value={messageTitle} onChange={e => setMessageTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Enter message title" required />
                      </div>
                      <div>
                        <label htmlFor="message-content" className="block text-sm font-medium text-gray-700 mb-1">
                          Message Content*
                        </label>
                        <textarea id="message-content" value={messageContent} onChange={e => setMessageContent(e.target.value)} rows={6} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Type your message here..." required></textarea>
                      </div>
                      <div className="pt-4">
                        <button onClick={handleSendMessage} disabled={!messageTitle || !messageContent || selectedUsers.length === 0} className={`flex items-center justify-center w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white font-medium ${!messageTitle || !messageContent || selectedUsers.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'}`}>
                          <SendIcon size={16} className="mr-2" />
                          Send Message to {selectedUsers.length}{' '}
                          {selectedUsers.length === 1 ? 'User' : 'Users'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-medium text-gray-800">
                        Select Recipients
                      </h3>
                      <div className="mt-2 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <SearchIcon size={16} className="text-gray-400" />
                        </div>
                        <input type="text" placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
                      </div>
                    </div>
                    <div className="p-1 max-h-96 overflow-y-auto">
                      {filteredUsers.length === 0 ? <div className="text-center py-4 text-gray-500">
                          No users found
                        </div> : filteredUsers.map(user => <div key={user.id} className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer rounded-md ${selectedUsers.includes(user.id) ? 'bg-teal-50 border border-teal-200' : ''}`} onClick={() => toggleUserSelection(user.id)}>
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {user.profileImage ? <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" /> : <UserIcon size={20} className="text-gray-600" />}
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                              <div className="mt-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.accountType === 'employer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                  {user.accountType === 'employer' ? 'Employer' : 'Job Seeker'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-2">
                              <div className={`w-5 h-5 rounded-full border ${selectedUsers.includes(user.id) ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                                {selectedUsers.includes(user.id) && <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>}
                              </div>
                            </div>
                          </div>)}
                    </div>
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {selectedUsers.length}{' '}
                          {selectedUsers.length === 1 ? 'user' : 'users'}{' '}
                          selected
                        </span>
                        {selectedUsers.length > 0 && <button onClick={() => setSelectedUsers([])} className="text-sm text-red-500 hover:text-red-700">
                            Clear all
                          </button>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>}
          {activeTab === 'users' && <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  User Management
                </h2>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      This section is under development. User management
                      features will be available soon.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 text-center py-12">
                <UsersIcon size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  User Management
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  This section will allow you to manage user accounts, roles,
                  and permissions.
                </p>
              </div>
            </div>}
          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Job Posts Management</h2>
                <div className="text-sm text-gray-600">
                  Total: {allJobs.length} | Active: {allJobs.filter(j => j.status === 'active').length}
                </div>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allJobs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            <BriefcaseIcon size={48} className="mx-auto mb-4 text-gray-300" />
                            <p>No jobs found</p>
                          </td>
                        </tr>
                      ) : (
                        allJobs.map((job) => (
                          <tr key={job.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{job.title}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {job.employer?.logo && (
                                  <img
                                    src={job.employer.logo}
                                    alt=""
                                    className="w-8 h-8 rounded-full mr-2"
                                  />
                                )}
                                <span className="text-sm text-gray-900">
                                  {job.employer?.company_name || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{job.location || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {job.employment_type || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  job.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {job.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium space-x-2">
                              <button
                                onClick={() => handleToggleJobStatus(job.id, job.status)}
                                className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                title={job.status === 'active' ? 'Deactivate' : 'Activate'}
                              >
                                {job.status === 'active' ? (
                                  <EyeOffIcon size={18} />
                                ) : (
                                  <EyeIcon size={18} />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="text-red-600 hover:text-red-900 inline-flex items-center"
                                title="Delete"
                              >
                                <TrashIcon size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Employer Posts Management</h2>
                <div className="text-sm text-gray-600">Total: {allPosts.length}</div>
              </div>

              <div className="space-y-4">
                {allPosts.length === 0 ? (
                  <div className="bg-white border rounded-lg p-12 text-center text-gray-500">
                    <FileTextIcon size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No posts found</p>
                  </div>
                ) : (
                  allPosts.map((post) => (
                    <div key={post.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
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
                              <p className="text-sm text-gray-500">
                                {new Date(post.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-4">{post.content}</p>
                          {post.images && post.images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                              {post.images.map((image: string, index: number) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Post image ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-500">
                            <span>{post.likes || 0} likes</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePost(post.id)}
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
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">System Announcements</h2>

              <div className="bg-white border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Announcement</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Announcement title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                    <textarea
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Announcement content"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={announcementType}
                        onChange={(e) => setAnnouncementType(e.target.value as any)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="info">Information</option>
                        <option value="warning">Warning</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="feature">New Feature</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                      <select
                        value={announcementAudience}
                        onChange={(e) => setAnnouncementAudience(e.target.value as any)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="all">All Users</option>
                        <option value="employers">Employers Only</option>
                        <option value="workers">Workers Only</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateAnnouncement}
                    className="w-full bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors font-medium"
                  >
                    <MegaphoneIcon size={20} className="inline mr-2" />
                    Create Announcement
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Announcements</h3>
                {announcements.length === 0 ? (
                  <div className="bg-white border rounded-lg p-12 text-center text-gray-500">
                    <MegaphoneIcon size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No announcements yet</p>
                  </div>
                ) : (
                  announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className={`border-2 rounded-lg p-6 ${
                        announcement.announcement_type === 'warning'
                          ? 'bg-yellow-50 border-yellow-300'
                          : announcement.announcement_type === 'maintenance'
                          ? 'bg-red-50 border-red-300'
                          : announcement.announcement_type === 'feature'
                          ? 'bg-purple-50 border-purple-300'
                          : 'bg-blue-50 border-blue-300'
                      }`}
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
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Platform Settings
                </h2>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      This section is under development. Platform settings will
                      be available soon.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 text-center py-12">
                <SettingsIcon size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Platform Settings
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  This section will allow you to configure platform settings,
                  integrations, and notification preferences.
                </p>
              </div>
            </div>}
        </div>
      </div>
      {/* Approval/Rejection Modal */}
      {showModal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                {modalAction === 'approve' ? <div className="bg-green-100 w-full h-full rounded-full flex items-center justify-center">
                    <CheckCircleIcon size={32} className="text-green-500" />
                  </div> : <div className="bg-red-100 w-full h-full rounded-full flex items-center justify-center">
                    <XCircleIcon size={32} className="text-red-500" />
                  </div>}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                {modalAction === 'approve' ? 'Approve Verification' : 'Reject Verification'}
              </h3>
              <p className="text-gray-600 mb-6 text-center">
                {modalAction === 'approve' ? 'Are you sure you want to approve this verification request?' : 'Please provide a reason for rejecting this verification request.'}
              </p>
              {modalAction === 'reject' && <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="rejection-reason">
                    Rejection Reason
                  </label>
                  <textarea id="rejection-reason" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" rows={3} placeholder="Explain why this verification request is being rejected..." required={modalAction === 'reject'}></textarea>
                </div>}
              <div className="flex justify-center space-x-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmAction} className={`px-4 py-2 text-white rounded-md font-medium transition-colors ${modalAction === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`} disabled={modalAction === 'reject' && !rejectionReason.trim()}>
                  {modalAction === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>}
        <FileViewerModal bucket='verification-documents' files={selectFiles} isOpen={showFileListModal} onClose={() =>setShowFileListModal(false)}/>
    </div>;
}