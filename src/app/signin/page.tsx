"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LocationInput } from '@/components/LocationInput';
import { jobCategories } from '@/data';

export default function SignIn() {
  const [isLogin, setIsLogin] = useState(true);
  const [signUpStep, setSignUpStep] = useState(1);

  // Account & Personal Info
  const [accountType, setAccountType] = useState<'employer' | 'jobseeker' | ''>('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthday, setBirthday] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Employer info
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [verificationNotes, setVerificationNotes] = useState('');

  // Worker info
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [homeLocation, setHomeLocation] = useState('');
  const [travelDistance, setTravelDistance] = useState<number | ''>('');

  const [loginError, setLoginError] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  const router = useRouter();
  const { isLoggedIn, login, signUp, user, forgetPassword } = useAuth();

  // Redirect after login
  useEffect(() => {
    if (isLoggedIn && user) {
      if (user.is_admin || user.account_type === 'admin') {
        router.push('/admin/dashboard');
        return;
      }

      const path =
        user.account_type === 'employer' ? '/employer/profile' :
        user.account_type === 'jobseeker' ? '/worker/profile' :
        '/';
      router.push(path);
    }
  }, [isLoggedIn, user, router]);

  // Category toggle for workers
  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else if (selectedCategories.length < 3) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const success = await login(email, password);
      if (!success) {
        setLoginError('Invalid email or password');
      }
    } catch (error) {
      console.error(error);
      setLoginError('An error occurred during login');
    }
  };

  // Forgot password handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordMessage('');
    try {
      const success = await forgetPassword(forgotPasswordEmail);
      if (success) {
        setForgotPasswordMessage('Password reset link sent to your email. Check your inbox.');
        setForgotPasswordEmail('');
        setTimeout(() => setShowForgotPassword(false), 3000);
      } else {
        setForgotPasswordMessage('Failed to send reset link. Please try again.');
      }
    } catch (error) {
      setForgotPasswordMessage('An error occurred. Please try again.');
    }
  };

  // Sign-up handler
  const handleSignUp = async () => {
  if (!agreeTerms) {
    alert('You must agree to the Terms of Service and Privacy Policy.');
    return;
  }
  if (!firstName || !lastName || !email || !password || !accountType) {
    alert('Please fill out all required fields.');
    return;
  }

  try {
    // Create user in auth, profile, and employer/worker row
    const success = await signUp(email, password, `${firstName} ${lastName}`, accountType, {
      companyName,
      companyDescription,
      companyLocation,
      uploadedDocuments,
      documentTypes,
      verificationNotes,
      selectedCategories,
      homeLocation,
      travelDistance: travelDistance === '' ? undefined : travelDistance,
    });

    if (!success) {
      alert('Sign-up failed. Please try again.');
      return;
    }

    alert('Account created successfully!');
    setIsLogin(true);
  } catch (error) {
    console.error(error);
    alert('An error occurred during sign-up');
  }
};


  // Render multi-step registration form
  const renderRegistrationStep = () => {
    switch (signUpStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Choose Account Type</h2>
            <div className="space-y-4">
              {['employer', 'jobseeker'].map(type => (
                <div
                  key={type}
                  className={`p-6 border rounded-lg cursor-pointer ${accountType === type ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  onClick={() => setAccountType(type as 'employer' | 'jobseeker')}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-gray-800 capitalize">{type}</h3>
                    <div className={`w-5 h-5 rounded-full border ${accountType === type ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
                      {accountType === type && (
                        <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600">
                    {type === 'employer'
                      ? 'Create job listings and find qualified workers for your needs.'
                      : 'Create a profile showcasing your skills and apply for jobs that match your expertise.'}
                  </p>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <button
                disabled={!accountType}
                className="w-full bg-teal-500 text-white py-3 rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                onClick={() => setSignUpStep(2)}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 2:
        return accountType === 'employer' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Company Information</h2>
            <div>
              <label htmlFor="company-name">Company Name</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} type="text" id="company-name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Enter your company name" />
            </div>
            <div>
              <label htmlFor="company-description">Company Description</label>
              <textarea value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} id="company-description" rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Briefly describe your company"></textarea>
            </div>
            <LocationInput id="company-location" label="Company Location" value={companyLocation} onChange={setCompanyLocation} placeholder="Enter your company location" />
            <div>
              <label htmlFor="documents">Upload Verification Documents</label>
              <input
                type="file"
                id="documents"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setUploadedDocuments(files);
                  setDocumentTypes(files.map(file => file.type));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-sm text-gray-600 mt-1">Upload business license, tax documents, or other verification documents (PDF, DOC, DOCX, JPG, PNG)</p>
            </div>
            <div>
              <label htmlFor="verification-notes">Verification Notes (Optional)</label>
              <textarea
                value={verificationNotes}
                onChange={e => setVerificationNotes(e.target.value)}
                id="verification-notes"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Any additional notes for verification"
              />
            </div>
            <div className="flex justify-between pt-4">
              <button className="px-6 py-2 border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors" onClick={() => setSignUpStep(1)}>Back</button>
              <button className="px-6 py-2 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm" onClick={() => setSignUpStep(3)}>Continue</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Job Categories</h2>
            <p className="text-gray-600 mb-4">Select up to 3 job categories that match your skills.</p>
            <div className="space-y-3">
              {jobCategories.map((category, i) => (
                <div
                  key={i}
                  className={`p-4 border rounded-lg cursor-pointer flex justify-between items-center ${selectedCategories.includes(category.slug) ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'} ${selectedCategories.length === 3 && !selectedCategories.includes(category.slug) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleCategoryToggle(category.title)}
                >
                  <span className="text-gray-800">{category.title}</span>
                  {selectedCategories.includes(category.title) && (
                    <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <LocationInput id="home-location" label="Home Location" value={homeLocation} onChange={setHomeLocation} placeholder="Enter your home address" />
            <div>
              <label htmlFor="travel-distance">Maximum Travel Distance (km)</label>
              <input type="number" min={1} max={100} value={travelDistance} onChange={e => setTravelDistance(Number(e.target.value))} id="travel-distance" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Enter maximum distance" />
            </div>
            <div className="flex justify-between pt-4">
              <button className="px-6 py-2 border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors" onClick={() => setSignUpStep(1)}>Back</button>
              <button className="px-6 py-2 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm" onClick={() => setSignUpStep(3)} disabled={selectedCategories.length === 0}>Continue</button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <input value={firstName} onChange={e => setFirstName(e.target.value)} type="text" placeholder="First Name" className="w-full px-4 py-2 border rounded-md" />
              <input value={lastName} onChange={e => setLastName(e.target.value)} type="text" placeholder="Last Name" className="w-full px-4 py-2 border rounded-md" />
            </div>
            <input value={middleName} onChange={e => setMiddleName(e.target.value)} type="text" placeholder="Middle Name (Optional)" className="w-full px-4 py-2 border rounded-md" />
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email Address" className="w-full px-4 py-2 border rounded-md" />
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full px-4 py-2 border rounded-md" />
            <input value={birthday} onChange={e => setBirthday(e.target.value)} type="date" className="w-full px-4 py-2 border rounded-md" />
            <div className="flex items-center">
              <input id="terms" type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="h-4 w-4 text-teal-500 border-gray-300 rounded" />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the <a href="#" className="text-teal-600">Terms of Service</a> and <a href="#" className="text-teal-600">Privacy Policy</a>
              </label>
            </div>
            <div className="flex justify-between pt-4">
              <button className="px-6 py-2 border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors" onClick={() => setSignUpStep(2)}>Back</button>
              <button className="px-6 py-2 bg-teal-500 text-white rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm" onClick={handleSignUp}>Create Account</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{isLogin ? 'Sign In to House of Angels' : 'Create an Account'}</h1>
            <p className="text-gray-600">{isLogin ? 'Access your account to manage jobs and applications' : 'Join our community of employers and skilled workers'}</p>
          </div>
          <div className="mb-6 inline-flex p-1 bg-gray-100 rounded-full w-full">
            <button onClick={() => { setIsLogin(true); setSignUpStep(1); }} className={`w-1/2 py-2 rounded-full text-sm font-medium ${isLogin ? 'bg-teal-500 text-white' : 'text-gray-700'}`}>Sign In</button>
            <button onClick={() => { setIsLogin(false); setSignUpStep(1); }} className={`w-1/2 py-2 rounded-full text-sm font-medium ${!isLogin ? 'bg-teal-500 text-white' : 'text-gray-700'}`}>Register</button>
          </div>

          {isLogin ? (
            showForgotPassword ? (
              <form className="space-y-6" onSubmit={handleForgotPassword}>
                <input value={forgotPasswordEmail} onChange={e => setForgotPasswordEmail(e.target.value)} type="email" placeholder="Enter your email" className="w-full px-4 py-2 border rounded-md" />
                {forgotPasswordMessage && <div className={`text-sm ${forgotPasswordMessage.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>{forgotPasswordMessage}</div>}
                <button type="submit" className="w-full bg-teal-500 text-white py-3 rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm">Send Reset Link</button>
                <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full border border-gray-300 text-gray-700 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors">Back to Sign In</button>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleLogin}>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email Address" className="w-full px-4 py-2 border rounded-md" />
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full px-4 py-2 border rounded-md" />
                {loginError && <div className="text-red-500 text-sm">{loginError}</div>}
                <button type="submit" className="w-full bg-teal-500 text-white py-3 rounded-full font-medium hover:bg-teal-600 transition-colors shadow-sm">Sign In</button>
                <button type="button" onClick={() => setShowForgotPassword(true)} className="w-full text-teal-600 text-sm font-medium hover:text-teal-700">Forgot Password?</button>
              </form>
            )
          ) : renderRegistrationStep()}

        </div>
      </div>
    </div>
  );
}
