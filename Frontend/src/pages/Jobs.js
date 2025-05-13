import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, query, where, getDoc, updateDoc, serverTimestamp, writeBatch, setDoc } from 'firebase/firestore';
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

  // Define formatDate function at the top of the component
  const formatDate = (dateObj) => {
    if (!dateObj) return 'Unknown date';
    
    try {
      // Handle Firebase Timestamp
      if (dateObj.toDate && typeof dateObj.toDate === 'function') {
        return dateObj.toDate().toLocaleDateString();
      }
      
      // Handle timestamp seconds
      if (dateObj.seconds) {
        return new Date(dateObj.seconds * 1000).toLocaleDateString();
      }
      
      // Handle Date object or string
      return new Date(dateObj).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error, dateObj);
      return 'Invalid date';
    }
  };

  useEffect(() => {
    if (currentUser) {
      // First migrate jobs to ensure all jobs are in the user subcollection
      const runMigration = async () => {
        await migrateJobsToUserSubcollection();
        // Then fetch jobs after migration is complete
        await fetchJobs();
        fetchUserProfile();
      };
      
      runMigration();
    }
  }, [currentUser]);

  const fetchJobs = async () => {
    if (!currentUser) return;
    
    try {
      console.log('Current user ID:', currentUser.uid);
      
      // Try to get jobs from user subcollection first
      const userJobsRef = collection(db, 'users', currentUser.uid, 'user_jobs');
      const userJobsSnapshot = await getDocs(userJobsRef);
      
      console.log('User subcollection jobs count:', userJobsSnapshot.docs.length);
      
      let jobsList = [];
      
      if (userJobsSnapshot.docs.length > 0) {
        // If we have jobs in the user subcollection, use those
        console.log('Using jobs from user subcollection');
        
        // Inspect the first job document structure
        if (userJobsSnapshot.docs.length > 0) {
          console.log('Sample user subcollection job document data:', userJobsSnapshot.docs[0].data());
        }
        
        jobsList = userJobsSnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Debug log for each job's applied status
          console.log(`Job ${doc.id} - ${data.title} - Applied status:`, data.applied, typeof data.applied);
          
          return {
            id: doc.id,
            ...data,
            // Explicitly convert applied to boolean to avoid null/undefined issues
            applied: data.applied === true,
            appliedDate: data.appliedDate || null
          };
        });
      } else {
        // Otherwise fall back to the main jobs collection
        console.log('Falling back to main jobs collection');
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('userId', '==', currentUser.uid)
        );
        const jobsSnapshot = await getDocs(jobsQuery);
        console.log('Fetched jobs count:', jobsSnapshot.docs.length);
        
        // Inspect the first job document structure
        if (jobsSnapshot.docs.length > 0) {
          console.log('Sample job document data:', jobsSnapshot.docs[0].data());
        }
        
        jobsList = jobsSnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Debug log for each job's applied status
          console.log(`Job ${doc.id} - ${data.title} - Applied status:`, data.applied, typeof data.applied);
          
          return {
            id: doc.id,
            ...data,
            // Explicitly convert applied to boolean to avoid null/undefined issues
            applied: data.applied === true,
            appliedDate: data.appliedDate || null
          };
        });
      }
      
      // Log raw data for applied status debugging
      console.log('Jobs raw data before sorting:');
      jobsList.forEach(job => {
        console.log(`Job ${job.id} - Title: ${job.title}, Applied: ${job.applied}, Type: ${typeof job.applied}`);
      });
      
      // Sort jobs by savedAt date (newest first)
      jobsList.sort((a, b) => {
        const dateA = a.savedAt?.toDate?.() || new Date(a.savedAt);
        const dateB = b.savedAt?.toDate?.() || new Date(b.savedAt);
        return dateB - dateA;
      });
      
      // Final filtering count check
      const appliedCount = jobsList.filter(job => job.applied === true).length;
      const savedCount = jobsList.filter(job => job.applied !== true).length;
      console.log(`After processing: Total jobs: ${jobsList.length}, Applied: ${appliedCount}, Saved: ${savedCount}`);
      
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

  // Migration function to move jobs to user subcollection if needed
  const migrateJobsToUserSubcollection = async () => {
    if (!currentUser) return;
    
    try {
      console.log('Attempting to migrate jobs to user subcollection');
      // Check if we need to migrate by looking at the main jobs collection
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('userId', '==', currentUser.uid)
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      
      if (jobsSnapshot.docs.length === 0) {
        console.log('No jobs to migrate');
        return;
      }
      
      console.log(`Found ${jobsSnapshot.docs.length} jobs to potentially migrate`);
      
      // Force migration regardless of whether user subcollection already has jobs
      console.log('Starting migration to user subcollection');
      let batch = writeBatch(db);
      let migratedCount = 0;
      
      // Add each job to the user's subcollection
      for (const docSnapshot of jobsSnapshot.docs) {
        const jobData = docSnapshot.data();
        const userJobRef = doc(db, 'users', currentUser.uid, 'user_jobs', docSnapshot.id);
        
        // Check if job already exists in user collection
        const existingJob = await getDoc(userJobRef);
        if (!existingJob.exists()) {
          console.log(`Migrating job ${docSnapshot.id} - ${jobData.title || 'Unknown title'}`);
          
          // Set the applied field explicitly to a boolean
          const applied = jobData.applied === true;
          
          // Prepare job data for migration
          const dataToMigrate = {
            ...jobData,
            userId: currentUser.uid,
            applied: applied, // Make sure this is a boolean
            migratedAt: serverTimestamp()
          };
          
          batch.set(userJobRef, dataToMigrate);
          migratedCount++;
          
          // Commit in batches of 20 to avoid running into limits
          if (migratedCount % 20 === 0) {
            await batch.commit();
            console.log(`Committed batch of ${migratedCount} jobs`);
            batch = writeBatch(db);
          }
        } else {
          console.log(`Job ${docSnapshot.id} already exists in user collection, skipping`);
        }
      }
      
      // Commit any remaining jobs
      if (migratedCount % 20 !== 0) {
        await batch.commit();
      }
      
      console.log(`Migration completed successfully. Migrated ${migratedCount} jobs.`);
      
      // Refresh the jobs list after migration
      fetchJobs();
      
    } catch (error) {
      console.error('Error migrating jobs:', error);
    }
  };

  // Try a different approach for saving jobs using user subcollection
  const saveJobToUserSubcollection = async (job) => {
    if (!currentUser) {
      alert('Please log in to save jobs');
      return false;
    }
    
    try {
      console.log('Saving job to user subcollection:', job.id);
      const jobRef = doc(db, 'users', currentUser.uid, 'user_jobs', job.id);
      
      await setDoc(jobRef, {
        ...job,
        userId: currentUser.uid,
        savedAt: serverTimestamp()
      });
      
      console.log('Job saved to user subcollection successfully');
      return true;
    } catch (error) {
      console.error('Error saving job to user subcollection:', error);
      return false;
    }
  };

  // Alternative function to delete from user subcollection
  const deleteJobFromUserSubcollection = async (jobId) => {
    if (!currentUser) return false;
    
    try {
      console.log('Deleting job from user subcollection:', jobId);
      const jobRef = doc(db, 'users', currentUser.uid, 'user_jobs', jobId);
      await deleteDoc(jobRef);
      console.log('Job deleted from user subcollection successfully');
      return true;
    } catch (error) {
      console.error('Error deleting job from user subcollection:', error);
      return false;
    }
  };

  // Alternative function to mark job as applied in user subcollection
  const markJobAsAppliedInUserSubcollection = async (jobId) => {
    if (!currentUser) return false;
    
    try {
      console.log('Marking job as applied in user subcollection:', jobId);
      const jobRef = doc(db, 'users', currentUser.uid, 'user_jobs', jobId);
      
      // First check if the job exists in the subcollection
      const jobDoc = await getDoc(jobRef);
      
      if (!jobDoc.exists()) {
        console.log('Job not found in user subcollection, fetching from main collection');
        
        // Try to get job data from main collection
        const mainJobRef = doc(db, 'jobs', jobId);
        const mainJobDoc = await getDoc(mainJobRef);
        
        if (!mainJobDoc.exists()) {
          console.error('Job not found in main collection either');
          return false;
        }
        
        // Copy job data to user subcollection
        const jobData = mainJobDoc.data();
        console.log('Copying job to user subcollection:', jobData);
        
        // Set the job in user subcollection with applied explicitly set to boolean true
        await setDoc(jobRef, {
          ...jobData,
          userId: currentUser.uid, // Ensure userId is set
          applied: true, // Explicitly set to boolean true
          appliedDate: serverTimestamp()
        });
        
        console.log('Job created and marked as applied in user subcollection');
        return true;
      } else {
        // Job exists in subcollection, just update it with applied explicitly set to boolean true
        await updateDoc(jobRef, {
          applied: true, // Explicitly set to boolean true
          appliedDate: serverTimestamp()
        });
        console.log('Job marked as applied in user subcollection');
        return true;
      }
    } catch (error) {
      console.error('Error marking job as applied in user subcollection:', error);
      return false;
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      console.log('Deleting job:', jobId);
      
      // First try to delete from the user subcollection
      const userSubcollectionResult = await deleteJobFromUserSubcollection(jobId);
      if (userSubcollectionResult) {
        console.log('Job deleted from user subcollection successfully');
        setJobs(jobs.filter(job => job.id !== jobId));
        return;
      }
      
      // If that fails, try the original approach with batch
      const batch = writeBatch(db);
      const jobRef = doc(db, 'jobs', jobId);
      
      // Get the job first to verify ownership
      const jobDoc = await getDoc(jobRef);
      if (!jobDoc.exists()) {
        console.error('Job does not exist');
        return;
      }
      
      const jobData = jobDoc.data();
      console.log('Job to delete data:', jobData);
      
      // Verify owner
      if (jobData.userId !== currentUser.uid) {
        console.error('Not authorized to delete this job');
        return;
      }
      
      // Delete the job
      batch.delete(jobRef);
      await batch.commit();
      
      console.log('Job deleted successfully');
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Error deleting job: ' + error.message);
    }
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
      console.log('Marking job as applied:', jobId);
      
      // First try to migrate the job to user subcollection if needed
      await migrateJobToUserSubcollection(jobId);
      
      // Then try to mark as applied in user subcollection
      const userSubcollectionResult = await markJobAsAppliedInUserSubcollection(jobId);
      if (userSubcollectionResult) {
        console.log('Job marked as applied in user subcollection successfully');
        // Update local state with a proper boolean true
        setJobs(jobs.map(job => 
          job.id === jobId 
            ? { ...job, applied: true, appliedDate: new Date() } 
            : job
        ));
        
        // Re-fetch jobs to ensure state is synchronized with database
        fetchJobs();
        return;
      }
      
      // If not found in user subcollection, try to find the job in the local state
      console.log('Job not found in user subcollection, trying alternative approach');
      const jobToUpdate = jobs.find(job => job.id === jobId);
      
      if (!jobToUpdate) {
        console.error('Job not found in local state');
        alert('Job not found. Please refresh the page and try again.');
        return;
      }
      
      // We have the job data in our local state, try to create it in the user subcollection
      console.log('Creating job in user subcollection from local state');
      const jobRef = doc(db, 'users', currentUser.uid, 'user_jobs', jobId);
      
      // Create job in user subcollection with applied explicitly set to boolean true
      await setDoc(jobRef, {
        ...jobToUpdate,
        userId: currentUser.uid,
        applied: true, // Boolean true
        appliedDate: serverTimestamp()
      });
      
      console.log('Job created and marked as applied in user subcollection');
      
      // Update local state with a proper boolean true
      setJobs(jobs.map(job => 
        job.id === jobId 
          ? { ...job, applied: true, appliedDate: new Date() } 
          : job
      ));
      
      // Re-fetch jobs to ensure state is synchronized with database
      fetchJobs();
    } catch (error) {
      console.error('Error marking job as applied:', error);
      alert('Error marking job as applied: ' + error.message);
    }
  };

  // Fix the job filtering logic
  const appliedJobs = jobs.filter(job => job.applied === true);
  const savedJobs = jobs.filter(job => job.applied !== true);
  
  // Debug logging for job statistics
  console.log('All jobs count:', jobs.length);
  console.log('Applied jobs count:', appliedJobs.length);
  console.log('Saved jobs count:', savedJobs.length);
  console.log('Sample applied job date:', appliedJobs.length > 0 ? appliedJobs[0].appliedDate : 'No applied jobs');
  
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
        console.log('Processing job for stats:', job.title);
        console.log('Raw appliedDate:', job.appliedDate);
        
        try {
          // Use our formatDate helper to get a valid date string
          const dateStr = formatDate(job.appliedDate);
          const appliedDate = new Date(dateStr);
          
          console.log('Parsed date for stats:', appliedDate);
          
          if (!isNaN(appliedDate.getTime())) {
            const monthIndex = today.getMonth() - appliedDate.getMonth() + 
                             (12 * (today.getFullYear() - appliedDate.getFullYear()));
            
            console.log('Month index for stats:', monthIndex);
            
            if (monthIndex >= 0 && monthIndex < 6) {
              last6Months[monthIndex].count++;
            }
          } else {
            console.error('Invalid date format for job:', job.id);
          }
        } catch (error) {
          console.error('Error processing date for job stats:', error, job.appliedDate);
        }
      }
    });
    
    const result = last6Months.reverse();
    console.log('Final application stats:', result);
    return result;
  };

  const applicationStats = getApplicationStats();

  // Add this function to migrate a specific job
  const migrateJobToUserSubcollection = async (jobId) => {
    if (!currentUser) return false;
    
    try {
      console.log('Migrating specific job to user subcollection:', jobId);
      
      // Get the job from the main collection
      const mainJobRef = doc(db, 'jobs', jobId);
      const mainJobDoc = await getDoc(mainJobRef);
      
      if (!mainJobDoc.exists()) {
        console.error('Job not found in main collection');
        return false;
      }
      
      // Get job data
      const jobData = mainJobDoc.data();
      
      // Create the job in the user subcollection
      const userJobRef = doc(db, 'users', currentUser.uid, 'user_jobs', jobId);
      await setDoc(userJobRef, {
        ...jobData,
        userId: currentUser.uid // Ensure userId is set
      });
      
      console.log('Job migrated to user subcollection successfully');
      return true;
    } catch (error) {
      console.error('Error migrating job:', error);
      return false;
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

      {/* Saved Jobs Section */}
      <h2 className="text-2xl font-bold text-navy mb-4 font-serif">Saved Jobs</h2>
      
      {savedJobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center mb-8">
          <p className="text-lg text-gray-600 mb-4">You haven't saved any jobs yet.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-navy text-white rounded hover:bg-blue-700 transition-colors"
          >
            Browse Jobs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 mb-8">
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
                        Saved on {formatDate(job.savedAt)}
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
                            on {formatDate(job.appliedDate)}
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