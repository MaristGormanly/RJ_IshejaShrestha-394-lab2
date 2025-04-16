import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

const HomeJobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [savingJobs, setSavingJobs] = useState({});
  
  const navigate = useNavigate();
  const BACKEND_URL = 'http://localhost:5000';

  // Fetch random featured jobs when component mounts
  useEffect(() => {
    fetchFeaturedJobs();
  }, []);

  // Function to fetch random featured jobs
  const fetchFeaturedJobs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use a default search term to get some initial jobs
      const defaultSearch = 'software developer';
      const apiUrl = `${BACKEND_URL}/api/jobs?what=${defaultSearch}&results_per_page=5`;
      
      const response = await axios.get(apiUrl);
      
      if (response.data && response.data.results) {
        setJobs(response.data.results);
      } else {
        setError('No jobs found');
      }
    } catch (err) {
      console.error('Error fetching featured jobs:', err);
      setError('Failed to load job listings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to search for jobs
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm && !location) {
      setError('Please enter a job title or location');
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      const encodedWhat = encodeURIComponent(searchTerm);
      const encodedWhere = encodeURIComponent(location);
      const apiUrl = `${BACKEND_URL}/api/jobs?what=${encodedWhat}&where=${encodedWhere}&results_per_page=5`;
      
      const response = await axios.get(apiUrl);
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        setJobs(response.data.results);
      } else {
        setJobs([]);
        setError('No jobs found matching your search criteria');
      }
    } catch (err) {
      console.error('Error searching jobs:', err);
      setError('Failed to search for jobs. Please try again later.');
    } finally {
      setIsSearching(false);
    }
  };

  // Function to save a job
  const saveJob = async (job) => {
    if (!auth.currentUser) {
      alert('Please log in to save jobs');
      return;
    }
    
    setSavingJobs({ ...savingJobs, [job.id]: true });
    
    try {
      await addDoc(collection(db, 'jobs'), {
        id: job.id,
        title: job.title,
        company: job.company.display_name,
        location: job.location.display_name,
        description: job.description,
        salary: job.salary_min && job.salary_max ? 
          `${job.salary_min} - ${job.salary_max} ${job.salary_is_predicted ? '(predicted)' : ''}` : 
          'Salary not specified',
        url: job.redirect_url,
        type: job.contract_time || 'Not specified',
        userId: auth.currentUser.uid,
        savedAt: new Date()
      });
      
      // Show temporary success message
      setSavingJobs({ ...savingJobs, [job.id]: 'saved' });
      setTimeout(() => {
        setSavingJobs(prev => {
          const updated = { ...prev };
          delete updated[job.id];
          return updated;
        });
      }, 2000);
      
    } catch (err) {
      console.error('Error saving job:', err);
      setSavingJobs({ ...savingJobs, [job.id]: false });
    }
  };

  // Function to view all jobs
  const handleViewAllJobs = () => {
    navigate('/jobs');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-navy">Featured Jobs</h2>
        <button 
          onClick={handleViewAllJobs}
          className="text-sm text-navy hover:underline"
        >
          View saved jobs →
        </button>
      </div>
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Job title or keywords"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy focus:border-transparent"
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy focus:border-transparent"
            />
          </div>
          
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2 bg-navy text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-10 h-10 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-6">
          {jobs.map((job) => (
            <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-navy">{job.title}</h3>
                  <p className="text-md text-gray-700 mb-1">{job.company.display_name}</p>
                  <p className="text-sm text-gray-500">{job.location.display_name}</p>
                  
                  {job.salary_min && (
                    <p className="text-sm text-gray-600 mt-2">
                      Salary: {job.salary_min} - {job.salary_max} {job.salary_is_predicted ? '(predicted)' : ''}
                    </p>
                  )}
                </div>
                
                <div>
                  {job.contract_time && (
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                      {job.contract_time}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-4">
                  {job.description.substring(0, 150)}...
                </div>
                
                <div className="flex space-x-3 mt-4">
                  <a 
                    href={job.redirect_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                  >
                    Apply
                  </a>
                  
                  <button
                    onClick={() => saveJob(job)}
                    disabled={savingJobs[job.id]}
                    className={`px-4 py-2 rounded transition-colors text-sm ${
                      savingJobs[job.id] === 'saved'
                        ? 'bg-green-500 text-white'
                        : 'bg-navy text-white hover:bg-blue-700 disabled:bg-gray-400'
                    }`}
                  >
                    {savingJobs[job.id] === true 
                      ? 'Saving...' 
                      : savingJobs[job.id] === 'saved'
                        ? 'Saved!'
                        : 'Save Job'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-600">No jobs found matching your search criteria.</p>
        </div>
      )}
      
      {jobs.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={handleViewAllJobs}
            className="px-6 py-2 border border-navy text-navy rounded-md hover:bg-gray-50 transition-colors"
          >
            View Saved Jobs
          </button>
        </div>
      )}
    </div>
  );
};

export default HomeJobSearch; 