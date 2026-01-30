'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LocationInput } from '@/components/LocationInput';
import { useJobs } from '@/hooks/useJobs';
import { Job } from '@/types';
import { jobCategories } from '@/data';

export default function CreateJobPost() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { postJob } = useJobs();

  // Redirect if not logged in or not an employer
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/signin');
    } else if (user && user.account_type !== 'employer') {
      router.push('/');
    }
  }, [isLoggedIn, user, router]);

  const [formData, setFormData] = useState<Omit<Job, 'id' | 'employer_id' | 'status' | 'posted_days'>>({
    title: '',
    category: '',
    subcategory: '',
    location: '',
    description: '',
    responsibilities: [''],
    requirements: [''],
    employment_type: '',
    min_salary: '',
    max_salary: '',
    salary_type: 'hourly',
    expiration_days: 30,
    tags: [''],
  });

  const [showPreview, setShowPreview] = useState(false);

  const getSubcategories = (category: string) => {
    const selectedCategory = jobCategories.find(cat => cat.slug === category);
    return selectedCategory ? selectedCategory.subcategories : [];
  };

  const subcategories = getSubcategories(formData.category);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    try {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      if (name === 'category') {
        setFormData(prev => ({ ...prev, subcategory: '' }));
      }
    } catch (error) {
      console.error('Failed to update form data:', error);
    }
  };

  const handleListItemChange = (index: number, field: 'responsibilities' | 'requirements' | 'tags', value: string) => {
    try {
      setFormData(prev => {
        const newList = [...prev[field]];
        newList[index] = value;
        return { ...prev, [field]: newList };
      });
    } catch (error) {
      console.error('Failed to update list item:', error);
    }
  };

  const addListItem = (field: 'responsibilities' | 'requirements' | 'tags') => {
    try {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    } catch (error) {
      console.error('Failed to add list item:', error);
    }
  };

  const removeListItem = (index: number, field: 'responsibilities' | 'requirements' | 'tags') => {
    if (formData[field].length <= 1) return;
    setFormData(prev => {
      const newList = [...prev[field]];
      newList.splice(index, 1);
      return { ...prev, [field]: newList };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const jobData: Job = {
      ...formData,
      employer_id: user.id,
      status: 'active',
      posted_days: 0,
    };

    try {
      await postJob( jobData );
      alert('Job posted successfully!');
      router.push('/employer/profile');
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Failed to post job. Please try again.');
    }
  };

  const togglePreview = () => setShowPreview(!showPreview);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 bg-teal-50 border-b border-teal-100">
            <h1 className="text-2xl font-bold text-gray-800">
              Create a Job Post
            </h1>
            <p className="text-gray-600 mt-1">
              Fill in the details to create your job posting
            </p>
          </div>
          {showPreview ? <div className="p-6">
              <div className="mb-6">
                <button onClick={togglePreview} className="text-teal-500 hover:text-teal-600 font-medium">
                  ← Back to Edit
                </button>
                <h2 className="text-xl font-semibold text-gray-800 mt-4">
                  Preview
                </h2>
              </div>
              <div className="border rounded-lg p-6">
                <h1 className="text-2xl font-bold text-gray-800">
                  {formData.title || 'Job Title'}
                </h1>
                <div className="flex flex-wrap gap-4 my-4">
                  {formData.category && <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">
                      {formData.category}
                    </span>}
                  {formData.subcategory && <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">
                      {formData.subcategory}
                    </span>}
                  {formData.employment_type && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                      {formData.employment_type}
                    </span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500">
                      Salary
                    </h3>
                    <p className="text-gray-800 font-medium">
                      {formData.min_salary && `₱${formData.min_salary}`}
                      {formData.min_salary && formData.max_salary && ' - '}
                      {formData.max_salary && `₱${formData.max_salary}`}
                      {(formData.min_salary || formData.max_salary) && ` per ${formData.salary_type}`}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500">
                      Location
                    </h3>
                    <p className="text-gray-800 font-medium">
                      {formData.location || 'Location'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500">
                      Expires In
                    </h3>
                    <p className="text-gray-800 font-medium">
                      {formData.expiration_days} days
                    </p>
                  </div>
                </div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">
                    Job Description
                  </h2>
                  <p className="text-gray-600 whitespace-pre-line">
                    {formData.description || 'No description provided.'}
                  </p>
                </div>
                {formData.responsibilities.filter(Boolean).length > 0 && <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">
                      Responsibilities
                    </h2>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                      {formData.responsibilities.filter(Boolean).map((resp, index) => <li key={index}>{resp}</li>)}
                    </ul>
                  </div>}
                {formData.requirements.filter(Boolean).length > 0 && <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">
                      Requirements
                    </h2>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                      {formData.requirements.filter(Boolean).map((req, index) => <li key={index}>{req}</li>)}
                    </ul>
                  </div>}
                {formData.tags.filter(Boolean).length > 0 && <div className="flex flex-wrap gap-2 mt-6">
                    {formData.tags.filter(Boolean).map((tag, index) => <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>)}
                  </div>}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={async (e) => {
                  e.preventDefault();
                  try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await handleSubmit(e as any);
                  } catch (error) {
                    console.error('Failed to publish job:', error);
                  }
                }} className="bg-teal-500 text-white px-6 py-2 rounded-md font-medium hover:bg-teal-600 transition-colors shadow-sm">
                  Publish Job Post
                </button>
              </div>
            </div> : <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="title">
                  Job Title*
                </label>
                <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="e.g. Experienced Gardener Needed" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="category">
                    Category*
                  </label>
                  <select id="category" name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" required>
                    <option value="">Select a category</option>
                    {jobCategories.map((category, index) => <option key={index} value={category.slug}>
                        {category.title}
                      </option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="subcategory">
                    Subcategory*
                  </label>
                  <select id="subcategory" name="subcategory" value={formData.subcategory} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" disabled={!formData.category} required>
                    <option value="">Select a subcategory</option>
                    {subcategories.map((subcategory, index) => <option key={index} value={typeof subcategory === 'string' ? subcategory : subcategory.name}>
                        {typeof subcategory === 'string' ? subcategory : subcategory.name}
                      </option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="location">
                  Location*
                </label>
                <LocationInput id="location" label="" defaultValue={formData.location} onChange={value => {
                  try {
                    setFormData(prev => ({
                      ...prev,
                      location: value
                    }));
                  } catch (error) {
                    console.error('Failed to update location:', error);
                  }
                }} placeholder="Enter job location" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="description">
                  Job Description*
                </label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Provide a detailed description of the job..." required></textarea>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Responsibilities
                </label>
                {formData.responsibilities.map((responsibility, index) => <div key={index} className="flex mb-2">
                    <input type="text" value={responsibility} onChange={e => handleListItemChange(index, 'responsibilities', e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder={`Responsibility ${index + 1}`} />
                    <button type="button" onClick={() => removeListItem(index, 'responsibilities')} className="ml-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">
                      -
                    </button>
                  </div>)}
                <button type="button" onClick={() => addListItem('responsibilities')} className="text-teal-500 hover:text-teal-600 font-medium text-sm">
                  + Add Responsibility
                </button>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Requirements
                </label>
                {formData.requirements.map((requirement, index) => <div key={index} className="flex mb-2">
                    <input type="text" value={requirement} onChange={e => handleListItemChange(index, 'requirements', e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder={`Requirement ${index + 1}`} />
                    <button type="button" onClick={() => removeListItem(index, 'requirements')} className="ml-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">
                      -
                    </button>
                  </div>)}
                <button type="button" onClick={() => addListItem('requirements')} className="text-teal-500 hover:text-teal-600 font-medium text-sm">
                  + Add Requirement
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="employmentType">
                    Employment Type*
                  </label>
                  <select id="employmentType" name="employment_type" value={formData.employment_type} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" required>
                    <option value="">Select employment type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Project-based">Project-based</option>
                    <option value="Seasonal">Seasonal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="expirationDays">
                    Job Post Duration*
                  </label>
                  <div className="relative">
                    <select id="expirationDays" name="expiration_days" value={formData.expiration_days} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" required>
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <CalendarIcon size={18} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="minSalary">
                    Minimum Salary
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      ₱
                    </span>
                    <input type="number" id="minSalary" name="min_salary" value={formData.min_salary} onChange={handleChange} className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Min" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="maxSalary">
                    Maximum Salary
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      ₱
                    </span>
                    <input type="number" id="maxSalary" name="max_salary" value={formData.max_salary} onChange={handleChange} className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Max" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="salaryType">
                    Salary Type
                  </label>
                  <div className="relative">
                    <select id="salaryType" name="salary_type" value={formData.salary_type} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                      <option value="hourly">Per Hour</option>
                      <option value="daily">Per Day</option>
                      <option value="weekly">Per Week</option>
                      <option value="monthly">Per Month</option>
                      <option value="project">Per Project</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ClockIcon size={18} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Tags
                </label>
                {formData.tags.map((tag, index) => <div key={index} className="flex mb-2">
                    <input type="text" value={tag} onChange={e => handleListItemChange(index, 'tags', e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder={`Tag ${index + 1} (e.g., Flexible Hours, No Experience)`} />
                    <button type="button" onClick={() => removeListItem(index, 'tags')} className="ml-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">
                      -
                    </button>
                  </div>)}
                <button type="button" onClick={() => addListItem('tags')} className="text-teal-500 hover:text-teal-600 font-medium text-sm">
                  + Add Tag
                </button>
              </div>
              <div className="pt-4 flex justify-end space-x-4">
                <button type="button" onClick={togglePreview} className="px-6 py-2 border border-teal-500 text-teal-500 rounded-md font-medium hover:bg-teal-50 transition-colors">
                  Preview
                </button>
                <button type="submit" className="bg-teal-500 text-white px-6 py-2 rounded-md font-medium hover:bg-teal-600 transition-colors shadow-sm">
                  Publish Job Post
                </button>
              </div>
            </form>}
        </div>
      </div>
    </div>
  );
}