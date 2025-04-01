import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

const JobCard = ({ job }) => {
  const [isSaving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const saveJob = async () => {
    if (!auth.currentUser) {
      setError('Please log in to save jobs');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Add job to Firestore with the current user ID
      await addDoc(collection(db, 'jobs'), {
        ...job,
        userId: auth.currentUser.uid,
        savedAt: new Date()
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving job:', err);
      setError('Failed to save job. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-navy mb-1">{job.title}</h2>
            <p className="text-md text-gray-700 mb-1">{job.company}</p>
            <p className="text-sm text-gray-500 mb-4">{job.location}</p>
            {job.salary && <p className="text-sm text-gray-500 mb-4">{job.salary}</p>}
          </div>
          <div>
            {job.type && (
              <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                {job.type}
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="font-medium text-navy mb-2">Job Description</h3>
          <p className="text-gray-600 mb-4 whitespace-pre-line">
            {job.description?.substring(0, 200)}
            {job.description?.length > 200 ? '...' : ''}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-6">
          {job.posted && <span className="text-xs text-gray-500">Posted: {job.posted}</span>}
          <button
            onClick={saveJob}
            disabled={isSaving || saveSuccess}
            className={`px-4 py-2 rounded transition-colors ${
              saveSuccess 
                ? 'bg-green-500 text-white' 
                : 'bg-navy text-white hover:bg-blue-700'
            }`}
          >
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Job'}
          </button>
        </div>
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
};

export default JobCard; 