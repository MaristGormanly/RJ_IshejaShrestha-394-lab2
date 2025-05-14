/**
 * Centralized API configuration
 * This file manages API URLs across different environments
 */

// Get the base API URL from environment variables or fall back to the Firebase Functions URL
export const API_BASE_URL = 
  // For local development
  process.env.NODE_ENV === 'development'
    ? (process.env.REACT_APP_API_URL || 'http://localhost:5000')
    // For production, use the Firebase Functions URL - this matches the Firebase hosting pattern
    : 'https://us-central1-landed-41df2.cloudfunctions.net/api';

// Helper function to build a complete API URL
export const getApiUrl = (path) => {
  // Make sure path starts with a slash if it doesn't already
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Check if we're in production (Firebase Functions)
  const isProduction = process.env.NODE_ENV === 'production';
  
  // For local development, keep the /api prefix
  // For production, the path should NOT have /api at the beginning as the Firebase function is already mounted at /api
  if (isProduction) {
    // If running against Firebase Functions, the /api is already in the base URL
    // So remove /api from the beginning of the path if present
    const pathWithoutApiPrefix = formattedPath.startsWith('/api/') 
      ? formattedPath.substring(4) // Remove the /api prefix
      : formattedPath;
      
    return `${API_BASE_URL}${pathWithoutApiPrefix}`;
  }
  
  // In development, keep the /api prefix as it's part of our Express routing
  return `${API_BASE_URL}${formattedPath}`;
};

// Export a preconfigured fetch function
export const fetchApi = async (path, options = {}) => {
  const url = getApiUrl(path);
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

export default {
  API_BASE_URL,
  getApiUrl,
  fetchApi
}; 