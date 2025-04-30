import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, query, where, getDoc, updateDoc } from 'firebase/firestore';
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
        ...doc.data(),
        applied: doc.data().applied || false,
        appliedDate: doc.data().appliedDate || null
      }));
      
      // Sort jobs by savedAt date (newest first)
      jobsList.sort((a, b) => {
        const dateA = a.savedAt?.toDate?.() || new Date(a.savedAt);
        const dateB = b.savedAt?.toDate?.() || new Date(b.savedAt);
        return dateB - dateA;
      });
      
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
      
      // Update the job status to mark it as applied
      await markJobAsApplied(selectedJob.id);
      
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

  const markJobAsApplied = async (jobId) => {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      const now = new Date();
      
      await updateDoc(jobRef, {
        applied: true,
        appliedDate: now
      });
      
      // Update local state
      setJobs(jobs.map(job => 
        job.id === jobId 
          ? { ...job, applied: true, appliedDate: now } 
          : job
      ));
    } catch (error) {
      console.error('Error marking job as applied:', error);
    }
  };

  // Job application statistics
  const appliedJobs = jobs.filter(job => job.applied);
  const savedJobs = jobs.filter(job => !job.applied);
  
  // Get application stats by month (last 6 months)
  const getApplicationStats = () => {
    const last6Months = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      last6Months.push({
        month: month.toLocaleString('default', { month: 'short' }),
        year: month.getFullYear(),
        count: 0
      });
    }
    
    appliedJobs.forEach(job => {
      if (job.appliedDate) {
        const appliedDate = job.appliedDate?.toDate?.() || new Date(job.appliedDate);
        const monthIndex = today.getMonth() - appliedDate.getMonth() + 
                          (12 * (today.getFullYear() - appliedDate.getFullYear()));
        
        if (monthIndex >= 0 && monthIndex < 6) {
          last6Months[monthIndex].count++;
        }
      }
    });
    
    return last6Months.reverse();
  };

  const applicationStats = getApplicationStats();

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
      {/* Application Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-navy mb-4 font-serif">Application Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded shadow-sm">
                <p className="text-sm text-gray-500">Applied Jobs</p>
                <p className="text-2xl font-bold text-navy">{appliedJobs.length}</p>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <p className="text-sm text-gray-500">Saved Jobs</p>
                <p className="text-2xl font-bold text-navy">{savedJobs.length}</p>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold text-navy">
                  {jobs.length > 0 ? Math.round((appliedJobs.length / jobs.length) * 100) : 0}%
                </p>
              </div>
              <div className="bg-white p-3 rounded shadow-sm">
                <p className="text-sm text-gray-500">Applications This Month</p>
                <p className="text-2xl font-bold text-navy">{applicationStats[applicationStats.length - 1]?.count || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Monthly Applications</h3>
            <div className="h-48 flex items-end justify-between">
              {applicationStats.map((stat, index) => (
                <div key={index} className="flex flex-col items-center w-1/6">
                  <div 
                    className="bg-navy w-full rounded-t" 
                    style={{ 
                      height: `${stat.count > 0 ? Math.max(stat.count * 15, 15) : 0}px`,
                      minHeight: stat.count > 0 ? '15px' : '0'
                    }}
                  ></div>
                  <p className="text-xs mt-2">{stat.month}</p>
                  <p className="text-xs text-gray-500">{stat.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Applied Jobs Section */}
      {appliedJobs.length > 0 && (
        <>
          <h2 className="text-2xl font-bold text-navy mb-4 font-serif">Applied Jobs</h2>
          <div className="grid grid-cols-1 gap-6 mb-8">
            {appliedJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-green-500">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-navy mb-1">{job.title}</h2>
                      <p className="text-md text-gray-700 mb-1">{job.company}</p>
                      <p className="text-sm text-gray-500 mb-2">{job.location}</p>
                      {job.salary && (
                        <p className="text-sm text-gray-500 mb-2">{job.salary}</p>
                      )}
                      <div className="flex items-center">
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2">
                          Applied
                        </span>
                        {job.appliedDate && (
                          <p className="text-xs text-gray-400">
                            on {new Date(job.appliedDate.seconds * 1000).toLocaleDateString()}
                          </p>
                        )}
                      </div>
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
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Saved Jobs Section */}
      <h2 className="text-2xl font-bold text-navy mb-4 font-serif">Saved Jobs</h2>
      
      {savedJobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-lg text-gray-600 mb-4">You haven't saved any jobs yet.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-navy text-white rounded hover:bg-blue-700 transition-colors"
          >
            Browse Jobs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {savedJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-navy mb-1">{job.title}</h2>
                    <p className="text-md text-gray-700 mb-1">{job.company}</p>
                    <p className="text-sm text-gray-500 mb-4">{job.location}</p>
                    {job.salary && (
                      <p className="text-sm text-gray-500 mb-4">{job.salary}</p>
                    )}
                    {job.savedAt && (
                      <p className="text-xs text-gray-400">
                        Saved on {new Date(job.savedAt.seconds * 1000).toLocaleDateString()}
                      </p>
                    )}
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
                  {job.url ? (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Apply Now
                    </a>
                  ) : (
                    <button
                      onClick={() => handleApplyToJob(job)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Apply Now
                    </button>
                  )}
                  <button
                    onClick={() => markJobAsApplied(job.id)}
                    className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                  >
                    Applied
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