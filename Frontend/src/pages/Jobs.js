import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import JobApplicationModal from '../components/JobApplicationModal';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [applicationSubmitting, setApplicationSubmitting] = useState(false);
  const [applicationResult, setApplicationResult] = useState({ success: false, message: '' });
  
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      fetchJobs();
      fetchUserProfile();
    }
  }, [currentUser]);

  const fetchJobs = async () => {
    if (!currentUser) return;
    
    try {
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('userId', '==', currentUser.uid)
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      const jobsList = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJobs(jobsList);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const handleCreateCoverLetter = (job) => {
    navigate('/cover-letter', { 
      state: { 
        job: job 
      } 
    });
  };

  const handleTailorResume = (job) => {
    navigate('/resume-tailoring', { 
      state: { 
        job: job 
      } 
    });
  };

  const handleApplyToJob = (job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
    // Reset application result when opening the modal
    setApplicationResult({ success: false, message: '' });
  };

  const handleCloseApplicationModal = () => {
    setShowApplicationModal(false);
    setSelectedJob(null);
  };

  const handleSubmitApplication = async (formData) => {
    if (!currentUser || !selectedJob) return;
    
    setApplicationSubmitting(true);
    
    try {
      // In a real application, this would submit to the company's application API
      // For demo purposes, we'll simulate a successful submission
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set success message
      setApplicationResult({
        success: true,
        message: `Your application for "${selectedJob.title}" at ${selectedJob.company} has been submitted successfully!`
      });
      
      // In a real application, you might update the job status in Firestore
      // to mark it as "applied"
      
    } catch (error) {
      console.error('Error submitting application:', error);
      setApplicationResult({
        success: false,
        message: 'There was an error submitting your application. Please try again.'
      });
    } finally {
      setApplicationSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy font-serif">Loading saved jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-navy mb-6 font-serif">Saved Jobs</h1>
      
      {jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-lg text-gray-600 mb-4">You haven't saved any jobs yet.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-navy text-white rounded hover:bg-blue-700 transition-colors"
          >
            Browse Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-navy mb-1">{job.title}</h2>
                    <p className="text-md text-gray-700 mb-1">{job.company}</p>
                    <p className="text-sm text-gray-500 mb-4">{job.location}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      title="Delete job"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-medium text-navy mb-2">Job Description</h3>
                  <p className="text-gray-600 mb-4 whitespace-pre-line">
                    {job.description?.substring(0, 200)}
                    {job.description?.length > 200 ? '...' : ''}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={() => handleApplyToJob(job)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Apply Now
                  </button>
                  <button
                    onClick={() => handleCreateCoverLetter(job)}
                    className="px-4 py-2 bg-navy text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Create Cover Letter
                  </button>
                  <button
                    onClick={() => handleTailorResume(job)}
                    className="px-4 py-2 border border-navy text-navy rounded hover:bg-gray-100 transition-colors"
                  >
                    Tailor Resume
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showApplicationModal && selectedJob && (
        <JobApplicationModal
          job={selectedJob}
          userProfile={userProfile}
          onClose={handleCloseApplicationModal}
          onSubmit={handleSubmitApplication}
          isSubmitting={applicationSubmitting}
          applicationResult={applicationResult}
        />
      )}
    </div>
  );
};

export default Jobs; 