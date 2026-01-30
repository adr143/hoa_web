'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircleIcon, ShieldIcon,
  CameraIcon, RefreshCwIcon, AlertCircleIcon, InfoIcon, StarIcon,
  CrownIcon, BadgeCheckIcon, Clock, User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/lib/supabase';
import {
  EmployerTier, WorkerTier,
  IDDocumentType, CompanyType,
  EMPLOYER_TIER_FEATURES, WORKER_TIER_FEATURES,
  EmployerVerificationRequest, WorkerVerificationRequest
} from '@/types/verification';

export default function VerificationCenter() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { addNotification } = useNotifications();

  // Account type and tier state
  const [accountType, setAccountType] = useState<'employer' | 'jobseeker' | null>(null);
  const [currentTier, setCurrentTier] = useState<EmployerTier | WorkerTier>('Basic');
  const [selectedTier, setSelectedTier] = useState<EmployerTier | WorkerTier | null>(null);
  const [verificationRequest, setVerificationRequest] = useState<EmployerVerificationRequest | WorkerVerificationRequest | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select_tier' | 'upload_documents' | 'review'>('select_tier');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedFace, setCapturedFace] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Document upload state
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    id_document?: File;
    id_document_type?: IDDocumentType;
    address_proof?: File;
    nbi_clearance?: File;
    police_clearance?: File;
    barangay_clearance?: File;
    prc_certificate?: File;
    tesda_certificate?: File;
    sec_registration?: File;
    dti_registration?: File;
    business_permit?: File;
    representative_id?: File;
    video_reel?: File;
  }>({});

  const [companyType] = useState<CompanyType>('individual');
  const [notes, setNotes] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/signin');
    }
  }, [isLoggedIn, router]);

  // Load user account type and current tier
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      setLoading(true);

      // Get account type from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .single();

      if (profile) {
        setAccountType(profile.account_type as 'employer' | 'jobseeker');

        // Get current tier based on account type
        if (profile.account_type === 'employer') {
          const { data: employer } = await supabase
            .from('employers')
            .select('verification_level, verification_status')
            .eq('id', user.id)
            .single();

          if (employer) {
            setCurrentTier((employer.verification_level || 'Basic') as EmployerTier);
          }

          // Check for pending verification request
          const { data: request } = await supabase
            .from('employer_verification_requests')
            .select('*')
            .eq('employer_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (request) {
            setVerificationRequest(request);
          }
        } else if (profile.account_type === 'jobseeker') {
          const { data: worker } = await supabase
            .from('workers')
            .select('tier, verification_status')
            .eq('id', user.id)
            .single();

          if (worker) {
            setCurrentTier((worker.tier || 'Basic') as WorkerTier);
          }

          // Check for pending verification request
          const { data: request } = await supabase
            .from('worker_verification_requests')
            .select('*')
            .eq('worker_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (request) {
            setVerificationRequest(request);
          }
        }
      }

      setLoading(false);
    };

    fetchUserData();
  }, [user]);

  // Camera control
  useEffect(() => {
    if (showCamera) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [showCamera]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (error) {
      console.error('Camera error:', error);
      addNotification({
        type: 'system',
        title: 'Camera Access Error',
        message: 'Unable to access your camera. Please check permissions.'
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/png');
      setCapturedFace(imageData);
      setShowCamera(false);
    }
  };

  const retakePhoto = () => {
    setCapturedFace(null);
    setShowCamera(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (max 50MB for videos, 10MB for documents)
      const maxSize = docType === 'video_reel' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        addNotification({
          type: 'system',
          title: 'File Too Large',
          message: `File must be under ${docType === 'video_reel' ? '50MB' : '10MB'}`
        });
        return;
      }

      setUploadedDocuments(prev => ({
        ...prev,
        [docType]: file
      }));
    }
  };

  // const handleIDTypeChange = (type: IDDocumentType) => {
  //   setUploadedDocuments(prev => ({
  //     ...prev,
  //     id_document_type: type
  //   }));
  // };

  // const removeDocument = (docType: string) => {
  //   setUploadedDocuments(prev => {
  //     const newDocs = { ...prev };
  //     delete newDocs[docType as keyof typeof newDocs];
  //     return newDocs;
  //   });
  // };

  async function submitVerificationRequest() {
    if (!user || !selectedTier) return;

    try {
      // Upload documents to Supabase Storage
      const documentPaths: Record<string, string> = {};

      for (const [key, file] of Object.entries(uploadedDocuments)) {
        if (file instanceof File) {
          const filePath = `${accountType}/${user.id}/${key}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('verification-documents')
            .upload(filePath, file);

          if (uploadError) throw uploadError;
          documentPaths[key] = filePath;
        }
      }

      // Upload captured face image if exists
      if (capturedFace) {
        const blob = await (await fetch(capturedFace)).blob();
        const filePath = `${accountType}/${user.id}/face_image/${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(filePath, blob);

        if (uploadError) throw uploadError;
        documentPaths.face_image = filePath;
      }

      // Create verification request
      if (accountType === 'employer') {
        const { error } = await supabase
          .from('employer_verification_requests')
          .insert({
            employer_id: user.id,
            requested_tier: selectedTier as EmployerTier,
            current_tier: currentTier as EmployerTier,
            status: 'pending',
            id_document_path: documentPaths.id_document,
            id_document_type: uploadedDocuments.id_document_type,
            address_proof_path: documentPaths.address_proof,
            sec_registration_path: documentPaths.sec_registration,
            dti_registration_path: documentPaths.dti_registration,
            business_permit_path: documentPaths.business_permit,
            representative_id_path: documentPaths.representative_id,
            company_type: companyType,
            notes
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('worker_verification_requests')
          .insert({
            worker_id: user.id,
            requested_tier: selectedTier as WorkerTier,
            current_tier: currentTier as WorkerTier,
            status: 'pending',
            id_document_path: documentPaths.id_document,
            id_document_type: uploadedDocuments.id_document_type,
            face_image_path: documentPaths.face_image,
            nbi_clearance_path: documentPaths.nbi_clearance,
            police_clearance_path: documentPaths.police_clearance,
            barangay_clearance_path: documentPaths.barangay_clearance,
            prc_certificate_path: documentPaths.prc_certificate,
            tesda_certificate_path: documentPaths.tesda_certificate,
            video_reel_path: documentPaths.video_reel
          });

        if (error) throw error;
      }

      addNotification({
        type: 'system',
        title: 'Verification Submitted',
        message: 'Your verification request has been submitted successfully!'
      });

      router.push('/');
    } catch (error) {
      console.error('Submission error:', error);
      addNotification({
        type: 'system',
        title: 'Submission Failed',
        message: 'Failed to submit verification request. Please try again.'
      });
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification center...</p>
        </div>
      </div>
    );
  }

  if (!accountType) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Type Not Found</h2>
          <p className="text-gray-600">Unable to determine your account type. Please contact support.</p>
        </div>
      </div>
    );
  }

  // Show pending request status
  if (verificationRequest && verificationRequest.status === 'pending') {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Under Review</h2>
            <p className="text-gray-600 mb-6">
              Your verification request for <span className="font-semibold">{verificationRequest.requested_tier}</span> tier
              is currently being reviewed by our team. This usually takes 1-3 business days.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-600">
                <strong>Requested Tier:</strong> {verificationRequest.requested_tier}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Submitted:</strong> {new Date(verificationRequest.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="mt-6 bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Verification Center</h1>
          <p className="text-xl text-gray-600">
            Upgrade your account tier to unlock more features and build trust
          </p>
          <div className="mt-4 inline-flex items-center bg-gray-100 px-4 py-2 rounded-full">
            <ShieldIcon className="h-5 w-5 text-teal-500 mr-2" />
            <span className="text-gray-700">Current Tier: <strong>{currentTier}</strong></span>
          </div>
        </div>

        {/* Tier Selection */}
        {currentStep === 'select_tier' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
              Select Your Tier
            </h2>
            <div className="flex justify-center mb-6">
              <div className="inline-flex p-1 bg-gray-100 rounded-full">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-6 py-2 rounded-full text-sm font-medium ${billingPeriod === 'monthly' ? 'bg-teal-500 text-white' : 'text-gray-700'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('annually')}
                  className={`px-6 py-2 rounded-full text-sm font-medium ${billingPeriod === 'annually' ? 'bg-teal-500 text-white' : 'text-gray-700'}`}
                >
                  Annual (Save 17%)
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {accountType === 'employer' ? (
                <>
                  {(['Basic', 'Verified', 'Enterprise'] as EmployerTier[]).map((tier) => {
                    const features = EMPLOYER_TIER_FEATURES[tier];
                    const isCurrentTier = tier === currentTier;
                    const Icon = tier === 'Basic' ? User : tier === 'Verified' ? BadgeCheckIcon : CrownIcon;

                    return (
                      <div
                        key={tier}
                        className={`bg-white rounded-lg shadow-sm p-6 border-2 ${
                          isCurrentTier ? 'border-teal-500' : 'border-gray-200'
                        } ${isCurrentTier ? 'opacity-50' : 'hover:border-teal-300 cursor-pointer'}`}
                        onClick={() => !isCurrentTier && (setSelectedTier(tier), setCurrentStep('upload_documents'))}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <Icon className="h-8 w-8 text-teal-500" />
                          {isCurrentTier && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">Current</span>}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{features.name}</h3>
                        <div className="mb-4">
                          <p className="text-2xl font-bold text-teal-600">
                            {billingPeriod === 'monthly' ? features.price.monthly : features.price.annually}
                          </p>
                          {features.price.monthly !== 'Free' && (
                            <p className="text-xs text-gray-500">/{billingPeriod === 'monthly' ? 'month' : 'year'}</p>
                          )}
                        </div>
                        <ul className="space-y-2 mb-4">
                          {features.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-600">
                              <CheckCircleIcon className="h-4 w-4 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        {!isCurrentTier && (
                          <button className="w-full bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600 transition-colors">
                            Select {tier}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  {(['Basic', 'Verified', 'Premium'] as WorkerTier[]).map((tier) => {
                    const features = WORKER_TIER_FEATURES[tier];
                    const isCurrentTier = tier === currentTier;
                    const Icon = tier === 'Basic' ? User : tier === 'Verified' ? BadgeCheckIcon : StarIcon;

                    return (
                      <div
                        key={tier}
                        className={`bg-white rounded-lg shadow-sm p-6 border-2 ${
                          isCurrentTier ? 'border-teal-500' : 'border-gray-200'
                        } ${isCurrentTier ? 'opacity-50' : 'hover:border-teal-300 cursor-pointer'}`}
                        onClick={() => !isCurrentTier && (setSelectedTier(tier), setCurrentStep('upload_documents'))}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <Icon className="h-8 w-8 text-teal-500" />
                          {isCurrentTier && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">Current</span>}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{features.name}</h3>
                        <div className="mb-4">
                          <p className="text-2xl font-bold text-teal-600">
                            {billingPeriod === 'monthly' ? features.price.monthly : features.price.annually}
                          </p>
                          {features.price.monthly !== 'Free' && (
                            <p className="text-xs text-gray-500">/{billingPeriod === 'monthly' ? 'month' : 'year'}</p>
                          )}
                        </div>
                        <ul className="space-y-2 mb-4">
                          {features.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-600">
                              <CheckCircleIcon className="h-4 w-4 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        {!isCurrentTier && (
                          <button className="w-full bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600 transition-colors">
                            Select {tier}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {/* Document Upload - Simplified version */}
        {currentStep === 'upload_documents' && selectedTier && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Upload Required Documents for {selectedTier} Tier
            </h2>

            {/* ID Document */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Government-Issued ID <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, 'id_document')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
              {uploadedDocuments.id_document && (
                <p className="mt-2 text-sm text-green-600">✓ {uploadedDocuments.id_document.name}</p>
              )}
            </div>

            {/* Additional documents based on tier */}
            {accountType === 'employer' && selectedTier === 'Enterprise' && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEC/DTI Registration
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'sec_registration')}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Permit
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'business_permit')}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                </div>
              </>
            )}

            {accountType === 'jobseeker' && (selectedTier === 'Verified' || selectedTier === 'Premium') && (
              <>
                {/* Face Capture */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Face Verification <span className="text-red-500">*</span>
                  </label>
                  {!capturedFace && !showCamera && (
                    <button
                      onClick={() => setShowCamera(true)}
                      className="flex items-center bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600"
                    >
                      <CameraIcon className="h-5 w-5 mr-2" />
                      Capture Face Photo
                    </button>
                  )}
                  {showCamera && (
                    <div className="space-y-4">
                      <video ref={videoRef} autoPlay className="w-full max-w-md rounded-lg" />
                      <canvas ref={canvasRef} className="hidden" />
                      <button
                        onClick={captureImage}
                        className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600"
                      >
                        Capture Photo
                      </button>
                    </div>
                  )}
                  {capturedFace && (
                    <div className="space-y-2">
                      <img src={capturedFace} alt="Captured face" className="w-full max-w-md rounded-lg" />
                      <button
                        onClick={retakePhoto}
                        className="flex items-center text-teal-600 hover:text-teal-700"
                      >
                        <RefreshCwIcon className="h-4 w-4 mr-1" />
                        Retake Photo
                      </button>
                    </div>
                  )}
                </div>

                {/* Clearances */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NBI Clearance
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'nbi_clearance')}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                </div>
              </>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Any additional information you'd like to provide..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('select_tier')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep('review')}
                disabled={!uploadedDocuments.id_document}
                className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review & Submit
              </button>
            </div>
          </div>
        )}

        {/* Review & Submit */}
        {currentStep === 'review' && selectedTier && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Review Your Submission
            </h2>

            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600"><strong>Selected Tier:</strong> {selectedTier}</p>
                <p className="text-sm text-gray-600 mt-2"><strong>Account Type:</strong> {accountType}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents:</p>
                <ul className="space-y-1">
                  {Object.entries(uploadedDocuments).map(([key, value]) => {
                    if (value instanceof File) {
                      return (
                        <li key={key} className="text-sm text-gray-600 flex items-center">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                          {key.replace(/_/g, ' ').toUpperCase()}: {value.name}
                        </li>
                      );
                    }
                    return null;
                  })}
                  {capturedFace && (
                    <li className="text-sm text-gray-600 flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      Face Photo: Captured
                    </li>
                  )}
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InfoIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Review Process</p>
                    <p>Your verification request will be reviewed by our team within 1-3 business days. You'll receive a notification once the review is complete.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('upload_documents')}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={async () => {
                  setSubmitting(true);
                  await submitVerificationRequest();
                  setSubmitting(false);
                }}
                disabled={submitting}
                className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Verification Request'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
