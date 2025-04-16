import React, { useState, useEffect } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import axios from 'axios';

const JobListings = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [testResult, setTestResult] = useState('');

  // Backend API URL
  const BACKEND_URL = 'http://localhost:5000';

  // Test function to check if backend is reachable
  const testBackendConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      setTestResult('Testing connection...');
      
      const response = await axios.get(`${BACKEND_URL}/api/jobs/test`);
      console.log('Test response:', response.data);
      
      setTestResult(`Connection successful! Server says: ${response.data.message}`);
    } catch (err) {
      console.error('Test connection error:', err);
      setTestResult(`Connection failed: ${err.message}`);
      setError(`Cannot connect to backend at ${BACKEND_URL}. Is the server running?`);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    setTestResult('');
    
    try {
      // Build the API URL with proper encoding of parameters
      const encodedWhat = encodeURIComponent(searchTerm);
      const encodedWhere = encodeURIComponent(location);
      const apiUrl = `${BACKEND_URL}/api/jobs?what=${encodedWhat}&where=${encodedWhere}&page=${page}`;
      
      console.log(`Fetching jobs from: ${apiUrl}`);
      
      // Use axios instead of fetch for better error handling
      const response = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      // Handle API errors
      if (response.status !== 200) {
        throw new Error(response.data?.message || 'Failed to fetch jobs');
      }
      
      const data = response.data;
      console.log(`API returned ${data.results?.length || 0} jobs`);
      
      // Update state with the results
      if (!data.results || data.results.length === 0) {
        setHasMore(false);
        if (page === 1) {
          setJobs([]);
        }
      } else {
        setJobs(page === 1 ? data.results : [...jobs, ...data.results]);
      }
    } catch (err) {
      console.error('Job fetch error:', err);
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        setError(`API error: ${err.response.data?.message || err.message}`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('Error request:', err.request);
        setError('No response received from server. Check if the backend is running.');
      } else {
        // Something happened in setting up the request that triggered an error
        setError(err.message || 'An error occurred while fetching jobs');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setHasMore(true);
    fetchJobs();
  };

  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  useEffect(() => {
    if (page > 1) {
      fetchJobs();
    }
  }, [page]);

  const saveJob = async (job) => {
    try {
      await addDoc(collection(db, 'jobs'), {
        title: job.title,
        company: job.company.display_name,
        location: job.location.display_name,
        description: job.description,
        salary: job.salary_min && job.salary_max ? `${job.salary_min} - ${job.salary_max} ${job.salary_is_predicted ? '(predicted)' : ''}` : 'Not specified',
        url: job.redirect_url,
        createdAt: new Date(),
        status: 'pending'
      });
      
      alert('Job saved successfully!');
    } catch (err) {
      console.error('Error saving job:', err);
      alert('Failed to save job. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Job Listings</h2>
      
      {/* Test connection button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={testBackendConnection}
          disabled={loading}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mr-2"
        >
          Test Backend Connection
        </button>
        
        {testResult && (
          <span className={testResult.includes('successful') ? 'text-green-600' : 'text-red-600'}>
            {testResult}
          </span>
        )}
      </div>
      
      <form onSubmit={handleSearch} className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[250px]">
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
            Job Title or Keywords
          </label>
          <input
            id="searchTerm"
            type="text"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="e.g. Software Developer"
          />
        </div>
        
        <div className="flex-1 min-w-[250px]">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            id="location"
            type="text"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. New York, London"
          />
        </div>
        
        <div className="w-full flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading && page === 1 ? 'Searching...' : 'Search Jobs'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}
      
      <div className="space-y-4">
        {jobs.map((job, index) => (
          <div key={index} className="bg-white p-4 rounded-md shadow-md">
            <h3 className="text-lg font-semibold">{job.title}</h3>
            <p className="text-sm text-gray-600 mb-2">
              {job.company.display_name} • {job.location.display_name}
            </p>
            
            {job.salary_min && (
              <p className="text-sm mb-2">
                Salary: {job.salary_min} - {job.salary_max} {job.salary_is_predicted ? '(predicted)' : ''}
              </p>
            )}
            
            <div className="text-sm mb-3" dangerouslySetInnerHTML={{ __html: job.description }} />
            
            <div className="flex space-x-2">
              <a 
                href={job.redirect_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Apply
              </a>
              <button
                onClick={() => saveJob(job)}
                className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {jobs.length > 0 && hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            {loading ? 'Loading more...' : 'Load More'}
          </button>
        </div>
      )}
      
      {jobs.length === 0 && !loading && !error && (
        <div className="text-center py-8">
          <p className="text-gray-500">Search for jobs to see results</p>
        </div>
      )}
    </div>
  );
};

export default JobListings; 