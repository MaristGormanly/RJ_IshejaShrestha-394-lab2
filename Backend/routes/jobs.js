const express = require('express');
const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Jobs API is working!' });
});

/**
 * @route   GET /api/jobs
 * @desc    Search for jobs - currently returns mock data
 * @access  Public
 */
router.get('/', (req, res) => {
  try {
    console.log('Jobs route hit! Query:', req.query);
    
    // Get parameters from request
    const { what, where } = req.query;
    console.log(`Job search request: what=${what}, where=${where}`);
    
    // Return mock data
    return res.json({
      count: 5,
      results: [
        {
          id: "mock-job-1",
          title: "Software Developer",
          description: "This is a mock job description for a software developer position. We are looking for experienced developers to join our team.",
          created: new Date().toISOString(),
          company: { display_name: "Demo Company Inc." },
          location: { display_name: "San Francisco, CA" },
          salary_min: 80000,
          salary_max: 120000,
          salary_is_predicted: true,
          contract_time: "full_time",
          redirect_url: "https://example.com/job/software-developer"
        },
        {
          id: "mock-job-2",
          title: "Frontend Engineer",
          description: "Join our team as a Frontend Engineer. Experience with React, Vue, or Angular required. Remote work available.",
          created: new Date().toISOString(),
          company: { display_name: "Tech Solutions LLC" },
          location: { display_name: "Remote" },
          salary_min: 90000,
          salary_max: 130000,
          salary_is_predicted: true,
          contract_time: "full_time",
          redirect_url: "https://example.com/job/frontend-engineer"
        },
        {
          id: "mock-job-3",
          title: "Data Scientist",
          description: "Looking for a data scientist with experience in machine learning and statistical analysis.",
          created: new Date().toISOString(),
          company: { display_name: "Data Analytics Corp" },
          location: { display_name: "New York, NY" },
          salary_min: 95000,
          salary_max: 145000,
          salary_is_predicted: true,
          contract_time: "full_time",
          redirect_url: "https://example.com/job/data-scientist"
        },
        {
          id: "mock-job-4",
          title: "DevOps Engineer",
          description: "Seeking a DevOps engineer to help us streamline our deployment processes and manage cloud infrastructure.",
          created: new Date().toISOString(),
          company: { display_name: "Cloud Systems Inc." },
          location: { display_name: "Austin, TX" },
          salary_min: 85000,
          salary_max: 125000,
          salary_is_predicted: true,
          contract_time: "full_time",
          redirect_url: "https://example.com/job/devops-engineer"
        },
        {
          id: "mock-job-5",
          title: "UI/UX Designer",
          description: "Join our creative team as a UI/UX designer. Create beautiful and functional interfaces for our products.",
          created: new Date().toISOString(),
          company: { display_name: "Creative Designs Co." },
          location: { display_name: "Seattle, WA" },
          salary_min: 75000,
          salary_max: 115000,
          salary_is_predicted: true,
          contract_time: "full_time",
          redirect_url: "https://example.com/job/uiux-designer"
        }
      ]
    });
  } catch (error) {
    console.error('Error in jobs route:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error - mock data unavailable'
    });
  }
});

module.exports = router; 