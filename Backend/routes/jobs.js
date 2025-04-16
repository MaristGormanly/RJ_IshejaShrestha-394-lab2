const express = require('express');
const router = express.Router();
const axios = require('axios');

// Get environment variables
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;

// Simple route for testing
router.get('/test', (req, res) => {
  res.json({ message: 'Jobs API is working!' });
});

/**
 * @route   GET /api/jobs
 * @desc    Search for jobs using the Adzuna API
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Get parameters from request
    const { what, where, page = 1, results_per_page = 10 } = req.query;
    
    if (!what && !where) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide at least one search parameter (what or where)' 
      });
    }
    
    // Log request info
    console.log(`Job search request: what=${what}, where=${where}, page=${page}`);
    
    // API URL
    const baseUrl = 'https://api.adzuna.com/v1/api/jobs/us/search/' + page;
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      app_id: ADZUNA_APP_ID,
      app_key: ADZUNA_API_KEY,
      results_per_page
    });
    
    // Add optional parameters
    if (what) queryParams.append('what', what);
    if (where) queryParams.append('where', where);
    
    const apiUrl = `${baseUrl}?${queryParams.toString()}`;
    console.log('Calling API:', apiUrl);
    
    // Make the API call
    const response = await axios.get(apiUrl);
    
    // Verify we got a successful response with data
    if (!response.data) {
      throw new Error('Empty response from API');
    }
    
    // Log success info
    console.log(`API Success! Found ${response.data.results?.length || 0} jobs`);
    
    // Send response back to client
    return res.json(response.data);
    
  } catch (error) {
    console.error('Error fetching jobs:', error.message);
    
    // Handle different error types
    if (error.response) {
      // The API returned an error response
      console.error('API error status:', error.response.status);
      return res.status(error.response.status).json({
        success: false,
        message: 'API Error: ' + error.message
      });
    } else {
      // General error
      return res.status(500).json({
        success: false,
        message: 'Server error: ' + error.message
      });
    }
  }
});

module.exports = router; 