// app/providers/AuthProvider.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import { supabase } from "@/lib/supabase";
import { AuthContext, AccountType } from "@/context/AuthContext";
import { User } from "@/types/user";
import { generatePlaceholderProfile, generatePlaceholderCover } from "@/lib/placeholder";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const authUser = data.user;

    if (!authUser) {
      setUser(null);
      setIsLoggedIn(false);
      Cookies.remove("token");
      Cookies.remove("accountType");
      setLoading(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (error || !profile) {
      setUser(null);
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    const fullUser: User = { ...profile, email: authUser.email };
    setUser(fullUser);
    setIsLoggedIn(true);

    Cookies.set("token", authUser.id, { path: "/" });
    Cookies.set("accountType", fullUser.account_type, { path: "/" });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser();
      } else {
        setUser(null);
        setIsLoggedIn(false);
        Cookies.remove("token");
        Cookies.remove("accountType");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
  const trimmedEmail = email.trim();
  const trimmedPassword = password;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password: trimmedPassword,
  });

  if (error) {
    console.error("Supabase login error:", error);
    return false;
  }

  if (!data.user) {
    console.error("No user returned from Supabase.");
    return false;
  }

  await fetchUser();
  return true;
};


  const signUp = async (
  email: string,
  password: string,
  name: string,
  accountType: AccountType,
  extraData?: {
    companyName?: string;
    companyDescription?: string;
    companyLocation?: string;
    selectedCategories?: string[];
    homeLocation?: string;
    travelDistance?: number;
    uploadedDocuments?: File[];
    documentTypes?: string[];
    verificationNotes?: string;
  }
) => {
  try {
    // 1️⃣ Create auth user
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      console.error("Auth sign-up failed:", error);
      return false;
    }

    const userId = data.user.id;

    // 2️⃣ Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        name,
        account_type: accountType,
        is_admin: accountType === "admin",
      });
    if (profileError) {
      console.error("Profile creation failed:", profileError);
      return false;
    }

    // 3️⃣ Generate placeholder images
    const profilePlaceholder = generatePlaceholderProfile(name);
    const coverPlaceholder = generatePlaceholderCover();

    // 4️⃣ Create worker or employer row
    if (accountType === "employer") {
      const { error: employerError } = await supabase.from("employers").insert({
        id: userId,
        company_name: extraData?.companyName || "",
        company_description: extraData?.companyDescription || "",
        company_location: extraData?.companyLocation || "",
        location: extraData?.companyLocation || "",
        description: extraData?.companyDescription || "",
        email,
        verified: false,
        tier: "Free",
        specialties: [],
        logo: profilePlaceholder,
        cover_image: coverPlaceholder,
        website: "",
        phone: "",
        employees: "1-10",
        member_since: new Date().toISOString().split("T")[0],
      });
      if (employerError) {
        console.error("Employer insert failed:", employerError);
        return false;
      }

      // 4.1️⃣ Handle verification documents if provided
      if (extraData?.uploadedDocuments && extraData.uploadedDocuments.length > 0) {
        try {
          // Upload documents to verification-documents bucket
          const uploadedDocumentPaths: string[] = [];
          for (let i = 0; i < extraData.uploadedDocuments.length; i++) {
            const file = extraData.uploadedDocuments[i];
            const fileName = `${userId}/${Date.now()}_${i}_${file.name}`;
            const { error: uploadError } = await supabase.storage
              .from('verification-documents')
              .upload(fileName, file);

            if (uploadError) {
              console.error("Document upload failed:", uploadError);
              // Continue with other documents, don't fail the entire signup
            } else {
              uploadedDocumentPaths.push(fileName);
            }
          }

          // Create verification request
          const { error: verificationError } = await supabase
            .from('employer_verification_requests')
            .insert({
              employer_id: userId,
              requested_tier: 'Basic',
              current_tier: 'Basic',
              status: 'pending',
              id_document_path: uploadedDocumentPaths[0] || null,
              notes: extraData.verificationNotes || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (verificationError) {
            console.error("Verification request creation failed:", verificationError);
            // Don't fail signup for verification errors
          }

          // Send notification to user
          await supabase.from('notifications').insert({
            recipient_id: userId,
            type: 'verification',
            title: 'Verification Submitted',
            message: 'Your verification documents have been submitted and are under review. You will be notified once the review is complete.',
            read: false,
            date: new Date().toISOString(),
          });

        } catch (verificationErr) {
          console.error("Verification handling failed:", verificationErr);
          // Don't fail signup for verification errors
        }
      }

    } else if (accountType === "jobseeker") {
      const { error: workerError } = await supabase
        .from("workers")
        .insert({
          id: userId,
          title: "",
          location: extraData?.homeLocation || "",
          home_location: extraData?.homeLocation || "",
          rating: 0,
          profile_image: profilePlaceholder,
          cover_image: coverPlaceholder,
          description: "",
          category: extraData?.selectedCategories || [],
          subcategory: "",
          skills: [],
          hourly_rate: "",
          availability: "Available",
          languages: ["English"],
          travel_distance: extraData?.travelDistance || 0,
          badges: [],
          member_since: new Date().toISOString().split("T")[0],
          about: "",
          response_rate: "100%",
          email
        })
        .select();

      await supabase.from('verifications').insert({
        worker_id: userId,
        identity: false,
        background: false,
        skills: false,
      });

      if (workerError) {
        console.error("Worker insert failed:", workerError);
        return false;
      }
    }

    // 5️⃣ Fetch and update local auth state
    await fetchUser();

    return true;
  } catch (err) {
    console.error("Sign-up exception:", err);
    return false;
  }
};


  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsLoggedIn(false);
    Cookies.remove("token");
    Cookies.remove("accountType");
  };

  const changeName = async (newName: string) => {
  if (!user) return false;
  const userId = user.id;

  try {
    // 1️⃣ Update auth user metadata (Supabase supports 'user_metadata')
    const { data: _authData, error: authError } = await supabase.auth.updateUser({
      data: { full_name: newName }
    });
    if (authError) throw authError;

    // 2️⃣ Update profile table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ name: newName })
      .eq('id', userId);
    if (profileError) throw profileError;

    // 4️⃣ Refresh local state
    await fetchUser();
    return true;
  } catch (err) {
    console.error('Change name failed:', err);
    return false;
  }
};

// Change user's password
const changePassword = async (newPassword: string) => {
  try {
    const { data:_data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Password change failed:', err);
    return false;
  }
};

// Forget password
const forgetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://house-of-angels.vercel.app/reset-password`
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Password reset failed:', err);
    return false;
  }
};

// Delete account
const deleteAccount = async () => {
  if (!user) return false;
  try {
    const userId = user.id;
    // Delete from specific tables based on account type
    if (user.account_type === 'employer') {
      await supabase.from('employers').delete().eq('id', userId);
    } else if (user.account_type === 'jobseeker') {
      await supabase.from('workers').delete().eq('id', userId);
      await supabase.from('verifications').delete().eq('worker_id', userId);
    }
    // Delete profile
    await supabase.from('profiles').delete().eq('id', userId);
    // Note: Cannot delete auth user from client-side. Sign out instead.
    await logout();
    return true;
  } catch (err) {
    console.error('Account deletion failed:', err);
    return false;
  }
};

  return React.createElement(
    AuthContext.Provider,
    { value: { isLoggedIn, user, loading, login, signUp, logout, refreshUser: fetchUser, changeName, changePassword, forgetPassword, deleteAccount } },
    children
  );
};
