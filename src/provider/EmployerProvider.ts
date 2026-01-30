'use client';

import React, { ReactNode, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { EmployerContext} from '@/context/EmployerContext';
import { EmployerData} from '@/types';

interface EmployerProviderProps {
  children: ReactNode;
  id?: string; // Optional employer id to fetch
}

export const EmployerProvider = ({ children, id }: EmployerProviderProps) => {
  const { user, isLoggedIn } = useAuth();
  const [employerData, setEmployerData] = useState<EmployerData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchEmployer = useCallback(async (employerId?: string) => {
    setLoading(true);
    const idToFetch = employerId || id || user?.id;
    if (!idToFetch) {
      setLoading(false);
      return;
    }

    // Fetch employer
    const { data: employer, error } = await supabase
      .from('employers')
      .select(`*,
        profile: profiles (id, name, account_type)
        `)
      .eq('id', idToFetch)
      .single();
    if (error || !employer) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Fetch posts with comments and author
    const { data: posts } = await supabase
      .from('posts')
      .select(`
        *,
        comments (
          *,
          author:profiles(id, name, profile_image)
        )
      `)
      .eq('employer_id', idToFetch)
      .order('date', { ascending: false });

    // Fetch jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', idToFetch)
      .order('posted_days', { ascending: false });

    // Fetch proposals sent by this employer
    const { data: proposals } = await supabase
      .from('active_proposals')
      .select(`
        *,
        worker: workers (
          id,
          profile_image,
          title,
          profile: profiles (name)
        )
      `)
      .eq('employer_id', idToFetch)
      .order('expires_at', { ascending: false });

    setEmployerData({
      ...employer,
      posts: posts || [],
      jobs: jobs || [],
      proposals: proposals || []
    });
    setLoading(false);
  }, [id, user?.id]);

  useEffect(() => {
    if (user?.account_type === 'employer') {
      fetchEmployer();
    }
  }, [id, fetchEmployer, isLoggedIn, user?.account_type]);

  // Upload utility
  const uploadImageToBucket = async (bucket: string, file: File) => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleProfileImageUpdate = async (file: File) => {
    if (!employerData) return;
    try {
      const url = await uploadImageToBucket('profile_images', file);
      const { error : employerError } = await supabase.from('employers').update({ logo: url }).eq('id', employerData.id);
      const { error : profileError } = await supabase.from('profiles').update({ profile_image: url }).eq('id', employerData.id);
      if (!employerError || !profileError) setEmployerData({ ...employerData, logo: url });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCoverImageUpdate = async (file: File) => {
    if (!employerData) return;
    try {
      const url = await uploadImageToBucket('cover_images', file);
      const { error } = await supabase.from('employers').update({ cover_image: url }).eq('id', employerData.id);
      if (!error) setEmployerData({ ...employerData, cover_image: url });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async (newPost: { content: string; images: File[]; date: string }) => {
    if (!employerData) return;
    try {
      const uploadedImages = await Promise.all(newPost.images.map(f => uploadImageToBucket('post_images', f)));
      const { data: post, error } = await supabase
        .from('posts')
        .insert({ employer_id: employerData.id, content: newPost.content, images: uploadedImages, date: newPost.date })
        .select('*')
        .single();
      if (!error && post) setEmployerData({ ...employerData, posts: [post, ...employerData.posts] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!isLoggedIn || !user) return;
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, author_id: user.id, content, date: new Date().toISOString() })
      .select('*')
      .single();
    if (!error && comment && employerData) {
      setEmployerData({
        ...employerData,
        posts: employerData.posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)
      });
    }
  };

  const checkJobLimit = async (employerId: string) => {
    const { data: employer } = await supabase
      .from("employers")
      .select("tier")
      .eq("id", employerId)
      .single();

    if (!employer) return { allowed: false, message: "Unable to verify employer tier." };

    const limit =
      employer.tier === "Free" ? 2 :
      employer.tier === "Paid" ? 10 :
      Infinity;

    const { data: jobs } = await supabase
      .from("jobs")
      .select("id")
      .eq("employer_id", employerId)
      .eq("status", "active");

    if ((jobs?.length ?? 0) >= limit) {
      return { allowed: false, message: `You have reached your limit of ${limit} active job postings.` };
    }

    return { allowed: true };
  };


  const updateEmployerInfo = async (updates: {
    company_name?: string;
    company_description?: string;
    website?: string;
    employees?: string;
    company_location?: string;
    email?: string;
    phone?: string;
  }) => {
    if (!employerData) throw new Error("No employer data loaded");

    try {
      const { error: employerError } = await supabase
        .from("employers")
        .update({
          company_name: updates.company_name ?? employerData.company_name,
          company_description: updates.company_description ?? employerData.company_description,
          website: updates.website ?? employerData.website,
          employees: updates.employees ?? employerData.employees,
          company_location: updates.company_location ?? employerData.company_location,
          email: updates.email ?? employerData.email,
          phone: updates.phone ?? employerData.phone,
        })
        .eq("id", employerData.id);

      if (employerError) throw employerError;

      // Update local state
      setEmployerData(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error("Failed to update employer info:", err);
      throw err;
    }
  };

  const submitVerificationRequest = async (documents: File[], notes?: string) => {
    if (!employerData || !user) throw new Error("No employer data or user loaded");

    try {
      // Upload documents to verification-documents bucket
      const uploadedDocumentPaths: string[] = [];
      for (let i = 0; i < documents.length; i++) {
        const file = documents[i];
        const fileName = `${employerData.id}/${Date.now()}_${i}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(fileName, file);

        if (uploadError) {
          console.error("Document upload failed:", uploadError);
          throw new Error(`Failed to upload ${file.name}`);
        } else {
          uploadedDocumentPaths.push(fileName);
        }
      }

      // Create verification request
      const { error: verificationError } = await supabase
        .from('employer_verification_requests')
        .insert({
          employer_id: employerData.id,
          requested_tier: 'Basic',
          current_tier: 'Basic',
          status: 'pending',
          id_document_path: uploadedDocumentPaths[0] || null,
          notes: notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (verificationError) {
        console.error("Verification request creation failed:", verificationError);
        throw new Error("Failed to create verification request");
      }

      // Send notification to user
      await supabase.from('notifications').insert({
        recipient_id: employerData.id,
        type: 'verification',
        title: 'Verification Submitted',
        message: 'Your verification documents have been submitted and are under review. You will be notified once the review is complete.',
        read: false,
        date: new Date().toISOString(),
      });

      return { success: true, message: "Verification request submitted successfully" };
    } catch (err) {
      console.error("Verification submission failed:", err);
      throw err;
    }
  };

  const getVerificationStatus = async () => {
    if (!employerData) throw new Error("No employer data loaded");

    try {
      const { data, error } = await supabase
        .from('employer_verification_requests')
        .select('*')
        .eq('employer_id', employerData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      return data || null;
    } catch (err) {
      console.error("Failed to get verification status:", err);
      throw err;
    }
  };

  const uploadVerificationDocuments = async (documents: File[]) => {
    if (!employerData) throw new Error("No employer data loaded");

    try {
      const uploadedDocumentPaths: string[] = [];
      for (let i = 0; i < documents.length; i++) {
        const file = documents[i];
        const fileName = `${employerData.id}/${Date.now()}_${i}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(fileName, file);

        if (uploadError) {
          console.error("Document upload failed:", uploadError);
          throw new Error(`Failed to upload ${file.name}`);
        } else {
          uploadedDocumentPaths.push(fileName);
        }
      }

      return uploadedDocumentPaths;
    } catch (err) {
      console.error("Document upload failed:", err);
      throw err;
    }
  };

  return React.createElement(
    EmployerContext.Provider,
    {
      value: {
        employerData,
        loading,
        fetchEmployer,
        handleProfileImageUpdate,
        handleCoverImageUpdate,
        handleCreatePost,
        handleAddComment,
        updateEmployerInfo,
        submitVerificationRequest,
        getVerificationStatus,
        uploadVerificationDocuments,
        checkJobLimit,
      }
    },
    children
  )}
